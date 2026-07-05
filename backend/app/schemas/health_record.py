import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class VitalSignCreate(BaseModel):
    recorded_at: datetime | None = None
    bp_systolic: int | None = Field(default=None, ge=50, le=300)
    bp_diastolic: int | None = Field(default=None, ge=30, le=200)
    heart_rate: int | None = Field(default=None, ge=20, le=300)
    weight_kg: float | None = Field(default=None, ge=1.0, le=500.0)
    height_cm: float | None = Field(default=None, ge=30.0, le=300.0)
    glucose_mmol: float | None = Field(default=None, ge=0.5, le=50.0)
    spo2_pct: float | None = Field(default=None, ge=50.0, le=100.0)
    temp_celsius: float | None = Field(default=None, ge=30.0, le=45.0)
    notes: str | None = Field(default=None, max_length=1000)


class VitalSignResponse(VitalSignCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    recorded_at: datetime

    model_config = {"from_attributes": True}


class MedicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    generic_name: str | None = Field(default=None, max_length=200)
    dosage: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=50)
    frequency: str | None = Field(default=None, max_length=100)
    route: str | None = Field(default=None, max_length=50)
    start_date: date | None = None
    end_date: date | None = None
    prescriber: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class MedicationResponse(MedicationCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class AllergyCreate(BaseModel):
    substance: str = Field(min_length=1, max_length=200)
    severity: str
    reaction_type: str | None = Field(default=None, max_length=200)
    onset_date: date | None = None
    notes: str | None = Field(default=None, max_length=1000)


class AllergyResponse(AllergyCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MedHistoryCreate(BaseModel):
    condition: str = Field(min_length=1, max_length=300)
    icd10_code: str | None = Field(default=None, max_length=20)
    onset_date: date | None = None
    resolution_date: date | None = None
    status: str = "active"
    notes: str | None = Field(default=None, max_length=2000)


class MedHistoryResponse(MedHistoryCreate):
    id: uuid.UUID
    patient_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthSummary(BaseModel):
    latest_vitals: dict[str, Any] | None
    active_medications: list[dict[str, Any]]
    allergies: list[dict[str, Any]]
    active_conditions: list[dict[str, Any]]
    vital_count: int
