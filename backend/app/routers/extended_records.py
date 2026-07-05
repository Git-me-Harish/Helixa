"""Extended records router: wellness, vaccinations, family, emergency contacts,
insurance, symptoms, SOAP notes, treatment plans."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import desc, select
from typing import Annotated

from app.core.deps import CurrentUser, DbSession
from app.models.extended_records import (
    EmergencyContact,
    FamilyMember,
    Insurance,
    SOAPNote,
    SymptomLog,
    TreatmentPlan,
    Vaccination,
    WellnessEntry,
)
from app.schemas.extended_records import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    FamilyMemberCreate,
    FamilyMemberResponse,
    InsuranceCreate,
    InsuranceResponse,
    SOAPNoteCreate,
    SOAPNoteResponse,
    SymptomCreate,
    SymptomResponse,
    TreatmentPlanCreate,
    TreatmentPlanResponse,
    VaccinationCreate,
    VaccinationResponse,
    WellnessCreate,
    WellnessResponse,
)

router = APIRouter(tags=["extended-records"])


# ─── Wellness ─────────────────────────────────────────────────────────────────

@router.post("/api/wellness", response_model=WellnessResponse, status_code=status.HTTP_201_CREATED)
async def log_wellness(body: WellnessCreate, current_user: CurrentUser, db: DbSession) -> WellnessResponse:
    entry = WellnessEntry(
        patient_id=current_user.id,
        category=body.category,
        value=body.value,
        unit=body.unit,
        notes=body.notes,
        logged_at=body.logged_at or datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()
    return WellnessResponse.model_validate(entry)


@router.get("/api/wellness", response_model=list[WellnessResponse])
async def get_wellness(
    current_user: CurrentUser,
    db: DbSession,
    category: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[WellnessResponse]:
    q = select(WellnessEntry).where(WellnessEntry.patient_id == current_user.id)
    if category:
        q = q.where(WellnessEntry.category == category)
    q = q.order_by(desc(WellnessEntry.logged_at)).limit(limit)
    result = await db.execute(q)
    return [WellnessResponse.model_validate(e) for e in result.scalars().all()]


@router.delete("/api/wellness/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wellness(entry_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(WellnessEntry).where(WellnessEntry.id == entry_id, WellnessEntry.patient_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wellness entry not found")
    await db.delete(entry)


# ─── Vaccinations ─────────────────────────────────────────────────────────────

@router.post("/api/vaccinations", response_model=VaccinationResponse, status_code=status.HTTP_201_CREATED)
async def add_vaccination(body: VaccinationCreate, current_user: CurrentUser, db: DbSession) -> VaccinationResponse:
    vacc = Vaccination(patient_id=current_user.id, **body.model_dump())
    db.add(vacc)
    await db.flush()
    return VaccinationResponse.model_validate(vacc)


@router.get("/api/vaccinations", response_model=list[VaccinationResponse])
async def get_vaccinations(current_user: CurrentUser, db: DbSession) -> list[VaccinationResponse]:
    result = await db.execute(
        select(Vaccination)
        .where(Vaccination.patient_id == current_user.id)
        .order_by(desc(Vaccination.created_at))
    )
    return [VaccinationResponse.model_validate(v) for v in result.scalars().all()]


@router.put("/api/vaccinations/{vacc_id}", response_model=VaccinationResponse)
async def update_vaccination(
    vacc_id: uuid.UUID, body: VaccinationCreate, current_user: CurrentUser, db: DbSession
) -> VaccinationResponse:
    result = await db.execute(
        select(Vaccination).where(Vaccination.id == vacc_id, Vaccination.patient_id == current_user.id)
    )
    vacc = result.scalar_one_or_none()
    if vacc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination not found")
    for k, v in body.model_dump().items():
        setattr(vacc, k, v)
    await db.flush()
    return VaccinationResponse.model_validate(vacc)


@router.delete("/api/vaccinations/{vacc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vaccination(vacc_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(Vaccination).where(Vaccination.id == vacc_id, Vaccination.patient_id == current_user.id)
    )
    vacc = result.scalar_one_or_none()
    if vacc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination not found")
    await db.delete(vacc)


# ─── Family Members ───────────────────────────────────────────────────────────

@router.post("/api/family", response_model=FamilyMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_family_member(body: FamilyMemberCreate, current_user: CurrentUser, db: DbSession) -> FamilyMemberResponse:
    member = FamilyMember(patient_id=current_user.id, **body.model_dump())
    db.add(member)
    await db.flush()
    return FamilyMemberResponse.model_validate(member)


@router.get("/api/family", response_model=list[FamilyMemberResponse])
async def get_family_members(current_user: CurrentUser, db: DbSession) -> list[FamilyMemberResponse]:
    result = await db.execute(
        select(FamilyMember)
        .where(FamilyMember.patient_id == current_user.id)
        .order_by(FamilyMember.name)
    )
    return [FamilyMemberResponse.model_validate(m) for m in result.scalars().all()]


@router.put("/api/family/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: uuid.UUID, body: FamilyMemberCreate, current_user: CurrentUser, db: DbSession
) -> FamilyMemberResponse:
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.patient_id == current_user.id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
    for k, v in body.model_dump().items():
        setattr(member, k, v)
    await db.flush()
    return FamilyMemberResponse.model_validate(member)


@router.delete("/api/family/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_family_member(member_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(FamilyMember).where(FamilyMember.id == member_id, FamilyMember.patient_id == current_user.id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
    await db.delete(member)


# ─── Emergency Contacts ───────────────────────────────────────────────────────

@router.post("/api/emergency-contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def add_emergency_contact(
    body: EmergencyContactCreate, current_user: CurrentUser, db: DbSession
) -> EmergencyContactResponse:
    contact = EmergencyContact(patient_id=current_user.id, **body.model_dump())
    db.add(contact)
    await db.flush()
    return EmergencyContactResponse.model_validate(contact)


@router.get("/api/emergency-contacts", response_model=list[EmergencyContactResponse])
async def get_emergency_contacts(current_user: CurrentUser, db: DbSession) -> list[EmergencyContactResponse]:
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.patient_id == current_user.id)
        .order_by(desc(EmergencyContact.is_primary), EmergencyContact.name)
    )
    return [EmergencyContactResponse.model_validate(c) for c in result.scalars().all()]


@router.put("/api/emergency-contacts/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: uuid.UUID, body: EmergencyContactCreate, current_user: CurrentUser, db: DbSession
) -> EmergencyContactResponse:
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id, EmergencyContact.patient_id == current_user.id
        )
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    for k, v in body.model_dump().items():
        setattr(contact, k, v)
    await db.flush()
    return EmergencyContactResponse.model_validate(contact)


@router.delete("/api/emergency-contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(contact_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.id == contact_id, EmergencyContact.patient_id == current_user.id
        )
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await db.delete(contact)


# ─── Insurance ────────────────────────────────────────────────────────────────

@router.post("/api/insurance", response_model=InsuranceResponse, status_code=status.HTTP_201_CREATED)
async def add_insurance(body: InsuranceCreate, current_user: CurrentUser, db: DbSession) -> InsuranceResponse:
    policy = Insurance(patient_id=current_user.id, **body.model_dump())
    db.add(policy)
    await db.flush()
    return InsuranceResponse.model_validate(policy)


@router.get("/api/insurance", response_model=list[InsuranceResponse])
async def get_insurance(current_user: CurrentUser, db: DbSession) -> list[InsuranceResponse]:
    result = await db.execute(
        select(Insurance)
        .where(Insurance.patient_id == current_user.id)
        .order_by(desc(Insurance.is_active), Insurance.provider_name)
    )
    return [InsuranceResponse.model_validate(p) for p in result.scalars().all()]


@router.put("/api/insurance/{policy_id}", response_model=InsuranceResponse)
async def update_insurance(
    policy_id: uuid.UUID, body: InsuranceCreate, current_user: CurrentUser, db: DbSession
) -> InsuranceResponse:
    result = await db.execute(
        select(Insurance).where(Insurance.id == policy_id, Insurance.patient_id == current_user.id)
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance policy not found")
    for k, v in body.model_dump().items():
        setattr(policy, k, v)
    await db.flush()
    return InsuranceResponse.model_validate(policy)


@router.delete("/api/insurance/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insurance(policy_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(Insurance).where(Insurance.id == policy_id, Insurance.patient_id == current_user.id)
    )
    policy = result.scalar_one_or_none()
    if policy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insurance policy not found")
    await db.delete(policy)


# ─── Symptoms ────────────────────────────────────────────────────────────────

@router.post("/api/symptoms", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
async def log_symptom(body: SymptomCreate, current_user: CurrentUser, db: DbSession) -> SymptomResponse:
    entry = SymptomLog(
        patient_id=current_user.id,
        symptom=body.symptom,
        severity=body.severity,
        duration=body.duration,
        location=body.location,
        triggers=body.triggers,
        relieving_factors=body.relieving_factors,
        associated_symptoms=body.associated_symptoms,
        notes=body.notes,
        logged_at=body.logged_at or datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()
    return SymptomResponse.model_validate(entry)


@router.get("/api/symptoms", response_model=list[SymptomResponse])
async def get_symptoms(
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[SymptomResponse]:
    result = await db.execute(
        select(SymptomLog)
        .where(SymptomLog.patient_id == current_user.id)
        .order_by(desc(SymptomLog.logged_at))
        .limit(limit)
    )
    return [SymptomResponse.model_validate(s) for s in result.scalars().all()]


@router.delete("/api/symptoms/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_symptom(symptom_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(SymptomLog).where(SymptomLog.id == symptom_id, SymptomLog.patient_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Symptom entry not found")
    await db.delete(entry)


# ─── SOAP Notes ──────────────────────────────────────────────────────────────

@router.post("/api/soap-notes", response_model=SOAPNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_soap_note(body: SOAPNoteCreate, current_user: CurrentUser, db: DbSession) -> SOAPNoteResponse:
    note = SOAPNote(patient_id=current_user.id, **body.model_dump())
    db.add(note)
    await db.flush()
    return SOAPNoteResponse.model_validate(note)


@router.get("/api/soap-notes", response_model=list[SOAPNoteResponse])
async def get_soap_notes(
    current_user: CurrentUser,
    db: DbSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[SOAPNoteResponse]:
    result = await db.execute(
        select(SOAPNote)
        .where(SOAPNote.patient_id == current_user.id)
        .order_by(desc(SOAPNote.visit_date))
        .limit(limit)
    )
    return [SOAPNoteResponse.model_validate(n) for n in result.scalars().all()]


@router.get("/api/soap-notes/{note_id}", response_model=SOAPNoteResponse)
async def get_soap_note(note_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> SOAPNoteResponse:
    result = await db.execute(
        select(SOAPNote).where(SOAPNote.id == note_id, SOAPNote.patient_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOAP note not found")
    return SOAPNoteResponse.model_validate(note)


@router.put("/api/soap-notes/{note_id}", response_model=SOAPNoteResponse)
async def update_soap_note(
    note_id: uuid.UUID, body: SOAPNoteCreate, current_user: CurrentUser, db: DbSession
) -> SOAPNoteResponse:
    result = await db.execute(
        select(SOAPNote).where(SOAPNote.id == note_id, SOAPNote.patient_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOAP note not found")
    for k, v in body.model_dump().items():
        setattr(note, k, v)
    await db.flush()
    return SOAPNoteResponse.model_validate(note)


@router.delete("/api/soap-notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_soap_note(note_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(SOAPNote).where(SOAPNote.id == note_id, SOAPNote.patient_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOAP note not found")
    await db.delete(note)


# ─── Treatment Plans ─────────────────────────────────────────────────────────

@router.post("/api/treatment-plans", response_model=TreatmentPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_treatment_plan(
    body: TreatmentPlanCreate, current_user: CurrentUser, db: DbSession
) -> TreatmentPlanResponse:
    plan = TreatmentPlan(patient_id=current_user.id, **body.model_dump())
    db.add(plan)
    await db.flush()
    return TreatmentPlanResponse.model_validate(plan)


@router.get("/api/treatment-plans", response_model=list[TreatmentPlanResponse])
async def get_treatment_plans(
    current_user: CurrentUser,
    db: DbSession,
    status_filter: str | None = None,
) -> list[TreatmentPlanResponse]:
    q = select(TreatmentPlan).where(TreatmentPlan.patient_id == current_user.id)
    if status_filter:
        q = q.where(TreatmentPlan.status == status_filter)
    q = q.order_by(desc(TreatmentPlan.start_date))
    result = await db.execute(q)
    return [TreatmentPlanResponse.model_validate(p) for p in result.scalars().all()]


@router.put("/api/treatment-plans/{plan_id}", response_model=TreatmentPlanResponse)
async def update_treatment_plan(
    plan_id: uuid.UUID, body: TreatmentPlanCreate, current_user: CurrentUser, db: DbSession
) -> TreatmentPlanResponse:
    result = await db.execute(
        select(TreatmentPlan).where(TreatmentPlan.id == plan_id, TreatmentPlan.patient_id == current_user.id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    for k, v in body.model_dump().items():
        setattr(plan, k, v)
    await db.flush()
    return TreatmentPlanResponse.model_validate(plan)


@router.delete("/api/treatment-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_treatment_plan(plan_id: uuid.UUID, current_user: CurrentUser, db: DbSession) -> None:
    result = await db.execute(
        select(TreatmentPlan).where(TreatmentPlan.id == plan_id, TreatmentPlan.patient_id == current_user.id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treatment plan not found")
    await db.delete(plan)
