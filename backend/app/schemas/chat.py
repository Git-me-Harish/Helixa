import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str = Field(default="New conversation", max_length=255)


class SessionUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class SessionResponse(BaseModel):
    id: uuid.UUID
    title: str
    is_archived: bool
    created_at: datetime
    last_updated: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    image_data: str | None = None  # base64 data URI, present on user messages with an image
    model_used: str | None
    extracted_entities: dict | None
    rag_sources: list[str] | None
    rag_grounding: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(default="", max_length=8000)
    session_id: uuid.UUID | None = None
    # Vision: base64-encoded image data URI (e.g. "data:image/jpeg;base64,...")
    image_data: str | None = Field(default=None, max_length=8_000_000)  # ~6 MB image cap
    image_media_type: str | None = None  # "image/jpeg" | "image/png" | "image/webp"


class SessionDetail(BaseModel):
    session: SessionResponse
    messages: list[MessageResponse]
