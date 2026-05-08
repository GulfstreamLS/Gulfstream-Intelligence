import os
import uuid
from urllib.parse import quote


class StorageService:
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "").strip()
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
        self._client = None

    def _gcs_available(self) -> bool:
        """GCS requires a valid lowercase bucket name and existing credentials file."""
        if not self.bucket_name or self.bucket_name != self.bucket_name.lower():
            return False
        if not self.credentials_path or not os.path.exists(self.credentials_path):
            return False
        return True

    @property
    def client(self):
        if self._client is None:
            from google.cloud import storage
            if self.credentials_path and os.path.exists(self.credentials_path):
                self._client = storage.Client.from_service_account_json(self.credentials_path)
            else:
                self._client = storage.Client()
        return self._client

    async def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        if self._gcs_available():
            return await self._upload_gcs(content, filename, content_type)
        return await self._upload_local(content, filename)

    async def _upload_gcs(self, content: bytes, filename: str, content_type: str) -> str:
        safe_filename = filename.replace(" ", "_")
        blob_name = f"{uuid.uuid4()}-{safe_filename}"
        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(f"regulatory-docs/{blob_name}")
            blob.upload_from_string(content, content_type=content_type)
            encoded = quote(f"regulatory-docs/{blob_name}", safe="/")
            return f"https://storage.googleapis.com/{self.bucket_name}/{encoded}"
        except Exception as e:
            raise RuntimeError(f"Failed to upload file to GCS: {str(e)}")

    async def _upload_local(self, content: bytes, filename: str) -> str:
        media_dir = os.path.join(os.getcwd(), "media", "uploads")
        os.makedirs(media_dir, exist_ok=True)
        safe_filename = filename.replace(" ", "_")
        blob_name = f"{uuid.uuid4()}-{safe_filename}"
        with open(os.path.join(media_dir, blob_name), "wb") as f:
            f.write(content)
        # Store as a relative path so the served URL is always built from the
        # current BASE_URL at response time — never baked in as localhost.
        return f"/media/uploads/{quote(blob_name, safe='/')}"


storage_service = StorageService()
