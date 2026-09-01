from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str

    phone: str | None = None
    email: str | None = None
    address: str | None = None

    blood_group: str | None = None

    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None

    admission_type: str = "GENERAL"
    department: str | None = None

    chief_complaint: str | None = None
    medical_history: str | None = None
    allergies: str | None = None


class PatientResponse(BaseModel):
    id: int
    patient_id: str

    first_name: str
    last_name: str
    date_of_birth: date
    gender: str

    phone: str | None = None
    email: str | None = None
    address: str | None = None

    blood_group: str | None = None

    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None

    admission_type: str
    department: str | None = None

    chief_complaint: str | None = None
    medical_history: str | None = None
    allergies: str | None = None

    status: str
    admitted_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)