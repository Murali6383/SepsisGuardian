from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Patient
from app.schemas.patient import PatientCreate, PatientResponse


router = APIRouter(
    prefix="/api/patients",
    tags=["Patients"]
)


# =========================================================
# CREATE PATIENT
# =========================================================

@router.post(
    "/",
    response_model=PatientResponse,
    status_code=201
)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db)
):
    # Get the latest patient
    last_patient = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .first()
    )

    # Generate next patient number
    if last_patient:
        next_number = last_patient.id + 1
    else:
        next_number = 1

    patient_id = f"PAT-2026-{next_number:05d}"

    # Create patient
    patient = Patient(
        patient_id=patient_id,
        first_name=patient_data.first_name,
        last_name=patient_data.last_name,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        phone=patient_data.phone,
        email=patient_data.email,
        address=patient_data.address,
        blood_group=patient_data.blood_group,
        emergency_contact_name=patient_data.emergency_contact_name,
        emergency_contact_phone=patient_data.emergency_contact_phone,
        admission_type=patient_data.admission_type,
        department=patient_data.department,
        chief_complaint=patient_data.chief_complaint,
        medical_history=patient_data.medical_history,
        allergies=patient_data.allergies,
        status="ADMITTED"
    )

    # Save to PostgreSQL
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient


# =========================================================
# GET ALL PATIENTS
# =========================================================

@router.get(
    "/",
    response_model=list[PatientResponse]
)
def get_patients(
    db: Session = Depends(get_db)
):
    patients = (
        db.query(Patient)
        .order_by(Patient.id.desc())
        .all()
    )

    return patients


# =========================================================
# GET PATIENT BY PATIENT ID
# =========================================================

@router.get(
    "/{patient_id}",
    response_model=PatientResponse
)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient