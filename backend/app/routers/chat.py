"""AI chat router with SSE streaming, session management, entity extraction."""

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.models.chat import ChatMessage, ChatSession
from app.models.health_record import Allergy, MedicalHistory, Medication, VitalSign
from app.schemas.chat import (
    ChatRequest,
    MessageResponse,
    SessionCreate,
    SessionDetail,
    SessionResponse,
    SessionUpdate,
)
from app.services import ai_service, rag_service, nlp_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def _get_health_context(user_id: uuid.UUID, db) -> dict:
    """Pull recent vitals, active medications, allergies, and active conditions for AI context."""
    vitals_result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == user_id)
        .order_by(desc(VitalSign.recorded_at))
        .limit(1)
    )
    latest_vital = vitals_result.scalar_one_or_none()

    meds_result = await db.execute(
        select(Medication)
        .where(Medication.patient_id == user_id, Medication.is_active == True)
        .limit(10)
    )
    medications = meds_result.scalars().all()

    allergies_result = await db.execute(
        select(Allergy).where(Allergy.patient_id == user_id)
    )
    allergies = allergies_result.scalars().all()

    conditions_result = await db.execute(
        select(MedicalHistory)
        .where(
            MedicalHistory.patient_id == user_id,
            MedicalHistory.status.in_(["active", "chronic"]),
        )
        .limit(10)
    )
    conditions = conditions_result.scalars().all()

    return {
        "latest_vitals": {
            "bp_systolic": latest_vital.bp_systolic if latest_vital else None,
            "bp_diastolic": latest_vital.bp_diastolic if latest_vital else None,
            "heart_rate": latest_vital.heart_rate if latest_vital else None,
            "weight_kg": latest_vital.weight_kg if latest_vital else None,
            "glucose_mmol": latest_vital.glucose_mmol if latest_vital else None,
            "spo2_pct": latest_vital.spo2_pct if latest_vital else None,
        } if latest_vital else None,
        "active_medications": [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency}
            for m in medications
        ],
        "allergies": [
            {"substance": a.substance, "severity": a.severity.value, "reaction": a.reaction_type}
            for a in allergies
        ],
        "active_conditions": [
            {"condition": c.condition, "status": c.status.value, "icd10": c.icd10_code}
            for c in conditions
        ],
    }


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(current_user: CurrentUser, db: DbSession) -> list[SessionResponse]:
    # Single query: sessions + per-session message count via LEFT JOIN / GROUP BY
    counts_sq = (
        select(ChatMessage.session_id, func.count(ChatMessage.id).label("msg_count"))
        .group_by(ChatMessage.session_id)
        .subquery()
    )
    result = await db.execute(
        select(ChatSession, counts_sq.c.msg_count)
        .outerjoin(counts_sq, ChatSession.id == counts_sq.c.session_id)
        .where(ChatSession.patient_id == current_user.id, ChatSession.is_archived == False)
        .order_by(desc(ChatSession.last_updated))
        .limit(50)
    )
    return [
        SessionResponse(
            id=s.id,
            title=s.title,
            is_archived=s.is_archived,
            created_at=s.created_at,
            last_updated=s.last_updated,
            message_count=count or 0,
        )
        for s, count in result.all()
    ]


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(body: SessionCreate, current_user: CurrentUser, db: DbSession) -> SessionResponse:
    session = ChatSession(patient_id=current_user.id, title=body.title)
    db.add(session)
    await db.flush()
    return SessionResponse(
        id=session.id,
        title=session.title,
        is_archived=session.is_archived,
        created_at=session.created_at,
        last_updated=session.last_updated,
        message_count=0,
    )


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(session_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> SessionDetail:
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.patient_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return SessionDetail(
        session=SessionResponse(
            id=session.id,
            title=session.title,
            is_archived=session.is_archived,
            created_at=session.created_at,
            last_updated=session.last_updated,
            message_count=len(session.messages),
        ),
        messages=[MessageResponse.model_validate(m) for m in session.messages],
    )


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: uuid.UUID, body: SessionUpdate, current_user: CurrentUser, db: DbSession
) -> SessionResponse:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.patient_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.title = body.title
    await db.flush()
    return SessionResponse.model_validate(session)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.patient_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.is_archived = True
    await db.flush()


@router.post("/sessions/{session_id}/stream")
async def stream_message(
    session_id: uuid.UUID,
    body: ChatRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> StreamingResponse:
    # Validate session ownership
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.patient_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Load recent message history for context
    hist_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(desc(ChatMessage.created_at))
        .limit(10)
    )
    history_rows = list(reversed(hist_result.scalars().all()))
    history = [{"role": m.role, "content": m.content} for m in history_rows]

    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=body.message)
    db.add(user_msg)
    await db.flush()

    # Update session timestamp & auto-title on first message
    session.last_updated = datetime.now(timezone.utc)
    if session.title == "New conversation" and len(history) == 0:
        session.title = body.message[:60] + ("..." if len(body.message) > 60 else "")
    await db.commit()

    # Build context
    health_ctx = await _get_health_context(current_user.id, db)
    # `asearch` offloads the blocking embedding + local-Qdrant call to a worker
    # thread — the previous direct `search()` call ran synchronously on the
    # event loop inside this async handler, serializing latency across every
    # concurrent chat request.
    rag_chunks = await rag_service.asearch(body.message)

    # Distinguish *why* no reference chunks were injected, rather than
    # collapsing "KB never ingested" and "nothing relevant to this question"
    # into the same empty list. This label is what makes RAG's failure mode
    # observable to the patient instead of silently degrading.
    if rag_chunks:
        rag_grounding = "grounded"
    elif rag_service.is_initialized():
        rag_grounding = "no_match"
    else:
        rag_grounding = "unavailable"

    async def event_generator():
        full_response = []
        model_used = "unknown"

        try:
            async for chunk, model_name in ai_service.stream_chat(
                history, body.message, health_ctx, rag_chunks
            ):
                full_response.append(chunk)
                model_used = model_name
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk, 'model': model_name})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"
            return

        # Persist assistant message with entities
        complete_text = "".join(full_response)
        entities = nlp_service.extract_entities(complete_text)

        async with db:
            assistant_msg = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=complete_text,
                model_used=model_used,
                extracted_entities=entities,
                rag_sources=[c["source"] for c in rag_chunks] if rag_chunks else None,
                rag_grounding=rag_grounding,
            )
            db.add(assistant_msg)
            await db.commit()

        yield f"data: {json.dumps({'type': 'done', 'entities': entities, 'rag_sources': [c['source'] for c in rag_chunks], 'rag_grounding': rag_grounding})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
