import uuid
import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional

from app.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.patient
    )

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    reset_token: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    reset_token_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    vital_signs: Mapped[list["VitalSign"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    medications: Mapped[list["Medication"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    allergies: Mapped[list["Allergy"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    medical_history: Mapped[list["MedicalHistory"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    chat_sessions: Mapped[list["ChatSession"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821
    documents: Mapped[list["MedicalDocument"]] = relationship(back_populates="patient", lazy="select")  # noqa: F821

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
