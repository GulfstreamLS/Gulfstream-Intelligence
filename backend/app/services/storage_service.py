import os
import uuid

from google.cloud import storage


class StorageService:
    def __init__(self):
        # Using GCS_BUCKET_NAME to match your .env file
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                if self.credentials_path and os.path.exists(self.credentials_path):
                    self._client = storage.Client.from_service_account_json(self.credentials_path)
                else:
                    # Fallback to default credentials (e.g. if running in Cloud Run)
                    self._client = storage.Client()
            except Exception as e:
                raise RuntimeError(f"Failed to initialize GCS Client: {str(e)}")
        return self._client

    async def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        """
        Uploads a file directly to GCP bucket. No local fallback.
        """
        if not self.bucket_name:
            raise ValueError("GCS_BUCKET_NAME is not configured in environment variables.")

        blob_name = f"{uuid.uuid4()}-{filename}"

        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(f"regulatory-docs/{blob_name}")
            blob.upload_from_string(content, content_type=content_type)
            
            return f"https://storage.googleapis.com/{self.bucket_name}/regulatory-docs/{blob_name}"
        except Exception as e:
            raise RuntimeError(f"Failed to upload file to GCS: {str(e)}")


storage_service = StorageService()
