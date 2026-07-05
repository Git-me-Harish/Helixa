"""Pydantic schemas for extended health record models."""

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


# ─── Wellness ────────────────────────────────────────────────────────────────

class WellnessCreate(BaseModel):
    category: str
    value: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=50)
    notes: str | None = Field(default=None, max_length=1000)
    logged_at: datetime | None = None


class WellnessResponse(WellnessCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    logged_at: datetime

    model_config = {"from_attributes": True}


# ─── Vaccinations ─────────────────────────────────────────────────────────────

class VaccinationCreate(BaseModel):
    vaccine_name: str = Field(min_length=1, max_length=200)
    dose_number: int | None = Field(default=None, ge=1, le=20)
    total_doses: int | None = Field(default=None, ge=1, le=20)
    administered_date: date | None = None
    next_due_date: date | None = None
    administered_by: str | None = Field(default=None, max_length=200)
    lot_number: str | None = Field(default=None, max_length=100)
    site: str | None = Field(default=None, max_length=100)
    status: str = "completed"
    notes: str | None = Field(default=None, max_length=1000)


class VaccinationResponse(VaccinationCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Family Members ───────────────────────────────────────────────────────────

class FamilyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    relationship: str = Field(min_length=1, max_length=100)
    date_of_birth: date | None = None
    blood_group: str | None = Field(default=None, max_length=10)
    medical_conditions: list[str] | None = None
    allergies: list[str] | None = None
    medications: list[str] | None = None
    notes: str | None = Field(default=None, max_length=2000)


class FamilyMemberResponse(FamilyMemberCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Emergency Contacts ───────────────────────────────────────────────────────

class EmergencyContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    relationship: str = Field(min_length=1, max_length=100)
    phone_primary: str = Field(min_length=7, max_length=30)
    phone_secondary: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    is_primary: bool = False
    notes: str | None = Field(default=None, max_length=1000)


class EmergencyContactResponse(EmergencyContactCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Insurance ────────────────────────────────────────────────────────────────

class InsuranceCreate(BaseModel):
    insurance_type: str = "primary"
    provider_name: str = Field(min_length=1, max_length=200)
    policy_number: str = Field(min_length=1, max_length=100)
    group_number: str | None = Field(default=None, max_length=100)
    member_id: str | None = Field(default=None, max_length=100)
    subscriber_name: str | None = Field(default=None, max_length=200)
    subscriber_relationship: str | None = Field(default=None, max_length=100)
    effective_date: date | None = None
    expiry_date: date | None = None
    copay: float | None = Field(default=None, ge=0)
    deductible: float | None = Field(default=None, ge=0)
    phone: str | None = Field(default=None, max_length=30)
    is_active: bool = True
    notes: str | None = Field(default=None, max_length=1000)


class InsuranceResponse(InsuranceCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Symptoms ────────────────────────────────────────────────────────────────

class SymptomCreate(BaseModel):
    symptom: str = Field(min_length=1, max_length=300)
    severity: int = Field(ge=1, le=10)
    duration: str | None = Field(default=None, max_length=100)
    location: str | None = Field(default=None, max_length=200)
    triggers: list[str] | None = None
    relieving_factors: list[str] | None = None
    associated_symptoms: list[str] | None = None
    notes: str | None = Field(default=None, max_length=2000)
    logged_at: datetime | None = None


class SymptomResponse(SymptomCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    logged_at: datetime

    model_config = {"from_attributes": True}


# ─── SOAP Notes ──────────────────────────────────────────────────────────────

class SOAPNoteCreate(BaseModel):
    visit_date: date
    provider_name: str | None = Field(default=None, max_length=200)
    chief_complaint: str | None = Field(default=None, max_length=500)
    subjective: str | None = Field(default=None, max_length=5000)
    objective: str | None = Field(default=None, max_length=5000)
    assessment: str | None = Field(default=None, max_length=5000)
    plan: str | None = Field(default=None, max_length=5000)
    icd10_codes: list[str] | None = None
    follow_up_date: date | None = None


class SOAPNoteResponse(SOAPNoteCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Treatment Plans ─────────────────────────────────────────────────────────

class TreatmentPlanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    condition: str = Field(min_length=1, max_length=300)
    prescribing_provider: str | None = Field(default=None, max_length=200)
    start_date: date
    end_date: date | None = None
    status: str = "active"
    goals: list[str] | None = None
    interventions: list[str] | None = None
    medications: list[str] | None = None
    progress_notes: str | None = Field(default=None, max_length=5000)
    next_review_date: date | None = None


class TreatmentPlanResponse(TreatmentPlanCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
