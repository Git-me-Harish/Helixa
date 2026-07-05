"""Health records router: vitals, medications, allergies, medical history, summary."""

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import and_, desc, select

from app.core.deps import CurrentUser, DbSession
from app.models.health_record import Allergy, MedicalHistory, Medication, VitalSign
from app.schemas.health_record import (
    AllergyCreate,
    AllergyResponse,
    HealthSummary,
    MedHistoryCreate,
    MedHistoryResponse,
    MedicationCreate,
    MedicationResponse,
    VitalSignCreate,
    VitalSignResponse,
)

router = APIRouter(prefix="/api/records", tags=["health-records"])


# ─── Vitals ──────────────────────────────────────────────────────────────────

@router.post("/vitals", response_model=VitalSignResponse, status_code=status.HTTP_201_CREATED)
async def log_vital(body: VitalSignCreate, current_user: CurrentUser, db: DbSession) -> VitalSignResponse:
    vital = VitalSign(
        patient_id=current_user.id,
        recorded_at=body.recorded_at or datetime.now(timezone.utc),
        **{k: v for k, v in body.model_dump(exclude={"recorded_at"}).items()},
    )
    db.add(vital)
    await db.flush()
    return VitalSignResponse.model_validate(vital)


@router.get("/vitals", response_model=list[VitalSignResponse])
async def get_vitals(
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[VitalSignResponse]:
    q = select(VitalSign).where(VitalSign.patient_id == current_user.id)
    if start:
        q = q.where(VitalSign.recorded_at >= start)
    if end:
        q = q.where(VitalSign.recorded_at <= end)
    q = q.order_by(desc(VitalSign.recorded_at)).limit(limit)
    result = await db.execute(q)
    return [VitalSignResponse.model_validate(v) for v in result.scalars().all()]


@router.delete("/vitals/{vital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vital(vital_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(VitalSign).where(VitalSign.id == vital_id, VitalSign.patient_id == current_user.id)
    )
    vital = result.scalar_one_or_none()
    if vital is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vital sign not found")
    await db.delete(vital)


# ─── Medications ──────────────────────────────────────────────────────────────

@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def add_medication(body: MedicationCreate, current_user: CurrentUser, db: DbSession) -> MedicationResponse:
    med = Medication(patient_id=current_user.id, **body.model_dump())
    db.add(med)
    await db.flush()
    return MedicationResponse.model_validate(med)


@router.get("/medications", response_model=list[MedicationResponse])
async def get_medications(
    current_user: CurrentUser,
    db: DbSession,
    active_only: bool = False,
) -> list[MedicationResponse]:
    q = select(Medication).where(Medication.patient_id == current_user.id)
    if active_only:
        q = q.where(Medication.is_active == True)
    q = q.order_by(desc(Medication.created_at))
    result = await db.execute(q)
    return [MedicationResponse.model_validate(m) for m in result.scalars().all()]


@router.put("/medications/{med_id}", response_model=MedicationResponse)
async def update_medication(
    med_id: uuid.UUID, body: MedicationCreate, current_user: CurrentUser, db: DbSession
) -> MedicationResponse:
    result = await db.execute(
        select(Medication).where(Medication.id == med_id, Medication.patient_id == current_user.id)
    )
    med = result.scalar_one_or_none()
    if med is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    for k, v in body.model_dump().items():
        setattr(med, k, v)
    await db.flush()
    return MedicationResponse.model_validate(med)


@router.delete("/medications/{med_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medication(med_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(Medication).where(Medication.id == med_id, Medication.patient_id == current_user.id)
    )
    med = result.scalar_one_or_none()
    if med is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    med.is_active = False  # soft delete


# ─── Allergies ────────────────────────────────────────────────────────────────

@router.post("/allergies", response_model=AllergyResponse, status_code=status.HTTP_201_CREATED)
async def add_allergy(body: AllergyCreate, current_user: CurrentUser, db: DbSession) -> AllergyResponse:
    allergy = Allergy(patient_id=current_user.id, **body.model_dump())
    db.add(allergy)
    await db.flush()
    return AllergyResponse.model_validate(allergy)


@router.get("/allergies", response_model=list[AllergyResponse])
async def get_allergies(current_user: CurrentUser, db: DbSession) -> list[AllergyResponse]:
    result = await db.execute(
        select(Allergy).where(Allergy.patient_id == current_user.id).order_by(Allergy.severity)
    )
    return [AllergyResponse.model_validate(a) for a in result.scalars().all()]


@router.delete("/allergies/{allergy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allergy(allergy_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(Allergy).where(Allergy.id == allergy_id, Allergy.patient_id == current_user.id)
    )
    allergy = result.scalar_one_or_none()
    if allergy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allergy not found")
    await db.delete(allergy)


# ─── Medical History ──────────────────────────────────────────────────────────

@router.post("/history", response_model=MedHistoryResponse, status_code=status.HTTP_201_CREATED)
async def add_history(body: MedHistoryCreate, current_user: CurrentUser, db: DbSession) -> MedHistoryResponse:
    entry = MedicalHistory(patient_id=current_user.id, **body.model_dump())
    db.add(entry)
    await db.flush()
    return MedHistoryResponse.model_validate(entry)


@router.get("/history", response_model=list[MedHistoryResponse])
async def get_history(current_user: CurrentUser, db: DbSession) -> list[MedHistoryResponse]:
    result = await db.execute(
        select(MedicalHistory)
        .where(MedicalHistory.patient_id == current_user.id)
        .order_by(desc(MedicalHistory.created_at))
    )
    return [MedHistoryResponse.model_validate(h) for h in result.scalars().all()]


@router.put("/history/{entry_id}", response_model=MedHistoryResponse)
async def update_history(
    entry_id: uuid.UUID, body: MedHistoryCreate, current_user: CurrentUser, db: DbSession
) -> MedHistoryResponse:
    result = await db.execute(
        select(MedicalHistory).where(
            MedicalHistory.id == entry_id, MedicalHistory.patient_id == current_user.id
        )
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History entry not found")
    for k, v in body.model_dump().items():
        setattr(entry, k, v)
    await db.flush()
    return MedHistoryResponse.model_validate(entry)


# ─── Health Summary ───────────────────────────────────────────────────────────

@router.get("/summary", response_model=HealthSummary)
async def get_summary(current_user: CurrentUser, db: DbSession) -> HealthSummary:
    vitals_result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == current_user.id)
        .order_by(desc(VitalSign.recorded_at))
        .limit(1)
    )
    latest_vital = vitals_result.scalar_one_or_none()

    meds_result = await db.execute(
        select(Medication).where(Medication.patient_id == current_user.id, Medication.is_active == True)
    )
    allergies_result = await db.execute(
        select(Allergy).where(Allergy.patient_id == current_user.id)
    )
    history_result = await db.execute(
        select(MedicalHistory).where(
            MedicalHistory.patient_id == current_user.id,
            MedicalHistory.status.in_(["active", "chronic"]),
        )
    )
    vitals_count_result = await db.execute(
        select(VitalSign).where(VitalSign.patient_id == current_user.id)
    )

    medications = meds_result.scalars().all()
    allergies = allergies_result.scalars().all()
    conditions = history_result.scalars().all()
    vital_count = len(vitals_count_result.scalars().all())

    return HealthSummary(
        latest_vitals={
            "bp_systolic": latest_vital.bp_systolic,
            "bp_diastolic": latest_vital.bp_diastolic,
            "heart_rate": latest_vital.heart_rate,
            "weight_kg": latest_vital.weight_kg,
            "glucose_mmol": latest_vital.glucose_mmol,
            "spo2_pct": latest_vital.spo2_pct,
            "temp_celsius": latest_vital.temp_celsius,
            "recorded_at": latest_vital.recorded_at.isoformat(),
        } if latest_vital else None,
        active_medications=[
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "id": str(m.id)}
            for m in medications
        ],
        allergies=[
            {"substance": a.substance, "severity": a.severity, "id": str(a.id)}
            for a in allergies
        ],
        active_conditions=[
            {"condition": c.condition, "status": c.status, "icd10_code": c.icd10_code, "id": str(c.id)}
            for c in conditions
        ],
        vital_count=vital_count,
    )
