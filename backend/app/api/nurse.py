from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db.models import Patient, VitalSign, LabResult


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/nurse",
    tags=["Nurse"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class NurseClinicalData(BaseModel):

    # =====================================================
    # VITAL SIGNS
    # =====================================================

    temperature: Optional[float] = None
    heart_rate: Optional[float] = None
    respiratory_rate: Optional[float] = None

    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None

    spo2: Optional[float] = None
    urine_output: Optional[float] = None

    # =====================================================
    # NEUROLOGICAL
    # =====================================================

    gcs: Optional[float] = None
    consciousness_level: Optional[str] = None

    # =====================================================
    # CLINICAL FLAGS
    # =====================================================

    vasopressor: int = 0
    mechanical_ventilation: int = 0
    antibiotic_given: int = 0
    fluid_given: int = 0

    # =====================================================
    # LAB RESULTS
    # =====================================================

    wbc: Optional[float] = None
    platelets: Optional[float] = None

    creatinine: Optional[float] = None
    bilirubin: Optional[float] = None

    lactate: Optional[float] = None
    crp: Optional[float] = None
    procalcitonin: Optional[float] = None

    glucose: Optional[float] = None

    # =====================================================
    # NOTES
    # =====================================================

    notes: Optional[str] = None


# =========================================================
# SAVE NURSE CLINICAL DATA
# =========================================================

@router.post("/clinical-data/{patient_id}")
def save_nurse_clinical_data(
    patient_id: str,
    data: NurseClinicalData,
    db: Session = Depends(get_db)
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
            detail="Patient not found"
        )

    # =====================================================
    # CALCULATE MAP
    # =====================================================

    map_value = None

    if (
        data.systolic_bp is not None
        and
        data.diastolic_bp is not None
    ):
        map_value = (
            data.systolic_bp
            +
            (2 * data.diastolic_bp)
        ) / 3

    # =====================================================
    # RECORDED BY
    # =====================================================

    recorded_by = "Nurse"

    # =====================================================
    # CREATE VITAL RECORD
    # =====================================================

    vital = VitalSign(

        patient_id=patient_id,

        # -------------------------
        # Basic vitals
        # -------------------------

        temperature=data.temperature,

        heart_rate=data.heart_rate,

        respiratory_rate=data.respiratory_rate,

        systolic_bp=data.systolic_bp,

        diastolic_bp=data.diastolic_bp,

        spo2=data.spo2,

        urine_output=data.urine_output,

        # -------------------------
        # Calculated / neurological
        # -------------------------

        map=map_value,

        gcs=data.gcs,

        consciousness_level=data.consciousness_level,

        # -------------------------
        # Clinical flags
        # -------------------------

        vasopressor=data.vasopressor,

        mechanical_ventilation=(
            data.mechanical_ventilation
        ),

        antibiotic_given=(
            data.antibiotic_given
        ),

        fluid_given=(
            data.fluid_given
        ),

        # -------------------------
        # Notes
        # -------------------------

        notes=data.notes,

        # -------------------------
        # Audit
        # -------------------------

        recorded_by=recorded_by
    )

    # =====================================================
    # CREATE LAB RECORD
    # =====================================================

    lab = LabResult(

        patient_id=patient_id,

        # -------------------------
        # Infection / blood
        # -------------------------

        wbc=data.wbc,

        platelets=data.platelets,

        # -------------------------
        # Organ function
        # -------------------------

        creatinine=data.creatinine,

        bilirubin=data.bilirubin,

        # -------------------------
        # Sepsis markers
        # -------------------------

        lactate=data.lactate,

        crp=data.crp,

        procalcitonin=data.procalcitonin,

        # -------------------------
        # Metabolic
        # -------------------------

        glucose=data.glucose,

        # -------------------------
        # Audit
        # -------------------------

        recorded_by=recorded_by
    )

    # =====================================================
    # ADD TO DATABASE
    # =====================================================

    db.add(vital)
    db.add(lab)

    # =====================================================
    # COMMIT BOTH RECORDS
    # =====================================================

    try:

        db.commit()

        db.refresh(vital)
        db.refresh(lab)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Failed to save nurse clinical data"
                ),
                "error": str(e)
            }
        )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "status": "success",

        "message": (
            "Nurse clinical data saved successfully"
        ),

        "patient_id": patient_id,

        "vital_id": vital.id,

        "lab_id": lab.id,

        "map": map_value,

        "recorded_by": recorded_by
    }


# =========================================================
# GET LATEST NURSE CLINICAL DATA
# =========================================================

@router.get("/clinical-data/{patient_id}")
def get_latest_nurse_clinical_data(
    patient_id: str,
    db: Session = Depends(get_db)
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
            detail="Patient not found"
        )

    # =====================================================
    # GET LATEST VITAL
    # =====================================================

    vital = (
        db.query(VitalSign)
        .filter(
            VitalSign.patient_id == patient_id
        )
        .order_by(
            VitalSign.id.desc()
        )
        .first()
    )

    # =====================================================
    # GET LATEST LAB
    # =====================================================

    lab = (
        db.query(LabResult)
        .filter(
            LabResult.patient_id == patient_id
        )
        .order_by(
            LabResult.id.desc()
        )
        .first()
    )

    # =====================================================
    # NO CLINICAL DATA
    # =====================================================

    if not vital and not lab:

        return {
            "status": "no_data",
            "patient_id": patient_id,
            "message": "No nurse clinical data found",
            "vitals": None,
            "labs": None
        }

    # =====================================================
    # RESPONSE
    # =====================================================

    return {

        "status": "success",

        "patient_id": patient_id,

        # =================================================
        # VITALS
        # =================================================

        "vitals": {

            "temperature": (
                vital.temperature
                if vital
                else None
            ),

            "heart_rate": (
                vital.heart_rate
                if vital
                else None
            ),

            "respiratory_rate": (
                vital.respiratory_rate
                if vital
                else None
            ),

            "systolic_bp": (
                vital.systolic_bp
                if vital
                else None
            ),

            "diastolic_bp": (
                vital.diastolic_bp
                if vital
                else None
            ),

            "spo2": (
                vital.spo2
                if vital
                else None
            ),

            "urine_output": (
                vital.urine_output
                if vital
                else None
            ),

            "map": (
                vital.map
                if vital
                else None
            ),

            "gcs": (
                vital.gcs
                if vital
                else None
            ),

            "consciousness_level": (
                vital.consciousness_level
                if vital
                else None
            ),

            "vasopressor": (
                vital.vasopressor
                if vital
                else 0
            ),

            "mechanical_ventilation": (
                vital.mechanical_ventilation
                if vital
                else 0
            ),

            "antibiotic_given": (
                vital.antibiotic_given
                if vital
                else 0
            ),

            "fluid_given": (
                vital.fluid_given
                if vital
                else 0
            ),

            "recorded_by": (
                vital.recorded_by
                if vital
                else None
            ),

            "recorded_at": (
                vital.created_at.isoformat()
                if (
                    vital
                    and
                    getattr(
                        vital,
                        "created_at",
                        None
                    )
                )
                else None
            )
        },

        # =================================================
        # LABS
        # =================================================

        "labs": {

            "wbc": (
                lab.wbc
                if lab
                else None
            ),

            "platelets": (
                lab.platelets
                if lab
                else None
            ),

            "creatinine": (
                lab.creatinine
                if lab
                else None
            ),

            "bilirubin": (
                lab.bilirubin
                if lab
                else None
            ),

            "lactate": (
                lab.lactate
                if lab
                else None
            ),

            "crp": (
                lab.crp
                if lab
                else None
            ),

            "procalcitonin": (
                lab.procalcitonin
                if lab
                else None
            ),

            "glucose": (
                lab.glucose
                if lab
                else None
            ),

            "recorded_by": (
                lab.recorded_by
                if lab
                else None
            ),

            "recorded_at": (
                lab.created_at.isoformat()
                if (
                    lab
                    and
                    getattr(
                        lab,
                        "created_at",
                        None
                    )
                )
                else None
            )
        }
    }