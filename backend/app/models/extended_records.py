"""Extended health record models: wellness, vaccinations, family, emergency contacts,
insurance, symptoms, SOAP notes, treatment plans."""

import uuid
import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WellnessCategory(str, enum.Enum):
    fitness = "fitness"
    sleep = "sleep"
    hydration = "hydration"
    nutrition = "nutrition"
    stress = "stress"
    meditation = "meditation"


class VaccinationStatus(str, enum.Enum):
    completed = "completed"
    due = "due"
    overdue = "overdue"
    not_required = "not_required"


class InsuranceType(str, enum.Enum):
    primary = "primary"
    secondary = "secondary"
    dental = "dental"
    vision = "vision"
    life = "life"



class TreatmentStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    paused = "paused"
    discontinued = "discontinued"


# ─── Wellness ────────────────────────────────────────────────────────────────

class WellnessEntry(Base):
    __tablename__ = "wellness_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[WellnessCategory] = mapped_column(
        Enum(WellnessCategory, name="wellness_category"), nullable=False, index=True
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


# ─── Vaccinations ─────────────────────────────────────────────────────────────

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vaccine_name: Mapped[str] = mapped_column(String(200), nullable=False)
    dose_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_doses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    administered_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    administered_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    lot_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    site: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[VaccinationStatus] = mapped_column(
        Enum(VaccinationStatus, name="vaccination_status"),
        nullable=False,
        default=VaccinationStatus.completed,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ─── Family Members ───────────────────────────────────────────────────────────

class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    relationship: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    medical_conditions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    allergies: Mapped[list | None] = mapped_column(JSON, nullable=True)
    medications: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ─── Emergency Contacts ───────────────────────────────────────────────────────

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    relationship: Mapped[str] = mapped_column(String(100), nullable=False)
    phone_primary: Mapped[str] = mapped_column(String(30), nullable=False)
    phone_secondary: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ─── Insurance ────────────────────────────────────────────────────────────────

class Insurance(Base):
    __tablename__ = "insurance_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    insurance_type: Mapped[InsuranceType] = mapped_column(
        Enum(InsuranceType, name="insurance_type"), nullable=False
    )
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    group_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    member_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    subscriber_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    subscriber_relationship: Mapped[str | None] = mapped_column(String(100), nullable=True)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    copay: Mapped[float | None] = mapped_column(Float, nullable=True)
    deductible: Mapped[float | None] = mapped_column(Float, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ─── Symptoms Log ────────────────────────────────────────────────────────────

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    symptom: Mapped[str] = mapped_column(String(300), nullable=False)
    severity: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–10
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    triggers: Mapped[list | None] = mapped_column(JSON, nullable=True)
    relieving_factors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    associated_symptoms: Mapped[list | None] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )


# ─── SOAP Notes ──────────────────────────────────────────────────────────────

class SOAPNote(Base):
    __tablename__ = "soap_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    provider_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    chief_complaint: Mapped[str | None] = mapped_column(Text, nullable=True)
    subjective: Mapped[str | None] = mapped_column(Text, nullable=True)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessment: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    icd10_codes: Mapped[list | None] = mapped_column(JSON, nullable=True)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ─── Treatment Plans ─────────────────────────────────────────────────────────

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    condition: Mapped[str] = mapped_column(String(300), nullable=False)
    prescribing_provider: Mapped[str | None] = mapped_column(String(200), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[TreatmentStatus] = mapped_column(
        Enum(TreatmentStatus, name="treatment_status"),
        nullable=False,
        default=TreatmentStatus.active,
    )
    goals: Mapped[list | None] = mapped_column(JSON, nullable=True)
    interventions: Mapped[list | None] = mapped_column(JSON, nullable=True)
    medications: Mapped[list | None] = mapped_column(JSON, nullable=True)
    progress_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_review_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
