from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class FileOut(BaseModel):
    id: str
    name: str
    type: str
    size: int
    s3Key: str
    s3Url: Optional[str] = None
    status: Optional[str] = "ready"
    chunkCount: Optional[int] = 0
    createdAt: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UploadResponse(BaseModel):
    success: bool = True
    file: FileOut
    message: Optional[str] = "File uploaded and processed successfully"

class FilesListResponse(BaseModel):
    success: bool = True
    files: List[FileOut]
