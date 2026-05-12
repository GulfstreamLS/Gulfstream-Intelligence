variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name (used as resource name prefix)"
  type        = string
  default     = "gulfstream"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Must be staging or production."
  }
}

variable "backend_image" {
  description = "Backend Docker image (gcr.io/PROJECT/backend:TAG)"
  type        = string
}

variable "frontend_image" {
  description = "Frontend Docker image (gcr.io/PROJECT/frontend:TAG)"
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# ── Stripe Configuration ──────────────────────────────────────────────────────
variable "stripe_secret_key" {
  description = "Stripe Secret Key"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe Publishable Key"
  type        = string
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
}

variable "stripe_price_starter_monthly" { type = string }
variable "stripe_price_starter_annual" { type = string }
variable "stripe_price_professional_monthly" { type = string }
variable "stripe_price_professional_annual" { type = string }
variable "stripe_price_business_monthly" { type = string }
variable "stripe_price_business_annual" { type = string }

# ── Email Configuration ───────────────────────────────────────────────────────
variable "smtp_user" {
  description = "SMTP User Email"
  type        = string
}

variable "smtp_password" {
  description = "SMTP Password"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Frontend URL"
  type        = string
}
