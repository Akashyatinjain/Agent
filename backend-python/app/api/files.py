from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.api.deps import get_current_user
from app.services.file_service import FileService
from app.schemas.files import UploadResponse, FilesListResponse
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a document for knowledge base ingestion and RAG vector indexing."""
    buffer = await file.read()
    file_out = await FileService.upload(
        filename=file.filename or "uploaded_file",
        content_type=file.content_type or "application/octet-stream",
        buffer=buffer,
        user_id=current_user.id,
        db=db
    )
    return UploadResponse(
        success=True,
        file=file_out,
        message="File uploaded and queued for vector embedding"
    )

@router.get("", response_model=FilesListResponse)
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all uploaded files for current user."""
    files = await FileService.list_files(current_user.id, db)
    return FilesListResponse(success=True, files=files)

@router.delete("/{id}", response_model=SuccessResponse)
async def delete_file(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an uploaded file and its indexed vectors."""
    await FileService.delete_file(id, current_user.id, db)
    return SuccessResponse(success=True, message="File deleted successfully")
