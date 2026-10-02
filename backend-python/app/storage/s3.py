import os
from pathlib import Path
from typing import Optional
import boto3
from botocore.config import Config

from app.core.config import settings
from app.core.logging import logger

class StorageService:
    def __init__(self):
        self.s3_client = None
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    "s3",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    config=Config(signature_version="s3v4")
                )
                logger.info("Storage: AWS S3 Client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize S3 client: {e}")
                self.s3_client = None
        else:
            logger.info("Storage: Using Local Disk Storage mode for uploaded documents")

    def upload_file(self, file_bytes: bytes, s3_key: str, mime_type: str = "application/octet-stream") -> str:
        """Upload file to AWS S3 or fallback to local disk storage."""
        if not self.s3_client:
            filename = Path(s3_key).name
            target_path = Path(settings.UPLOAD_DIR) / filename
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            server_url = settings.SERVER_URL.rstrip("/")
            return f"{server_url}/uploads/{filename}"

        try:
            self.s3_client.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=s3_key,
                Body=file_bytes,
                ContentType=mime_type
            )
            return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
        except Exception as e:
            logger.error(f"S3 upload error, falling back to local disk: {e}")
            filename = Path(s3_key).name
            target_path = Path(settings.UPLOAD_DIR) / filename
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "wb") as f:
                f.write(file_bytes)
            server_url = settings.SERVER_URL.rstrip("/")
            return f"{server_url}/uploads/{filename}"

    def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3 or local disk."""
        if not self.s3_client:
            filename = Path(s3_key).name
            target_path = Path(settings.UPLOAD_DIR) / filename
            if target_path.exists():
                try:
                    target_path.unlink()
                except Exception:
                    pass
            return True

        try:
            self.s3_client.delete_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=s3_key
            )
            return True
        except Exception as e:
            logger.warning(f"S3 delete error: {e}")
            return False

storage_service = StorageService()
