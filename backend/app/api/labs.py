from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient, LabResult
from app.schemas.lab import (
    LabResultCreate,
    LabResultResponse,
)


router = APIRouter(
    prefix="/api/labs",
    tags=["Laboratory Results"],
)


# =========================================================
# CREATE LAB RESULT
# =========================================================

@router.post(
    "/",
    response_model=LabResultResponse,
    status_code=201,
)
def create_lab_result(
    lab_data: LabResultCreate,
    db: Session = Depends(get_db),
):

    # =====================================================
    # CHECK PATIENT
    # =====================================================

    patient = (
        db.query(Patient)
        .filter(
            Patient.patient_id == lab_data.patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    # =====================================================
    # CREATE LAB RESULT
    # =====================================================

    lab = LabResult(
        patient_id=lab_data.patient_id,

        # -------------------------------------------------
        # BLOOD / INFECTION
        # -------------------------------------------------

        wbc=lab_data.wbc,

        platelets=lab_data.platelets,

        # -------------------------------------------------
        # ORGAN FUNCTION
        # -------------------------------------------------

        creatinine=lab_data.creatinine,

        bilirubin=lab_data.bilirubin,

        # -------------------------------------------------
        # SEPSIS MARKERS
        # -------------------------------------------------

        lactate=lab_data.lactate,

        crp=lab_data.crp,

        procalcitonin=lab_data.procalcitonin,

        # -------------------------------------------------
        # GLUCOSE
        # -------------------------------------------------

        glucose=lab_data.glucose,

        # -------------------------------------------------
        # RECORDED BY
        # -------------------------------------------------

        recorded_by="Nurse",
    )

    # =====================================================
    # SAVE DATABASE
    # =====================================================

    db.add(lab)

    try:

        db.commit()

        db.refresh(lab)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to save laboratory results",
                "error": str(e),
            },
        )

    return lab


# =========================================================
# GET LATEST LAB RESULT
# =========================================================

@router.get(
    "/patient/{patient_id}/latest",
    response_model=LabResultResponse,
)
def get_latest_lab_result(
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

    lab = (
        db.query(LabResult)
        .filter(
            LabResult.patient_id == patient_id
        )
        .order_by(
            LabResult.recorded_at.desc()
        )
        .first()
    )

    if not lab:
        raise HTTPException(
            status_code=404,
            detail="No laboratory results found for patient",
        )

    return lab


# =========================================================
# GET PATIENT LAB HISTORY
# =========================================================

@router.get(
    "/patient/{patient_id}",
    response_model=list[LabResultResponse],
)
def get_patient_lab_results(
    patient_id: str,
    db: Session = Depends(get_db),
):

    # =====================================================
    # CHECK PATIENT
    # =====================================================

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

    # =====================================================
    # GET LAB RESULTS
    # =====================================================

    labs = (
        db.query(LabResult)
        .filter(
            LabResult.patient_id == patient_id
        )
        .order_by(
            LabResult.recorded_at.desc()
        )
        .all()
    )

    return labs