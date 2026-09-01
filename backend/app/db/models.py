from datetime import datetime
from enum import Enum
from sqlalchemy import Boolean

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base


# =========================================================
# USER ROLE
# =========================================================

class UserRole(str, Enum):

    ADMIN = "ADMIN"

    ADMISSION = "ADMISSION"

    NURSE = "NURSE"

    DOCTOR = "DOCTOR"


# =========================================================
# ROLE
# =========================================================

class Role(Base):

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    name: Mapped[UserRole] = mapped_column(
        SAEnum(
            UserRole,
            name="user_role"
        ),
        unique=True,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    users = relationship(
        "User",
        back_populates="role"
    )


# =========================================================
# USER
# =========================================================

class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    employee_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    role = relationship(
        "Role",
        back_populates="users"
    )


# =========================================================
# PATIENT
# =========================================================

class Patient(Base):

    __tablename__ = "patients"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False
    )

    first_name = Column(
        String(100),
        nullable=False
    )

    last_name = Column(
        String(100),
        nullable=False
    )

    date_of_birth = Column(
        Date,
        nullable=False
    )

    gender = Column(
        String(20),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=True
    )

    email = Column(
        String(150),
        nullable=True
    )

    address = Column(
        Text,
        nullable=True
    )

    blood_group = Column(
        String(10),
        nullable=True
    )

    emergency_contact_name = Column(
        String(150),
        nullable=True
    )

    emergency_contact_phone = Column(
        String(20),
        nullable=True
    )

    admission_type = Column(
        String(50),
        nullable=False,
        default="GENERAL"
    )

    department = Column(
        String(100),
        nullable=True
    )

    chief_complaint = Column(
        Text,
        nullable=True
    )

    medical_history = Column(
        Text,
        nullable=True
    )

    allergies = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(30),
        nullable=False,
        default="ADMITTED"
    )

    admitted_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    critical = Column(Boolean, default=False, nullable=False)


# =========================================================
# VITAL SIGNS
# =========================================================

class VitalSign(Base):

    __tablename__ = "vital_signs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String(30),
        ForeignKey(
            "patients.patient_id"
        ),
        nullable=False,
        index=True
    )

    # =====================================================
    # BASIC VITALS
    # =====================================================

    temperature = Column(
        Float,
        nullable=True
    )

    heart_rate = Column(
        Float,
        nullable=True
    )

    respiratory_rate = Column(
        Float,
        nullable=True
    )

    systolic_bp = Column(
        Float,
        nullable=True
    )

    diastolic_bp = Column(
        Float,
        nullable=True
    )

    spo2 = Column(
        Float,
        nullable=True
    )

    # =====================================================
    # ADDITIONAL CLINICAL FEATURES
    # =====================================================

    map = Column(
        Float,
        nullable=True
    )

    gcs = Column(
        Float,
        nullable=True
    )

    urine_output = Column(
        Float,
        nullable=True
    )

    # =====================================================
    # CLINICAL FLAGS
    # =====================================================

    vasopressor = Column(
        Integer,
        nullable=True,
        default=0
    )

    mechanical_ventilation = Column(
        Integer,
        nullable=True,
        default=0
    )

    antibiotic_given = Column(
        Integer,
        nullable=True,
        default=0
    )

    fluid_given = Column(
        Integer,
        nullable=True,
        default=0
    )

    # =====================================================
    # OTHER
    # =====================================================

    consciousness_level = Column(
        String(100),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    recorded_by = Column(
        String(100),
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# =========================================================
# LAB RESULTS
# =========================================================

class LabResult(Base):

    __tablename__ = "lab_results"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        String(30),
        ForeignKey(
            "patients.patient_id"
        ),
        nullable=False,
        index=True
    )

    # =====================================================
    # INFECTION / SEPSIS
    # =====================================================

    wbc = Column(
        Float,
        nullable=True
    )

    lactate = Column(
        Float,
        nullable=True
    )

    crp = Column(
        Float,
        nullable=True
    )

    procalcitonin = Column(
        Float,
        nullable=True
    )

    # =====================================================
    # ORGAN RISK
    # =====================================================

    creatinine = Column(
        Float,
        nullable=True
    )

    bilirubin = Column(
        Float,
        nullable=True
    )

    platelets = Column(
        Float,
        nullable=True
    )

    glucose = Column(
        Float,
        nullable=True
    )

    # =====================================================
    # OTHER
    # =====================================================

    recorded_by = Column(
        String(100),
        nullable=False
    )

    recorded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )