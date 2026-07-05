"""Appointments router with AI pre-appointment prep."""

import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select

from app.core.deps import CurrentUser, DbSession
from app.models.appointment import Appointment, AppointmentStatus
from app.services.ai_service import generate_appointment_prep
from app.routers.health_records import get_summary

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


class AppointmentCreate(BaseModel):
    doctor_name: str = Field(min_length=1, max_length=200)
    speciality: str | None = Field(default=None, max_length=100)
    appointment_dt: str
    location: str | None = Field(default=None, max_length=300)
    notes: str | None = Field(default=None, max_length=2000)


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    doctor_name: str
    speciality: str | None
    appointment_dt: str
    location: str | None
    notes: str | None
    ai_prep_notes: str | None
    status: str

    model_config = {"from_attributes": True}

    def model_post_init(self, __context) -> None:
        if hasattr(self, "_appointment_dt_raw"):
            pass


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(body: AppointmentCreate, current_user: CurrentUser, db: DbSession) -> AppointmentResponse:
    from datetime import datetime
    try:
        apt_dt = datetime.fromisoformat(body.appointment_dt)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid datetime format")

    appt = Appointment(
        patient_id=current_user.id,
        doctor_name=body.doctor_name,
        speciality=body.speciality,
        appointment_dt=apt_dt,
        location=body.location,
        notes=body.notes,
    )
    db.add(appt)
    await db.flush()

    # Generate AI prep notes in the background (non-blocking)
    try:
        health_sum = await get_summary(current_user, db)
        prep = await generate_appointment_prep(health_sum.model_dump(), body.notes or "")
        appt.ai_prep_notes = prep
        await db.flush()
    except Exception:
        pass  # Prep notes are optional

    return _to_response(appt)


@router.get("", response_model=list[AppointmentResponse])
async def list_appointments(current_user: CurrentUser, db: DbSession) -> list[AppointmentResponse]:
    result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == current_user.id)
        .order_by(desc(Appointment.appointment_dt))
        .limit(50)
    )
    return [_to_response(a) for a in result.scalars().all()]


@router.get("/{appt_id}", response_model=AppointmentResponse)
async def get_appointment(appt_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> AppointmentResponse:
    result = await db.execute(
        select(Appointment).where(Appointment.id == appt_id, Appointment.patient_id == current_user.id)
    )
    appt = result.scalar_one_or_none()
    if appt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return _to_response(appt)


class StatusUpdate(BaseModel):
    status: str


@router.patch("/{appt_id}/status", response_model=AppointmentResponse)
async def update_status(
    appt_id: uuid.UUID, body: StatusUpdate, current_user: CurrentUser, db: DbSession
) -> AppointmentResponse:
    if body.status not in [s.value for s in AppointmentStatus]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status")

    result = await db.execute(
        select(Appointment).where(Appointment.id == appt_id, Appointment.patient_id == current_user.id)
    )
    appt = result.scalar_one_or_none()
    if appt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    appt.status = AppointmentStatus(body.status)
    await db.flush()
    return _to_response(appt)


@router.delete("/{appt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(appt_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(Appointment).where(Appointment.id == appt_id, Appointment.patient_id == current_user.id)
    )
    appt = result.scalar_one_or_none()
    if appt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    await db.delete(appt)


def _to_response(appt: Appointment) -> AppointmentResponse:
    return AppointmentResponse(
        id=appt.id,
        doctor_name=appt.doctor_name,
        speciality=appt.speciality,
        appointment_dt=appt.appointment_dt.isoformat(),
        location=appt.location,
        notes=appt.notes,
        ai_prep_notes=appt.ai_prep_notes,
        status=appt.status.value if hasattr(appt.status, "value") else str(appt.status),
    )
