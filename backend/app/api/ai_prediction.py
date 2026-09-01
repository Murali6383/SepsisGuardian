from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import pandas as pd
import numpy as np
import joblib
import os
from datetime import date

from app.db.database import get_db
from app.db.models import Patient, VitalSign, LabResult


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Prediction"]
)


# =========================================================
# MODEL DIRECTORY
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

print("========================================")
print("SepsisGuardian AI")
print("Model directory:", MODEL_DIR)
print("========================================")


# =========================================================
# LOAD MODEL PACKAGE
# =========================================================

def load_model_package(filename):

    path = os.path.join(
        MODEL_DIR,
        filename
    )

    if not os.path.exists(path):

        raise FileNotFoundError(
            f"Model not found: {path}"
        )

    return joblib.load(path)


# =========================================================
# LOAD SEPSIS MODEL
# =========================================================

try:

    sepsis_package = load_model_package(
        "lightgbm_sepsis.pkl"
    )

    if isinstance(sepsis_package, dict):

        sepsis_model = sepsis_package.get("model")

        sepsis_features = sepsis_package.get(
            "features",
            []
        )

        sepsis_categorical_features = (
            sepsis_package.get(
                "categorical_features",
                []
            )
        )

        sepsis_medians = sepsis_package.get(
            "medians",
            {}
        )

        sepsis_threshold = sepsis_package.get(
            "threshold",
            0.50
        )

    else:

        sepsis_model = sepsis_package
        sepsis_features = []
        sepsis_categorical_features = []
        sepsis_medians = {}
        sepsis_threshold = 0.50


    if sepsis_model is None:

        raise ValueError(
            "Sepsis model could not be loaded"
        )


    print(
        "Sepsis model loaded successfully"
    )

    print(
        "Sepsis features:",
        sepsis_features
    )

    print(
        "Sepsis categorical features:",
        sepsis_categorical_features
    )


except Exception as e:

    print(
        "ERROR loading sepsis model:",
        str(e)
    )

    raise


# =========================================================
# ORGAN MODEL FILES
# =========================================================

ORGAN_MODEL_FILES = {

    "kidney":
        "kidney_risk_model_v2.pkl",

    "liver":
        "liver_risk_model_v2.pkl",

    "lung":
        "lung_risk_model_v2.pkl",

    "cardiovascular":
        "cardiovascular_risk_model_v2.pkl"
}


# =========================================================
# LOAD ORGAN MODELS
# =========================================================

organ_models = {}


for organ_name, filename in ORGAN_MODEL_FILES.items():

    try:

        package = load_model_package(
            filename
        )

        if isinstance(package, dict):

            model = package.get(
                "model"
            )

            features = package.get(
                "features",
                []
            )

            categorical_features = (
                package.get(
                    "categorical_features",
                    []
                )
            )

            threshold = package.get(
                "threshold",
                0.50
            )

            medians = package.get(
                "medians",
                {}
            )

        else:

            model = package
            features = []
            categorical_features = []
            threshold = 0.50
            medians = {}


        if model is None:

            print(
                f"WARNING: {organ_name} model is empty"
            )

            continue


        organ_models[organ_name] = {

            "model":
                model,

            "features":
                features,

            "categorical_features":
                categorical_features,

            "threshold":
                threshold,

            "medians":
                medians
        }


        print(
            f"{organ_name} model loaded successfully"
        )

        print(
            f"{organ_name} features:",
            features
        )


    except Exception as e:

        print(
            f"WARNING: Could not load "
            f"{organ_name} model: {str(e)}"
        )


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(probability: float):

    if probability < 0.25:
        return "LOW"

    elif probability < 0.50:
        return "MODERATE"

    elif probability < 0.75:
        return "HIGH"

    return "CRITICAL"


# =========================================================
# AGE
# =========================================================

def calculate_age(date_of_birth):

    if date_of_birth is None:
        return None

    today = date.today()

    age = (
        today.year
        - date_of_birth.year
    )

    if (
        (today.month, today.day)
        <
        (
            date_of_birth.month,
            date_of_birth.day
        )
    ):

        age -= 1

    return age


# =========================================================
# SAFE FLOAT
# =========================================================

def safe_float(value):

    if value is None:
        return None

    try:

        value = float(value)

        if np.isnan(value):
            return None

        if np.isinf(value):
            return None

        return value

    except (
        ValueError,
        TypeError
    ):

        return None


# =========================================================
# GET ATTRIBUTE SAFELY
# =========================================================

def get_value(
    obj,
    field,
    default=None
):

    if obj is None:
        return default

    try:

        value = getattr(
            obj,
            field,
            default
        )

        return value

    except Exception:

        return default


# =========================================================
# CLEAN MODEL INPUT
# =========================================================

def clean_model_input(
    df,
    categorical_features=None,
    medians=None
):

    df = df.copy()

    categorical_features = (
        categorical_features or []
    )

    medians = medians or {}


    # -----------------------------------------------------
    # Replace infinity
    # -----------------------------------------------------

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )


    # -----------------------------------------------------
    # Numeric conversion
    # -----------------------------------------------------

    for column in df.columns:

        if column not in categorical_features:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )


    # -----------------------------------------------------
    # Categorical conversion
    # -----------------------------------------------------

    for column in categorical_features:

        if column in df.columns:

            df[column] = (
                df[column]
                .astype("string")
                .fillna("UNKNOWN")
                .astype("category")
            )


    # -----------------------------------------------------
    # Numeric missing values
    # -----------------------------------------------------

    for column in df.columns:

        if column in categorical_features:
            continue

        if not df[column].isna().any():
            continue

        median_value = medians.get(
            column
        )

        if median_value is None:

            valid_values = (
                df[column]
                .dropna()
            )

            if len(valid_values) > 0:

                median_value = (
                    valid_values.median()
                )

        if (
            median_value is None
            or pd.isna(median_value)
        ):

            median_value = 0.0

        df[column] = (
            df[column]
            .fillna(float(median_value))
        )


    # -----------------------------------------------------
    # Final numeric dtype
    # -----------------------------------------------------

    for column in df.columns:

        if column not in categorical_features:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            df[column] = (
                df[column]
                .fillna(0.0)
                .astype("float64")
            )


    return df


# =========================================================
# PREPARE MODEL INPUT
# =========================================================

def prepare_model_input(
    patient_data,
    features,
    categorical_features,
    medians=None
):

    df = pd.DataFrame(
        [patient_data]
    )


    # -----------------------------------------------------
    # Check model features
    # -----------------------------------------------------

    if features:

        missing_features = [

            feature

            for feature in features

            if feature not in df.columns
        ]


        if missing_features:

            raise HTTPException(

                status_code=400,

                detail={

                    "message":
                        "Model features missing",

                    "missing_features":
                        missing_features
                }
            )


        # IMPORTANT
        # Exact training feature order

        df = df[
            features
        ].copy()


    # -----------------------------------------------------
    # Clean
    # -----------------------------------------------------

    df = clean_model_input(

        df,

        categorical_features,

        medians
    )


    return df


# =========================================================
# BUILD PATIENT CLINICAL DATA
# =========================================================

def build_patient_data(
    patient,
    vital,
    lab
):

    # =====================================================
    # AGE
    # =====================================================

    age = calculate_age(
        patient.date_of_birth
    )


    # =====================================================
    # VITALS
    # =====================================================

    temperature = safe_float(
        get_value(
            vital,
            "temperature"
        )
    )

    heart_rate = safe_float(
        get_value(
            vital,
            "heart_rate"
        )
    )

    respiratory_rate = safe_float(
        get_value(
            vital,
            "respiratory_rate"
        )
    )

    systolic_bp = safe_float(
        get_value(
            vital,
            "systolic_bp"
        )
    )

    diastolic_bp = safe_float(
        get_value(
            vital,
            "diastolic_bp"
        )
    )

    spo2 = safe_float(
        get_value(
            vital,
            "spo2"
        )
    )

    urine_output = safe_float(
        get_value(
            vital,
            "urine_output"
        )
    )


    # =====================================================
    # MAP
    # =====================================================

    map_value = safe_float(
        get_value(
            vital,
            "map"
        )
    )


    if map_value is None:

        if (
            systolic_bp is not None
            and
            diastolic_bp is not None
        ):

            map_value = (
                systolic_bp
                +
                2 * diastolic_bp
            ) / 3


    # =====================================================
    # GCS
    # =====================================================

    gcs = safe_float(
        get_value(
            vital,
            "gcs"
        )
    )


    # =====================================================
    # CLINICAL FLAGS
    # =====================================================

    vasopressor = safe_float(
        get_value(
            vital,
            "vasopressor",
            0
        )
    )

    mechanical_ventilation = safe_float(
        get_value(
            vital,
            "mechanical_ventilation",
            0
        )
    )

    antibiotic_given = safe_float(
        get_value(
            vital,
            "antibiotic_given",
            0
        )
    )

    fluid_given = safe_float(
        get_value(
            vital,
            "fluid_given",
            0
        )
    )


    # =====================================================
    # LABS
    # =====================================================

    wbc = safe_float(
        get_value(
            lab,
            "wbc"
        )
    )

    lactate = safe_float(
        get_value(
            lab,
            "lactate"
        )
    )

    creatinine = safe_float(
        get_value(
            lab,
            "creatinine"
        )
    )

    bilirubin = safe_float(
        get_value(
            lab,
            "bilirubin"
        )
    )

    platelets = safe_float(
        get_value(
            lab,
            "platelets"
        )
    )

    glucose = safe_float(
        get_value(
            lab,
            "glucose"
        )
    )

    crp = safe_float(
        get_value(
            lab,
            "crp"
        )
    )

    procalcitonin = safe_float(
        get_value(
            lab,
            "procalcitonin"
        )
    )


    # =====================================================
    # FINAL MODEL INPUT
    # =====================================================

    patient_data = {

        # Patient
        "age":
            safe_float(age),

        "gender":
            get_value(
                patient,
                "gender",
                "UNKNOWN"
            ),


        # Vitals
        "heart_rate":
            heart_rate,

        "systolic_bp":
            systolic_bp,

        "diastolic_bp":
            diastolic_bp,

        "map":
            map_value,

        "respiratory_rate":
            respiratory_rate,

        "temperature":
            temperature,

        "spo2":
            spo2,


        # Urine / GCS
        "urine_output":
            urine_output,

        "gcs":
            gcs,


        # Clinical flags
        "vasopressor":
            vasopressor,

        "mechanical_ventilation":
            mechanical_ventilation,

        "antibiotic_given":
            antibiotic_given,

        "fluid_given":
            fluid_given,


        # Labs
        "wbc":
            wbc,

        "lactate":
            lactate,

        "creatinine":
            creatinine,

        "bilirubin":
            bilirubin,

        "platelets":
            platelets,

        "glucose":
            glucose,

        "crp":
            crp,

        "procalcitonin":
            procalcitonin
    }


    return patient_data


# =========================================================
# PREDICT PATIENT
# =========================================================

@router.post(
    "/predict/{patient_id}"
)
def predict_patient(

    patient_id: str,

    db: Session = Depends(
        get_db
    )
):

    try:

        print("")
        print("========================================")
        print("AI PREDICTION START")
        print("Patient:", patient_id)
        print("========================================")


        # =================================================
        # PATIENT
        # =================================================

        patient = (

            db.query(
                Patient
            )

            .filter(
                Patient.patient_id
                == patient_id
            )

            .first()
        )


        if not patient:

            raise HTTPException(

                status_code=404,

                detail="Patient not found"
            )


        # =================================================
        # LATEST NURSE VITALS
        # =================================================

        vital = (

            db.query(
                VitalSign
            )

            .filter(
                VitalSign.patient_id
                == patient_id
            )

            .order_by(
                VitalSign.recorded_at.desc()
            )

            .first()
        )


        if not vital:

            raise HTTPException(

                status_code=404,

                detail={
                    "message":
                        "No nurse vital signs found",

                    "patient_id":
                        patient_id
                }
            )


        # =================================================
        # LATEST NURSE LAB
        # =================================================

        lab = (

            db.query(
                LabResult
            )

            .filter(
                LabResult.patient_id
                == patient_id
            )

            .order_by(
                LabResult.recorded_at.desc()
            )

            .first()
        )


        # =================================================
        # BUILD CLINICAL INPUT
        # =================================================

        patient_data = build_patient_data(

            patient,

            vital,

            lab
        )


        # =================================================
        # DEBUG
        # =================================================

        print("")
        print("AI INPUT")
        print("----------------------------------------")

        for key, value in patient_data.items():

            print(
                f"{key}: {value}"
            )

        print("----------------------------------------")


        # =================================================
        # BASIC REQUIRED DATA
        # =================================================

        required_basic = [

            "age",
            "gender",
            "heart_rate",
            "systolic_bp",
            "diastolic_bp",
            "respiratory_rate",
            "temperature",
            "spo2"
        ]


        missing_basic = [

            field

            for field in required_basic

            if (
                patient_data.get(field)
                is None
            )
        ]


        if missing_basic:

            raise HTTPException(

                status_code=400,

                detail={

                    "message":
                        "Required nurse clinical data missing",

                    "missing_fields":
                        missing_basic,

                    "patient_id":
                        patient_id
                }
            )


        # =================================================
        # SEPSIS MODEL INPUT
        # =================================================

        X_sepsis = prepare_model_input(

            patient_data,

            sepsis_features,

            sepsis_categorical_features,

            sepsis_medians
        )


        print("")
        print("SEPSIS MODEL INPUT")
        print("----------------------------------------")
        print(X_sepsis)
        print("----------------------------------------")


        # =================================================
        # SEPSIS PREDICTION
        # =================================================

        sepsis_probability = (

            sepsis_model
            .predict_proba(
                X_sepsis
            )[0][1]
        )


        sepsis_probability = float(
            sepsis_probability
        )


        sepsis_prediction = (

            sepsis_probability
            >= sepsis_threshold
        )
        # =================================================
# CRITICAL PATIENT STATUS
# =================================================

        CRITICAL_THRESHOLD = 0.70

        if sepsis_probability >= CRITICAL_THRESHOLD:

            patient.critical = True

        else:

            patient.critical = False

        db.add(patient)
        db.commit()
        db.refresh(patient)

        print(
                f"Critical status: {patient.critical}"
        )

        # =================================================
        # ORGAN RISK
        # =================================================

        organ_results = {}


        for organ_name, package in organ_models.items():

            try:

                model = package[
                    "model"
                ]

                features = package[
                    "features"
                ]

                categorical_features = (
                    package[
                        "categorical_features"
                    ]
                )

                threshold = package[
                    "threshold"
                ]

                medians = package.get(
                    "medians",
                    {}
                )


                # -----------------------------------------
                # PREPARE INPUT
                # -----------------------------------------

                X = prepare_model_input(

                    patient_data,

                    features,

                    categorical_features,

                    medians
                )


                # -----------------------------------------
                # PREDICTION
                # -----------------------------------------

                probability = (

                    model
                    .predict_proba(
                        X
                    )[0][1]
                )


                probability = float(
                    probability
                )


                prediction = (

                    probability
                    >= threshold
                )


                # -----------------------------------------
                # RESULT
                # -----------------------------------------

                organ_results[
                    organ_name
                ] = {

                    "prediction":

                        "HIGH_RISK"
                        if prediction
                        else "LOW_RISK",

                    "probability":

                        round(
                            probability * 100,
                            2
                        ),

                    "risk_level":

                        get_risk_level(
                            probability
                        )
                }


                print(
                    f"{organ_name}: "
                    f"{probability * 100:.2f}%"
                )


            except Exception as organ_error:

                print(
                    f"{organ_name} prediction error:",
                    str(organ_error)
                )


                organ_results[
                    organ_name
                ] = {

                    "prediction":
                        "NOT_AVAILABLE",

                    "probability":
                        None,

                    "risk_level":
                        "UNKNOWN",

                    "error":
                        str(organ_error)
                }


        # =================================================
        # RESPONSE
        # =================================================

        result = {

            "status":
                "success",

            "patient_id":
                patient.patient_id,

            "patient_name":
                (
                    f"{patient.first_name} "
                    f"{patient.last_name}"
                ),

            "critical": 
                patient.critical,

            # -------------------------------------------------
            # SEPSIS
            # -------------------------------------------------

            "sepsis": {

                "prediction":

                    "SEPSIS POSITIVE"
                    if sepsis_prediction
                    else "SEPSIS NEGATIVE",

                "probability":

                    round(
                        sepsis_probability * 100,
                        2
                    ),

                "risk_level":

                    get_risk_level(
                        sepsis_probability
                    )
            },


            # -------------------------------------------------
            # ORGAN RISKS
            # -------------------------------------------------

            "organ_risks":
                organ_results,


            # -------------------------------------------------
            # SOURCE
            # -------------------------------------------------

            "source": {

                "vitals":
                    "latest_nurse_assessment",

                "labs":
                    "latest_nurse_assessment",

                "vital_record_id":
                    get_value(
                        vital,
                        "id"
                    ),

                "lab_record_id":
                    get_value(
                        lab,
                        "id"
                    )
            },


            # -------------------------------------------------
            # INPUT USED FOR AI
            # -------------------------------------------------

            "clinical_data": patient_data
        }


        print("")
        print("========================================")
        print("AI PREDICTION SUCCESS")
        print("Patient:", patient_id)
        print(
            "Sepsis:",
            result["sepsis"]
        )
        print("========================================")


        return result


    # =====================================================
    # HTTP ERROR
    # =====================================================

    except HTTPException:

        raise


    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as e:

        print("")
        print("========================================")
        print("AI PREDICTION ERROR")
        print("Patient:", patient_id)
        print("Error:", str(e))
        print("========================================")


        raise HTTPException(

            status_code=500,

            detail={

                "message":
                    "AI prediction failed",

                "patient_id":
                    patient_id,

                "error":
                    str(e)
            }
        )


# =========================================================
# AI STATUS
# =========================================================

@router.get(
    "/status"
)
def ai_status():

    return {

        "status":
            "AI module running",

        "sepsis_model":
            "loaded"
            if sepsis_model
            else "not loaded",

        "organ_models":
            list(
                organ_models.keys()
            )
    }
    # =========================================================
# CRITICAL PATIENT COUNT
# =========================================================

@router.get("/critical-count")
def get_critical_patient_count(
    db: Session = Depends(get_db)
):
    try:

        count = (
            db.query(Patient)
            .filter(
                Patient.critical.is_(True)
            )
            .count()
        )

        return {
            "status": "success",
            "critical_count": count
        }

    except Exception as e:

        print(
            "Critical patient count error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail={
                "message":
                    "Failed to get critical patient count",
                "error":
                    str(e)
            }
        )

# =========================================================
# GET CRITICAL PATIENTS
# =========================================================

@router.get("/critical-patients")
def get_critical_patients(
    db: Session = Depends(get_db)
):
    try:

        patients = (
            db.query(Patient)
            .filter(
                Patient.critical.is_(True)
            )
            .order_by(
                Patient.patient_id
            )
            .all()
        )

        return {
            "status": "success",
            "count": len(patients),
            "patients": [
                {
                    "patient_id": patient.patient_id,
                    "first_name": patient.first_name,
                    "last_name": patient.last_name,
                    "critical": patient.critical
                }
                for patient in patients
            ]
        }

    except Exception as e:

        print(
            "Critical patients error:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to get critical patients",
                "error": str(e)
            }
        )
