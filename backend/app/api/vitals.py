from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, VitalSign
from app.schemas.vital import (
    VitalSignCreate,
    VitalSignResponse,
)


router = APIRouter(
    prefix="/api/vitals",
    tags=["Vital Signs"],
)


# =========================================================
# CREATE VITAL SIGN
# =========================================================

@router.post(
    "/",
    response_model=VitalSignResponse,
    status_code=201,
)
def create_vital_sign(
    vital_data: VitalSignCreate,
    db: Session = Depends(get_db),
):

    # =====================================================
    # CHECK PATIENT
    # =====================================================

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == vital_data.patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    # =====================================================
    # CREATE VITAL
    # =====================================================

    vital = VitalSign(
        patient_id=vital_data.patient_id,

        temperature=vital_data.temperature,
        heart_rate=vital_data.heart_rate,
        respiratory_rate=vital_data.respiratory_rate,

        systolic_bp=vital_data.systolic_bp,
        diastolic_bp=vital_data.diastolic_bp,

        spo2=vital_data.spo2,

        consciousness_level=(
            vital_data.consciousness_level
        ),

        urine_output=(
            vital_data.urine_output
        ),

        notes=vital_data.notes,

        # =================================================
        # IMPORTANT
        # recorded_by NOT NULL issue fix
        # =================================================

        recorded_by="Nurse",
    )

    # =====================================================
    # SAVE
    # =====================================================

    db.add(vital)

    try:

        db.commit()

        db.refresh(vital)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to save vital signs",
                "error": str(e),
            },
        )

    return vital


# =========================================================
# GET LATEST VITAL
# =========================================================

@router.get(
    "/patient/{patient_id}/latest",
    response_model=VitalSignResponse,
)
def get_latest_vital(
    patient_id: str,
    db: Session = Depends(get_db),
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    vital = (
        db.query(VitalSign)
        .filter(
            VitalSign.patient_id == patient_id
        )
        .order_by(
            VitalSign.recorded_at.desc()
        )
        .first()
    )

    if not vital:
        raise HTTPException(
            status_code=404,
            detail="No vital signs found for patient",
        )

    return vital


# =========================================================
# GET PATIENT VITAL HISTORY
# =========================================================

@router.get(
    "/patient/{patient_id}",
    response_model=list[VitalSignResponse],
)
def get_patient_vitals(
    patient_id: str,
    db: Session = Depends(get_db),
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    vitals = (
        db.query(VitalSign)
        .filter(
            VitalSign.patient_id == patient_id
        )
        .order_by(
            VitalSign.recorded_at.desc()
        )
        .all()
    )

    return vitals