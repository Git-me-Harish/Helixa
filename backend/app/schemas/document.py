import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    original_filename: str
    mime_type: str
    file_size_bytes: int | None
    document_type: str | None
    processing_status: str
    processing_error: str | None
    ai_summary: dict[str, Any] | None
    entities_extracted: dict[str, Any] | None
    uploaded_at: datetime
    processed_at: datetime | None

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    processing_status: str
    processing_error: str | None
    processed_at: datetime | None

    model_config = {"from_attributes": True}
