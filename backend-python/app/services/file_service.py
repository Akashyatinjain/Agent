import time
import re
import asyncio
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.models import File, generate_cuid
from app.db.database import AsyncSessionLocal
from app.storage.s3 import storage_service
from app.rag.ingestion import process_file_for_rag
from app.rag.store import in_memory_store
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.logging import logger
from app.schemas.files import FileOut

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

class FileService:
    @staticmethod
    async def upload(
        filename: str,
        content_type: str,
        buffer: bytes,
        user_id: str,
        db: AsyncSession
    ) -> FileOut:
        if not buffer or len(buffer) == 0:
            raise BadRequestException(code="EMPTY_FILE", message="The uploaded file is empty.")

        if len(buffer) > MAX_FILE_SIZE_BYTES:
            raise BadRequestException(
                code="FILE_TOO_LARGE",
                message=f"File exceeds maximum allowed size of 10 MB ({len(buffer) / (1024*1024):.1f} MB provided)."
            )

        clean_name = re.sub(r'[^a-zA-Z0-9.\-_]', '_', filename)
        s3_key = f"users/{user_id}/files/{int(time.time() * 1000)}-{clean_name}"

        # Upload to S3 or local disk
        storage_url = storage_service.upload_file(buffer, s3_key, content_type)

        new_file = File(
            id=generate_cuid(),
            name=filename,
            type=content_type or "application/octet-stream",
            size=len(buffer),
            s3Key=s3_key,
            userId=user_id
        )
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)

        in_memory_store.save_file({
            "id": new_file.id,
            "name": new_file.name,
            "type": new_file.type,
            "size": new_file.size,
            "s3Key": new_file.s3Key,
            "s3Url": storage_url,
            "userId": user_id,
            "status": "processing",
            "chunkCount": 0
        })

        # Trigger background RAG processing asynchronously
        async def run_rag_ingestion(fid: str, uid: str, buf: bytes, mime: str, fname: str):
            async with AsyncSessionLocal() as local_db:
                await process_file_for_rag(
                    file_id=fid,
                    user_id=uid,
                    buffer=buf,
                    mime_type=mime,
                    filename=fname,
                    db=local_db
                )

        asyncio.create_task(run_rag_ingestion(new_file.id, user_id, buffer, content_type, filename))

        out = FileOut(
            id=new_file.id,
            name=new_file.name,
            type=new_file.type,
            size=new_file.size,
            s3Key=new_file.s3Key,
            s3Url=storage_url,
            status="processing",
            chunkCount=0,
            createdAt=new_file.createdAt
        )
        return out

    @staticmethod
    async def list_files(user_id: str, db: AsyncSession) -> List[FileOut]:
        stmt = select(File).where(File.userId == user_id).order_by(File.createdAt.desc())
        res = await db.execute(stmt)
        db_files = res.scalars().all()

        mem_files = in_memory_store.get_documents(user_id)
        file_map = {}

        for f in db_files:
            file_map[f.id] = FileOut(
                id=f.id,
                name=f.name,
                type=f.type,
                size=f.size,
                s3Key=f.s3Key,
                s3Url=f"/uploads/{f.s3Key.split('/')[-1]}",
                status="ready",
                chunkCount=0,
                createdAt=f.createdAt
            )

        for mf in in_memory_store.files:
            if mf.get("userId") == user_id and mf.get("id") in file_map:
                file_map[mf["id"]].status = mf.get("status", "ready")
                file_map[mf["id"]].chunkCount = mf.get("chunkCount", 0)

        return list(file_map.values())

    @staticmethod
    async def delete_file(file_id: str, user_id: str, db: AsyncSession) -> bool:
        stmt = select(File).where(File.id == file_id, File.userId == user_id)
        res = await db.execute(stmt)
        file_record = res.scalar_one_or_none()

        if file_record:
            storage_service.delete_file(file_record.s3Key)
            await db.delete(file_record)
            await db.commit()

        in_memory_store.delete_file(file_id, user_id)
        return True
