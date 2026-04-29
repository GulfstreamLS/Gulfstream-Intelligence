terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
  backend "gcs" {
    bucket = "REPLACE_WITH_YOUR_TF_STATE_BUCKET"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Cloud SQL (PostgreSQL) ────────────────────────────────────────────────────
resource "google_sql_database_instance" "main" {
  name             = "${var.app_name}-pg"
  database_version = "POSTGRES_16"
  region           = var.region
  deletion_protection = true

  settings {
    tier              = var.db_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }
  }
}

resource "google_sql_database" "app" {
  name     = var.app_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = var.app_name
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# ── VPC ───────────────────────────────────────────────────────────────────────
resource "google_compute_network" "main" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_global_address" "private_ip" {
  name          = "${var.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}

# ── Redis (Memorystore) ───────────────────────────────────────────────────────
resource "google_redis_instance" "main" {
  name           = "${var.app_name}-redis"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  authorized_network = google_compute_network.main.id
}

# ── Cloud Run — Backend ───────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.app_name}-backend"
  location = var.region

  template {
    service_account = google_service_account.backend.email

    vpc_access {
      network_interfaces {
        network    = google_compute_network.main.name
        subnetwork = google_compute_subnetwork.main.name
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.backend_image

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name = "SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.secret_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql+asyncpg://${var.app_name}:${var.db_password}@/${var.app_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.main.host}:${google_redis_instance.main.port}/0"
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }
    }

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = 10
    }
  }
}

# ── Cloud Run — Frontend ──────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.app_name}-frontend"
  location = var.region

  template {
    containers {
      image = var.frontend_image

      env {
        name  = "BACKEND_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
    }

    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = 10
    }
  }
}

# Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── Secret Manager ────────────────────────────────────────────────────────────
resource "google_secret_manager_secret" "secret_key" {
  secret_id = "${var.app_name}-secret-key"
  replication { auto {} }
}

# ── Service Accounts ──────────────────────────────────────────────────────────
resource "google_service_account" "backend" {
  account_id   = "${var.app_name}-backend"
  display_name = "Backend Service Account"
}

resource "google_project_iam_member" "backend_cloudsql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_secretmanager" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_compute_subnetwork" "main" {
  name          = "${var.app_name}-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}
