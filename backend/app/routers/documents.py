"""Document upload, OCR processing, and analysis router."""

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, UploadFile, status
from sqlalchemy import desc, select

from app.config import settings
from app.core.deps import CurrentUser, DbSession
from app.core.limiter import limiter
from app.database import AsyncSessionLocal
from app.models.document import MedicalDocument, ProcessingStatus
from app.schemas.document import DocumentResponse, DocumentStatusResponse
from app.services import ai_service, nlp_service, ocr_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

MAX_SIZE_BYTES = settings.max_upload_size_mb * 1024 * 1024

# Magic-byte signatures → canonical mime type
_MAGIC: list[tuple[bytes, int, str]] = [
    (b"%PDF-", 0, "application/pdf"),
    (b"\xff\xd8\xff", 0, "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", 0, "image/png"),
    (b"II\x2a\x00", 0, "image/tiff"),
    (b"MM\x00\x2a", 0, "image/tiff"),
    (b"RIFF", 0, "image/webp"),   # also need "WEBP" at offset 8 — checked below
    (b"BM", 0, "image/bmp"),
]
_CHUNK = 16  # bytes needed to identify any of the above


def _detect_mime(header: bytes) -> str | None:
    """Return canonical MIME type from magic bytes, or None if unrecognised."""
    for magic, offset, mime in _MAGIC:
        if header[offset : offset + len(magic)] == magic:
            if mime == "image/webp" and header[8:12] != b"WEBP":
                continue
            return mime
    return None


@router.post("/upload", response_model=DocumentStatusResponse, status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.upload_rate_limit)
async def upload_document(
    request: Request,
    file: UploadFile,
    current_user: CurrentUser,
    db: DbSession,
    background_tasks: BackgroundTasks,
) -> DocumentStatusResponse:
    # --- Sprint 2 #9: streaming size check (abort before full buffer) ---
    content_chunks: list[bytes] = []
    total = 0
    async for chunk in file:
        total += len(chunk)
        if total > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds {settings.max_upload_size_mb} MB limit",
            )
        content_chunks.append(chunk)
    content = b"".join(content_chunks)

    # --- Sprint 2 #6: magic-bytes validation (client content_type is spoofable) ---
    detected_mime = _detect_mime(content[:_CHUNK])
    if detected_mime is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="File content does not match a supported type. Upload PDF or image files.",
        )

    # Store file with UUID name, user-scoped directory
    user_dir = Path(settings.upload_dir) / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "upload").suffix or ".bin"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = user_dir / stored_name
    stored_path.write_bytes(content)

    doc = MedicalDocument(
        patient_id=current_user.id,
        original_filename=file.filename or "upload",
        stored_filename=stored_name,
        mime_type=detected_mime,
        file_size_bytes=len(content),
        processing_status=ProcessingStatus.PENDING,
    )
    db.add(doc)
    await db.flush()
    doc_id = doc.id
    await db.commit()

    background_tasks.add_task(_process_document, doc_id, str(stored_path))

    return DocumentStatusResponse(
        id=doc_id,
        processing_status=ProcessingStatus.PENDING,
        processing_error=None,
        processed_at=None,
    )


async def _process_document(doc_id: uuid.UUID, file_path: str) -> None:
    """Background task: OCR → NLP entities → AI summary → persist."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(MedicalDocument).where(MedicalDocument.id == doc_id))
        doc = result.scalar_one_or_none()
        if doc is None:
            return

        doc.processing_status = ProcessingStatus.PROCESSING
        await db.commit()

        try:
            # Step 1: OCR
            ocr_result = ocr_service.extract_text(file_path)
            ocr_text = ocr_result.get("text", "")

            # Step 2: NLP entity extraction
            entities = nlp_service.extract_entities(ocr_text) if ocr_text else {}

            # Step 3: AI document summary
            ai_summary = await ai_service.summarize_document(ocr_text, entities) if ocr_text else {
                "document_type": "Unknown",
                "key_findings": ["No text could be extracted from this document"],
                "medications_found": [],
                "values_found": [],
                "recommended_actions": [],
                "urgency": "routine",
                "summary": "No text was extractable from the uploaded document.",
            }

            result = await db.execute(select(MedicalDocument).where(MedicalDocument.id == doc_id))
            doc = result.scalar_one_or_none()
            if doc:
                doc.ocr_text = ocr_text
                doc.entities_extracted = entities
                doc.ai_summary = ai_summary
                doc.document_type = ai_summary.get("document_type")
                doc.processing_status = ProcessingStatus.COMPLETED
                doc.processed_at = datetime.now(timezone.utc)
                await db.commit()

        except Exception as exc:
            result = await db.execute(select(MedicalDocument).where(MedicalDocument.id == doc_id))
            doc = result.scalar_one_or_none()
            if doc:
                doc.processing_status = ProcessingStatus.FAILED
                doc.processing_error = str(exc)[:500]
                await db.commit()


@router.get("", response_model=list[DocumentResponse])
async def list_documents(current_user: CurrentUser, db: DbSession) -> list[DocumentResponse]:
    result = await db.execute(
        select(MedicalDocument)
        .where(MedicalDocument.patient_id == current_user.id)
        .order_by(desc(MedicalDocument.uploaded_at))
        .limit(50)
    )
    return [DocumentResponse.model_validate(d) for d in result.scalars().all()]


@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_status(doc_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> DocumentStatusResponse:
    result = await db.execute(
        select(MedicalDocument).where(
            MedicalDocument.id == doc_id, MedicalDocument.patient_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentStatusResponse.model_validate(doc)


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> DocumentResponse:
    result = await db.execute(
        select(MedicalDocument).where(
            MedicalDocument.id == doc_id, MedicalDocument.patient_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentResponse.model_validate(doc)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(MedicalDocument).where(
            MedicalDocument.id == doc_id, MedicalDocument.patient_id == current_user.id
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Delete the stored file
    user_dir = Path(settings.upload_dir) / str(current_user.id)
    file_path = user_dir / doc.stored_filename
    try:
        file_path.unlink(missing_ok=True)
    except Exception as exc:
        logger.error("Failed to delete file %s: %s", file_path, exc, exc_info=True)

    await db.delete(doc)
