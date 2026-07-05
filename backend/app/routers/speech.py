"""Speech-to-text endpoint for voice input in the chat interface."""

from fastapi import APIRouter, HTTPException, UploadFile, status

from app.core.deps import CurrentUser
from app.services.speech_service import transcribe

router = APIRouter(prefix="/api/speech", tags=["speech"])

ALLOWED_AUDIO = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/x-wav"}


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile, current_user: CurrentUser) -> dict:
    if file.content_type not in ALLOWED_AUDIO:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Audio file required (wav, mp3, mp4, webm, ogg)",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB cap for audio
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Audio file too large")

    ext = (file.filename or "audio.wav").rsplit(".", 1)[-1].lower()
    result = transcribe(content, ext)
    return result
