import os
import uuid

from google.cloud import storage


class StorageService:
    def __init__(self):
        self.bucket_name = os.getenv("GCP_BUCKET_NAME")
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if self.credentials_path:
                self._client = storage.Client.from_service_account_json(self.credentials_path)
            else:
                # Fallback to default credentials (e.g. if running in GKE/GAE)
                self._client = storage.Client()
        return self._client

    async def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        """
        Uploads a file to GCP bucket OR local storage fallback.
        """
        blob_name = f"{uuid.uuid4()}-{filename}"

        if not self.bucket_name or not os.path.exists(self.credentials_path or ""):
            # --- LOCAL FALLBACK ---
            media_path = "/app/media"
            if not os.path.exists(media_path):
                os.makedirs(media_path, exist_ok=True)

            local_file_path = os.path.join(media_path, blob_name)
            with open(local_file_path, "wb") as f:
                f.write(content)

            # Return a local URL (we will serve this in main.py)
            return f"/media/{blob_name}"

        # --- GCP STORAGE ---
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(f"regulatory-docs/{blob_name}")
        blob.upload_from_string(content, content_type=content_type)
        return f"https://storage.googleapis.com/{self.bucket_name}/regulatory-docs/{blob_name}"


storage_service = StorageService()
