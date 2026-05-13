import asyncio
import os
import uuid
from urllib.parse import quote


class StorageService:
    def __init__(self):
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "").strip()
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
        self._client = None

    def _gcs_available(self) -> bool:
        """GCS only needs a valid bucket name. On Cloud Run, ADC is used automatically."""
        return bool(self.bucket_name) and self.bucket_name == self.bucket_name.lower()

    @property
    def client(self):
        if self._client is None:
            from google.cloud import storage
            if self.credentials_path and os.path.exists(self.credentials_path):
                self._client = storage.Client.from_service_account_json(self.credentials_path)
            else:
                # Cloud Run: uses Application Default Credentials automatically
                self._client = storage.Client()
        return self._client

    async def upload_file(self, content: bytes, filename: str, content_type: str) -> str:
        if self._gcs_available():
            return await self._upload_gcs(content, filename, content_type)
        return await self._upload_local(content, filename)

    async def _upload_gcs(self, content: bytes, filename: str, content_type: str) -> str:
        safe_filename = filename.replace(" ", "_")
        blob_name = f"{uuid.uuid4()}-{safe_filename}"

        def _do_upload():
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(f"regulatory-docs/{blob_name}")
            blob.upload_from_string(content, content_type=content_type)

        try:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _do_upload)
            encoded = quote(f"regulatory-docs/{blob_name}", safe="/")
            return f"https://storage.googleapis.com/{self.bucket_name}/{encoded}"
        except Exception as e:
            raise RuntimeError(f"Failed to upload file to GCS: {str(e)}")

    async def _upload_local(self, content: bytes, filename: str) -> str:
        media_dir = os.path.join(os.getcwd(), "media", "uploads")
        os.makedirs(media_dir, exist_ok=True)
        safe_filename = filename.replace(" ", "_")
        blob_name = f"{uuid.uuid4()}-{safe_filename}"

        def _do_write():
            with open(os.path.join(media_dir, blob_name), "wb") as f:
                f.write(content)

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _do_write)
        # Store as a relative path so the served URL is always built from the
        # current BASE_URL at response time — never baked in as localhost.
        return f"/media/uploads/{quote(blob_name, safe='/')}"


storage_service = StorageService()
