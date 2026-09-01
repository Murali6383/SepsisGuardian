from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# CREATE LAB RESULT
# =========================================================

class LabResultCreate(BaseModel):

    patient_id: str

    # Blood tests
    wbc: float | None = None
    platelets: float | None = None
    hemoglobin: float | None = None

    # Organ function
    creatinine: float | None = None
    bilirubin: float | None = None

    # Sepsis / infection markers
    lactate: float | None = None
    crp: float | None = None
    procalcitonin: float | None = None

    # Electrolytes
    sodium: float | None = None
    potassium: float | None = None

    # Blood gas
    blood_ph: float | None = None

    # Metabolic
    glucose: float | None = None

    # Additional information
    test_name: str | None = None
    notes: str | None = None


# =========================================================
# LAB RESULT RESPONSE
# =========================================================

class LabResultResponse(BaseModel):

    id: int
    patient_id: str

    # Blood tests
    wbc: float | None = None
    platelets: float | None = None
    # Organ function
    creatinine: float | None = None
    bilirubin: float | None = None

    # Sepsis / infection markers
    lactate: float | None = None
    crp: float | None = None
    procalcitonin: float | None = None

    recorded_by: str | None = None
    recorded_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )