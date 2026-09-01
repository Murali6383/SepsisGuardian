from datetime import datetime
from pydantic import BaseModel, ConfigDict


# =========================================================
# CREATE VITAL SIGN
# =========================================================

class VitalSignCreate(BaseModel):

    patient_id: str

    temperature: float | None = None
    heart_rate: float | None = None
    respiratory_rate: float | None = None

    systolic_bp: float | None = None
    diastolic_bp: float | None = None

    spo2: float | None = None

    consciousness_level: str | None = None

    urine_output: float | None = None

    notes: str | None = None


# =========================================================
# VITAL SIGN RESPONSE
# =========================================================

class VitalSignResponse(BaseModel):

    id: int

    patient_id: str

    temperature: float | None = None
    heart_rate: float | None = None
    respiratory_rate: float | None = None

    systolic_bp: float | None = None
    diastolic_bp: float | None = None

    spo2: float | None = None

    consciousness_level: str | None = None

    urine_output: float | None = None

    notes: str | None = None

    recorded_by: str
    recorded_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )