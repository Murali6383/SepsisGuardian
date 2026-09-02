# ============================================================
# ai_prediction.py
# SepsisGuardian AI
#
# Patient-specific:
#   - Sepsis Risk Prediction
#   - Organ Risk Prediction
#   - Clinical Feature Impact
#   - Critical Patient Status
#
# IMPORTANT:
# This module provides AI/model predictions for software testing
# and decision-support research. It is not a medical diagnosis.
# ============================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import pandas as pd
import numpy as np
import joblib
import os

from datetime import date

from app.db.database import get_db
from app.db.models import Patient, VitalSign, LabResult


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Prediction"]
)


# ============================================================
# PATHS
# ============================================================
#
# Current file:
#
# backend/
# ├── app/
# │   └── api/
# │       └── ai_prediction.py
# │
# └── model/
#     ├── lightgbm_sepsis.pkl
#     ├── kidney_risk_model_v2.pkl
#     ├── liver_risk_model_v2.pkl
#     ├── lung_risk_model_v2.pkl
#     └── cardiovascular_risk_model_v2.pkl
#
# ============================================================

# ai_prediction.py
#       ↓ dirname
# backend/app/api
#
#       ↓ dirname
# backend/app
#
#       ↓ dirname
# backend
#
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


# ============================================================
# MODEL PATHS
# ============================================================

SEPSIS_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lightgbm_sepsis.pkl"
)

KIDNEY_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "kidney_risk_model_v2.pkl"
)

LIVER_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "liver_risk_model_v2.pkl"
)

LUNG_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lung_risk_model_v2.pkl"
)

CARDIOVASCULAR_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "cardiovascular_risk_model_v2.pkl"
)


# ============================================================
# MODEL PATH DEBUG
# ============================================================

print("=" * 70)
print("[AI] MODEL CONFIGURATION")
print("=" * 70)

print(
    f"[AI] BASE_DIR: {BASE_DIR}"
)

print(
    f"[AI] MODEL_DIR: {MODEL_DIR}"
)

print(
    f"[AI] Sepsis model path: "
    f"{SEPSIS_MODEL_PATH}"
)

print(
    f"[AI] Sepsis model exists: "
    f"{os.path.exists(SEPSIS_MODEL_PATH)}"
)

print("=" * 70)


# ============================================================
# CRITICAL THRESHOLD
# ============================================================

CRITICAL_THRESHOLD = 0.70


# ============================================================
# LOAD MODEL PACKAGE
# ============================================================

def load_model_package(path):

    if not os.path.exists(path):

        print(
            f"[WARNING] Model not found: {path}"
        )

        return None

    try:

        package = joblib.load(path)

        if isinstance(package, dict):

            print(
                f"[AI] Loaded model package: "
                f"{os.path.basename(path)}"
            )

            print(
                f"[AI] Package keys: "
                f"{list(package.keys())}"
            )

            return package

        print(
            f"[AI] Loaded direct model: "
            f"{os.path.basename(path)}"
        )

        return {
            "model": package
        }

    except Exception as e:

        print(
            f"[ERROR] Loading model "
            f"{os.path.basename(path)} failed: "
            f"{e}"
        )

        return None


# ============================================================
# LOAD ALL MODELS
# ============================================================

sepsis_package = load_model_package(
    SEPSIS_MODEL_PATH
)

kidney_package = load_model_package(
    KIDNEY_MODEL_PATH
)

liver_package = load_model_package(
    LIVER_MODEL_PATH
)

lung_package = load_model_package(
    LUNG_MODEL_PATH
)

cardiovascular_package = load_model_package(
    CARDIOVASCULAR_MODEL_PATH
)


# ============================================================
# MODEL LOAD SUMMARY
# ============================================================

print("=" * 70)
print("[AI] MODEL LOAD STATUS")
print("=" * 70)

print(
    "[AI] Sepsis:",
    sepsis_package is not None
)

print(
    "[AI] Kidney:",
    kidney_package is not None
)

print(
    "[AI] Liver:",
    liver_package is not None
)

print(
    "[AI] Lung:",
    lung_package is not None
)

print(
    "[AI] Cardiovascular:",
    cardiovascular_package is not None
)

print("=" * 70)


# ============================================================
# GET MODEL
# ============================================================

def get_model(package):

    if package is None:
        return None

    if isinstance(package, dict):

        return package.get(
            "model"
        )

    return package


# ============================================================
# GET RISK LEVEL
# ============================================================

def get_risk_level(probability):

    try:

        probability = float(
            probability
        )

    except (
        ValueError,
        TypeError
    ):

        return "UNKNOWN"

    if probability < 0.25:

        return "LOW"

    elif probability < 0.50:

        return "MODERATE"

    elif probability < 0.75:

        return "HIGH"

    else:

        return "CRITICAL"


# ============================================================
# SAFE FLOAT
# ============================================================

def safe_float(
    value,
    default=None
):

    try:

        if value is None:

            return default

        if isinstance(
            value,
            str
        ):

            value = value.strip()

            if value == "":

                return default

        if pd.isna(value):

            return default

        result = float(
            value
        )

        if not np.isfinite(
            result
        ):

            return default

        return result

    except (
        ValueError,
        TypeError
    ):

        return default


# ============================================================
# GET VALUE FROM OBJECT
# ============================================================

def get_value(
    obj,
    name,
    default=None
):

    if obj is None:

        return default

    try:

        value = getattr(
            obj,
            name,
            default
        )

        if value is None:

            return default

        return value

    except Exception:

        return default


# ============================================================
# CALCULATE AGE
# ============================================================

def calculate_age(
    date_of_birth
):

    if date_of_birth is None:

        return None

    try:

        today = date.today()

        age = (
            today.year
            - date_of_birth.year
            - (
                (
                    today.month,
                    today.day
                )
                <
                (
                    date_of_birth.month,
                    date_of_birth.day
                )
            )
        )

        return int(age)

    except Exception:

        return None


# ============================================================
# CLINICAL NORMAL TARGETS
#
# INTERNAL USE ONLY
#
# These values are NOT returned to frontend.
# ============================================================

CLINICAL_NORMAL_VALUES = {

    "heart_rate": 75.0,

    "systolic_bp": 120.0,

    "diastolic_bp": 80.0,

    "map": 85.0,

    "respiratory_rate": 16.0,

    "temperature": 37.0,

    "spo2": 98.0,

    "urine_output": 60.0,

    "gcs": 15.0,

    "wbc": 7.5,

    "platelets": 250.0,

    "creatinine": 0.9,

    "bilirubin": 1.0,

    "lactate": 1.2,

    "glucose": 100.0,

    "crp": 3.0,

    "procalcitonin": 0.05,
}


# ============================================================
# CLINICAL FEATURES
# ============================================================

CLINICAL_FEATURES = {

    "temperature": {

        "label": "Temperature",

        "unit": "°C",

        "normal_low": 36.0,

        "normal_high": 37.5,
    },

    "heart_rate": {

        "label": "Heart Rate",

        "unit": "bpm",

        "normal_low": 60.0,

        "normal_high": 100.0,
    },

    "systolic_bp": {

        "label": "Systolic BP",

        "unit": "mmHg",

        "normal_low": 90.0,

        "normal_high": 120.0,
    },

    "diastolic_bp": {

        "label": "Diastolic BP",

        "unit": "mmHg",

        "normal_low": 60.0,

        "normal_high": 80.0,
    },

    "map": {

        "label": "Mean Arterial Pressure",

        "unit": "mmHg",

        "normal_low": 65.0,

        "normal_high": 100.0,
    },

    "respiratory_rate": {

        "label": "Respiratory Rate",

        "unit": "breaths/min",

        "normal_low": 12.0,

        "normal_high": 20.0,
    },

    "spo2": {

        "label": "SpO₂",

        "unit": "%",

        "normal_low": 95.0,

        "normal_high": 100.0,
    },

    "urine_output": {

        "label": "Urine Output",

        "unit": "mL/hr",

        "normal_low": 30.0,

        "normal_high": 100.0,
    },

    "gcs": {

        "label": "GCS",

        "unit": "",

        "normal_low": 15.0,

        "normal_high": 15.0,
    },

    "wbc": {

        "label": "WBC",

        "unit": "×10³/µL",

        "normal_low": 4.0,

        "normal_high": 11.0,
    },

    "platelets": {

        "label": "Platelets",

        "unit": "×10³/µL",

        "normal_low": 150.0,

        "normal_high": 450.0,
    },

    "creatinine": {

        "label": "Creatinine",

        "unit": "mg/dL",

        "normal_low": 0.6,

        "normal_high": 1.3,
    },

    "bilirubin": {

        "label": "Bilirubin",

        "unit": "mg/dL",

        "normal_low": 0.2,

        "normal_high": 1.2,
    },

    "lactate": {

        "label": "Lactate",

        "unit": "mmol/L",

        "normal_low": 0.5,

        "normal_high": 2.0,
    },

    "glucose": {

        "label": "Glucose",

        "unit": "mg/dL",

        "normal_low": 70.0,

        "normal_high": 140.0,
    },

    "crp": {

        "label": "CRP",

        "unit": "mg/L",

        "normal_low": 0.0,

        "normal_high": 5.0,
    },

    "procalcitonin": {

        "label": "Procalcitonin",

        "unit": "ng/mL",

        "normal_low": 0.0,

        "normal_high": 0.05,
    },
}


# ============================================================
# CLINICAL STATUS
# ============================================================

def get_clinical_status(
    feature,
    value
):

    if feature not in CLINICAL_FEATURES:

        return "UNKNOWN"

    numeric_value = safe_float(
        value
    )

    if numeric_value is None:

        return "UNKNOWN"

    config = CLINICAL_FEATURES[
        feature
    ]

    low = config[
        "normal_low"
    ]

    high = config[
        "normal_high"
    ]

    if feature == "gcs":

        if numeric_value >= 15:

            return "NORMAL"

        return "LOW"

    if numeric_value < low:

        return "LOW"

    if numeric_value > high:

        return "HIGH"

    return "NORMAL"


# ============================================================
# GET MODEL FEATURES
# ============================================================

def get_model_features(
    package
):

    if package is None:

        return []

    if not isinstance(
        package,
        dict
    ):

        model = get_model(
            package
        )

        if model is not None:

            try:

                if hasattr(
                    model,
                    "feature_name_"
                ):

                    return list(
                        model.feature_name_
                    )

            except Exception:

                pass

        return []

    features = package.get(
        "features",
        None
    )

    if features:

        return list(
            features
        )

    model = get_model(
        package
    )

    if model is not None:

        try:

            if hasattr(
                model,
                "feature_name_"
            ):

                return list(
                    model.feature_name_
                )

        except Exception:

            pass

    return []


# ============================================================
# GET CATEGORICAL FEATURES
# ============================================================

def get_categorical_features(
    package
):

    if package is None:

        return []

    if not isinstance(
        package,
        dict
    ):

        return []

    categorical_features = (
        package.get(
            "categorical_features",
            []
        )
    )

    if categorical_features is None:

        return []

    return list(
        categorical_features
    )


# ============================================================
# GET MEDIANS
# ============================================================

def get_model_medians(
    package
):

    if package is None:

        return {}

    if not isinstance(
        package,
        dict
    ):

        return {}

    medians = package.get(
        "medians",
        {}
    )

    if isinstance(
        medians,
        dict
    ):

        return medians

    return {}


# ============================================================
# GET CATEGORICAL VALUES
# ============================================================

def get_categorical_categories(
    package,
    feature
):

    if package is None:

        return None

    if not isinstance(
        package,
        dict
    ):

        return None

    possible_keys = [

        "categorical_categories",

        "categorical_values",

        "categories",
    ]

    for key in possible_keys:

        values = package.get(
            key,
            None
        )

        if not isinstance(
            values,
            dict
        ):

            continue

        categories = values.get(
            feature,
            None
        )

        if categories is not None:

            if isinstance(
                categories,
                (
                    list,
                    tuple,
                    set
                )
            ):

                return list(
                    categories
                )

    return None


# ============================================================
# CLEAN MODEL INPUT
# ============================================================

def clean_model_input(
    data,
    package
):

    if package is None:

        return data

    data = data.copy()

    categorical_features = (
        get_categorical_features(
            package
        )
    )

    medians = get_model_medians(
        package
    )

    data = data.replace(
        [
            np.inf,
            -np.inf
        ],
        np.nan
    )

    # ========================================================
    # CATEGORICAL FEATURES
    # ========================================================

    for column in categorical_features:

        if column not in data.columns:

            continue

        categories = (
            get_categorical_categories(
                package,
                column
            )
        )

        if categories:

            value = data[
                column
            ].iloc[0]

            if (
                value is not None
                and str(value).strip() != ""
                and value in categories
            ):

                data[column] = pd.Categorical(
                    data[column],
                    categories=categories
                )

            else:

                data[column] = pd.Categorical(
                    [np.nan],
                    categories=categories
                )

        else:

            try:

                data[column] = (
                    data[column]
                    .astype("category")
                )

            except Exception:

                data[column] = (
                    data[column]
                    .astype(str)
                    .astype("category")
                )

    # ========================================================
    # NUMERIC FEATURES
    # ========================================================

    for column in data.columns:

        if column in categorical_features:

            continue

        data[column] = pd.to_numeric(
            data[column],
            errors="coerce"
        )

        if column in medians:

            median = safe_float(
                medians[column],
                0.0
            )

        else:

            median = safe_float(
                data[column].median(),
                0.0
            )

        data[column] = (
            data[column]
            .fillna(median)
        )

    return data


# ============================================================
# PREPARE MODEL INPUT
# ============================================================

def prepare_model_input(
    patient_data,
    package
):

    if package is None:

        raise ValueError(
            "Model package is missing."
        )

    features = get_model_features(
        package
    )

    if not features:

        raise ValueError(
            "Model feature list not found."
        )

    X = pd.DataFrame(
        [patient_data]
    )

    # Add missing model features
    for feature in features:

        if feature not in X.columns:

            X[feature] = np.nan

    # Keep exact training feature order
    X = X[features]

    X = clean_model_input(
        X,
        package
    )

    return X


# ============================================================
# PREDICT PROBABILITY
# ============================================================

def predict_probability(
    patient_data,
    package
):

    model = get_model(
        package
    )

    if model is None:

        raise ValueError(
            "Model not available."
        )

    X = prepare_model_input(
        patient_data,
        package
    )

    try:

        probabilities = (
            model.predict_proba(X)
        )

    except Exception as e:

        raise ValueError(
            f"Model predict_proba failed: {e}"
        )

    if probabilities is None:

        raise ValueError(
            "Model returned no probability."
        )

    if len(probabilities) == 0:

        raise ValueError(
            "Model returned empty probability."
        )

    if probabilities.shape[1] < 2:

        raise ValueError(
            "Model does not contain "
            "binary probability output."
        )

    probability = probabilities[0][1]

    return float(
        np.clip(
            probability,
            0.0,
            1.0
        )
    )


# ============================================================
# PATIENT-SPECIFIC FEATURE IMPACT
#
# Probability change is calculated as:
#
# Base patient prediction
#       -
# Prediction after replacing ONE abnormal
# feature with an internal reference target
#
# This is model sensitivity / contribution,
# NOT medical causation.
# ============================================================

def calculate_patient_specific_feature_impact(
    patient_data,
    package,
    top_n=8
):

    if package is None:

        return []

    try:

        base_probability = (
            predict_probability(
                patient_data,
                package
            )
        )

    except Exception as e:

        print(
            "[AI] Feature explanation "
            f"base prediction error: {e}"
        )

        return []

    results = []

    model_features = (
        get_model_features(
            package
        )
    )

    for feature, config in (
        CLINICAL_FEATURES.items()
    ):

        if feature not in model_features:

            continue

        current_value = safe_float(
            patient_data.get(
                feature
            )
        )

        if current_value is None:

            continue

        normal_value = (
            CLINICAL_NORMAL_VALUES.get(
                feature
            )
        )

        if normal_value is None:

            continue

        clinical_status = (
            get_clinical_status(
                feature,
                current_value
            )
        )

        # ----------------------------------------------------
        # Normal feature
        # ----------------------------------------------------

        if clinical_status == "NORMAL":

            probability_change = 0.0

            perturbed_probability = (
                base_probability
            )

        # ----------------------------------------------------
        # Abnormal feature
        # ----------------------------------------------------

        else:

            perturbed_data = dict(
                patient_data
            )

            perturbed_data[
                feature
            ] = normal_value

            try:

                perturbed_probability = (
                    predict_probability(
                        perturbed_data,
                        package
                    )
                )

                probability_change = (
                    base_probability
                    -
                    perturbed_probability
                )

            except Exception as e:

                print(
                    f"[AI] Feature explanation "
                    f"failed for {feature}: {e}"
                )

                continue

        probability_change_percent = (
            probability_change * 100.0
        )

        # ----------------------------------------------------
        # Direction
        # ----------------------------------------------------

        if probability_change_percent > 0.5:

            direction = (
                "INCREASES SEPSIS RISK"
            )

        elif probability_change_percent < -0.5:

            direction = (
                "DECREASES SEPSIS RISK"
            )

        else:

            direction = (
                "MINIMAL MODEL IMPACT"
            )

        # ----------------------------------------------------
        # Impact level
        # ----------------------------------------------------

        absolute_impact = abs(
            probability_change_percent
        )

        if absolute_impact >= 10:

            impact = "HIGH IMPACT"

        elif absolute_impact >= 5:

            impact = "MEDIUM IMPACT"

        elif absolute_impact >= 1:

            impact = "LOW IMPACT"

        else:

            impact = "MINIMAL IMPACT"

        # ----------------------------------------------------
        # Explanation
        # ----------------------------------------------------

        if direction == (
            "INCREASES SEPSIS RISK"
        ):

            explanation = (
                f"{config['label'].upper()} "
                f"CONTRIBUTES TO HIGHER "
                f"MODEL-PREDICTED SEPSIS RISK"
            )

        elif direction == (
            "DECREASES SEPSIS RISK"
        ):

            explanation = (
                f"{config['label'].upper()} "
                f"CONTRIBUTES TO LOWER "
                f"MODEL-PREDICTED SEPSIS RISK"
            )

        else:

            explanation = (
                f"{config['label'].upper()} "
                f"HAS MINIMAL MODEL IMPACT"
            )

        # ----------------------------------------------------
        # IMPORTANT
        #
        # Do NOT return normal_target,
        # base_probability or perturbed_probability.
        #
        # Frontend only needs:
        # actual patient value
        # clinical status
        # probability change
        # direction
        # impact
        # explanation
        # ----------------------------------------------------

        results.append({

            "feature": feature,

            "label": config["label"],

            "value": current_value,

            "unit": config["unit"],

            "clinical_status": (
                clinical_status
            ),

            "probability_change": round(
                probability_change_percent,
                2
            ),

            "direction": direction,

            "impact": impact,

            "explanation": explanation
        })

    # --------------------------------------------------------
    # Sort highest model impact first
    # --------------------------------------------------------

    results.sort(
        key=lambda x: abs(
            x["probability_change"]
        ),
        reverse=True
    )

    return results[:top_n]


# ============================================================
# BUILD PATIENT DATA
# ============================================================

def build_patient_data(
    patient,
    latest_vitals,
    latest_labs
):

    age = calculate_age(
        get_value(
            patient,
            "date_of_birth"
        )
    )

    gender = get_value(
        patient,
        "gender"
    )

    if isinstance(
        gender,
        str
    ):

        gender = gender.strip()

        if gender == "":

            gender = None

    # ========================================================
    # VITALS
    # ========================================================

    heart_rate = safe_float(
        get_value(
            latest_vitals,
            "heart_rate"
        )
    )

    systolic_bp = safe_float(
        get_value(
            latest_vitals,
            "systolic_bp"
        )
    )

    diastolic_bp = safe_float(
        get_value(
            latest_vitals,
            "diastolic_bp"
        )
    )

    map_value = safe_float(
        get_value(
            latest_vitals,
            "map"
        )
    )

    # ========================================================
    # CALCULATE MAP IF MISSING
    # ========================================================

    if (
        map_value is None
        and systolic_bp is not None
        and diastolic_bp is not None
    ):

        map_value = (
            diastolic_bp
            +
            (
                systolic_bp
                -
                diastolic_bp
            ) / 3.0
        )

    respiratory_rate = safe_float(
        get_value(
            latest_vitals,
            "respiratory_rate"
        )
    )

    temperature = safe_float(
        get_value(
            latest_vitals,
            "temperature"
        )
    )

    spo2 = safe_float(
        get_value(
            latest_vitals,
            "spo2"
        )
    )

    urine_output = safe_float(
        get_value(
            latest_vitals,
            "urine_output"
        )
    )

    gcs = safe_float(
        get_value(
            latest_vitals,
            "gcs"
        )
    )

    # ========================================================
    # TREATMENT / CONTEXT
    # ========================================================

    vasopressor = safe_float(
        get_value(
            latest_vitals,
            "vasopressor",
            0
        ),
        0
    )

    mechanical_ventilation = safe_float(
        get_value(
            latest_vitals,
            "mechanical_ventilation",
            0
        ),
        0
    )

    antibiotic_given = safe_float(
        get_value(
            latest_vitals,
            "antibiotic_given",
            0
        ),
        0
    )

    fluid_given = safe_float(
        get_value(
            latest_vitals,
            "fluid_given",
            0
        ),
        0
    )

    # ========================================================
    # LABS
    # ========================================================

    wbc = safe_float(
        get_value(
            latest_labs,
            "wbc"
        )
    )

    platelets = safe_float(
        get_value(
            latest_labs,
            "platelets"
        )
    )

    creatinine = safe_float(
        get_value(
            latest_labs,
            "creatinine"
        )
    )

    bilirubin = safe_float(
        get_value(
            latest_labs,
            "bilirubin"
        )
    )

    lactate = safe_float(
        get_value(
            latest_labs,
            "lactate"
        )
    )

    glucose = safe_float(
        get_value(
            latest_labs,
            "glucose"
        )
    )

    crp = safe_float(
        get_value(
            latest_labs,
            "crp"
        )
    )

    procalcitonin = safe_float(
        get_value(
            latest_labs,
            "procalcitonin"
        )
    )

    return {

        "age": age,

        "gender": gender,

        "heart_rate": heart_rate,

        "systolic_bp": systolic_bp,

        "diastolic_bp": diastolic_bp,

        "map": map_value,

        "respiratory_rate": respiratory_rate,

        "temperature": temperature,

        "spo2": spo2,

        "urine_output": urine_output,

        "gcs": gcs,

        "vasopressor": vasopressor,

        "mechanical_ventilation": (
            mechanical_ventilation
        ),

        "antibiotic_given": (
            antibiotic_given
        ),

        "fluid_given": (
            fluid_given
        ),

        "wbc": wbc,

        "platelets": platelets,

        "creatinine": creatinine,

        "bilirubin": bilirubin,

        "lactate": lactate,

        "glucose": glucose,

        "crp": crp,

        "procalcitonin": procalcitonin
    }


# ============================================================
# VALIDATE CLINICAL DATA
# ============================================================

def validate_clinical_data(
    patient_data
):

    required_fields = [

        "heart_rate",

        "systolic_bp",

        "diastolic_bp",

        "respiratory_rate",

        "temperature",

        "spo2"
    ]

    missing_fields = []

    invalid_fields = []

    for field in required_fields:

        value = patient_data.get(
            field
        )

        if value is None:

            missing_fields.append(
                field
            )

            continue

        numeric_value = safe_float(
            value
        )

        if numeric_value is None:

            invalid_fields.append(
                field
            )

    return (
        missing_fields,
        invalid_fields
    )


# ============================================================
# ORGAN MODEL PREDICTION
# ============================================================

def predict_organ_risk(
    patient_data,
    package,
    organ_name
):

    if package is None:

        return {

            "prediction": 0,

            "probability": 0,

            "risk_level": "UNKNOWN",

            "error": (
                f"{organ_name} model not available"
            )
        }

    try:

        probability = predict_probability(
            patient_data,
            package
        )

        prediction = int(
            probability >= 0.50
        )

        return {

            "prediction": prediction,

            "probability": round(
                probability * 100,
                2
            ),

            "risk_level": (
                get_risk_level(
                    probability
                )
            )
        }

    except Exception as e:

        print(
            f"[AI] {organ_name} prediction "
            f"failed: {e}"
        )

        return {

            "prediction": 0,

            "probability": 0,

            "risk_level": "UNKNOWN",

            "error": str(e)
        }


# ============================================================
# PREDICT PATIENT
# ============================================================

@router.post(
    "/predict/{patient_identifier}"
)
def predict_patient(
    patient_identifier: str,
    db: Session = Depends(get_db)
):

    print("\n")
    print("=" * 70)

    print(
        f"[AI] Starting prediction for patient "
        f"{patient_identifier}"
    )

    print("=" * 70)

    # ========================================================
    # GET PATIENT
    # ========================================================

    patient = None

    # ========================================================
    # 1. TRY DATABASE INTEGER ID
    # ========================================================

    try:

        numeric_id = int(
            patient_identifier
        )

        patient = (
            db.query(Patient)
            .filter(
                Patient.id == numeric_id
            )
            .first()
        )

    except (
        ValueError,
        TypeError
    ):

        pass

    # ========================================================
    # 2. TRY HUMAN-READABLE PATIENT ID
    #
    # Example:
    # PAT-2026-000020
    # ========================================================

    if patient is None:

        patient = (
            db.query(Patient)
            .filter(
                Patient.patient_id
                == patient_identifier
            )
            .first()
        )

    # ========================================================
    # PATIENT NOT FOUND
    # ========================================================

    if patient is None:

        print(
            f"[AI] Patient not found: "
            f"{patient_identifier}"
        )

        raise HTTPException(

            status_code=404,

            detail={

                "message": "Patient not found",

                "patient_identifier": (
                    patient_identifier
                )
            }
        )

    # ========================================================
    # PATIENT ID
    #
    # VitalSign.patient_id is VARCHAR.
    #
    # Therefore use:
    #
    # patient.patient_id
    #
    # NOT:
    #
    # patient.id
    # ========================================================

    patient_id = patient.patient_id

    print(
        f"[AI] Database ID: "
        f"{patient.id}"
    )

    print(
        f"[AI] Patient ID: "
        f"{patient.patient_id}"
    )

    # ========================================================
    # GET LATEST VITALS
    # ========================================================

    try:

        latest_vitals = (
            db.query(VitalSign)
            .filter(
                VitalSign.patient_id
                == patient_id
            )
            .order_by(
                VitalSign.recorded_at.desc()
            )
            .first()
        )

    except Exception as e:

        print(
            "[AI] Vital query failed:",
            e
        )

        raise HTTPException(

            status_code=500,

            detail={

                "message": (
                    "Unable to retrieve "
                    "patient vital signs"
                ),

                "error": str(e)
            }
        )

    # ========================================================
    # GET LATEST LABS
    # ========================================================

    try:

        latest_labs = (
            db.query(LabResult)
            .filter(
                LabResult.patient_id
                == patient_id
            )
            .order_by(
                LabResult.recorded_at.desc()
            )
            .first()
        )

    except Exception as e:

        print(
            "[AI] Lab query failed:",
            e
        )

        raise HTTPException(

            status_code=500,

            detail={

                "message": (
                    "Unable to retrieve "
                    "patient laboratory results"
                ),

                "error": str(e)
            }
        )

    # ========================================================
    # CHECK VITAL RECORD
    # ========================================================

    if latest_vitals is None:

        print(
            f"[AI] No vital record found "
            f"for patient {patient_id}"
        )

        raise HTTPException(

            status_code=422,

            detail={

                "message": (
                    "No clinical vital-sign "
                    "record found for this patient"
                ),

                "missing_source": "vitals",

                "patient_id": patient_id
            }
        )

    # ========================================================
    # BUILD PATIENT DATA
    # ========================================================

    patient_data = build_patient_data(

        patient,

        latest_vitals,

        latest_labs
    )

    # ========================================================
    # DEBUG PATIENT DATA
    # ========================================================

    print(
        "[AI] Patient data:"
    )

    for key, value in (
        patient_data.items()
    ):

        print(
            f"    {key}: {value}"
        )

    print("-" * 70)

    # ========================================================
    # VALIDATE CLINICAL DATA
    # ========================================================

    (
        missing_fields,
        invalid_fields
    ) = validate_clinical_data(
        patient_data
    )

    if (
        missing_fields
        or invalid_fields
    ):

        print(
            "[AI] CLINICAL DATA VALIDATION FAILED"
        )

        print(
            f"[AI] Missing fields: "
            f"{missing_fields}"
        )

        print(
            f"[AI] Invalid fields: "
            f"{invalid_fields}"
        )

        raise HTTPException(

            status_code=422,

            detail={

                "message": (
                    "Required clinical data "
                    "missing or invalid"
                ),

                "missing_fields": (
                    missing_fields
                ),

                "invalid_fields": (
                    invalid_fields
                ),

                "patient_data": {

                    key: patient_data.get(
                        key
                    )

                    for key in [

                        "heart_rate",

                        "systolic_bp",

                        "diastolic_bp",

                        "respiratory_rate",

                        "temperature",

                        "spo2"
                    ]
                }
            }
        )

    # ========================================================
    # CHECK SEPSIS MODEL
    # ========================================================

    if sepsis_package is None:

        print(
            "[AI] ERROR: Sepsis model package "
            "is None"
        )

        print(
            "[AI] Expected model path:",
            SEPSIS_MODEL_PATH
        )

        print(
            "[AI] Model exists:",
            os.path.exists(
                SEPSIS_MODEL_PATH
            )
        )

        raise HTTPException(

            status_code=500,

            detail={

                "message": (
                    "Sepsis model not available"
                ),

                "model_path": (
                    SEPSIS_MODEL_PATH
                ),

                "model_exists": (
                    os.path.exists(
                        SEPSIS_MODEL_PATH
                    )
                )
            }
        )

    # ========================================================
    # CHECK ACTUAL MODEL OBJECT
    # ========================================================

    sepsis_model = get_model(
        sepsis_package
    )

    if sepsis_model is None:

        raise HTTPException(

            status_code=500,

            detail={

                "message": (
                    "Sepsis model package "
                    "loaded, but model object "
                    "is missing"
                ),

                "model_path": (
                    SEPSIS_MODEL_PATH
                )
            }
        )

    # ========================================================
    # PRINT MODEL FEATURES
    # ========================================================

    sepsis_features = (
        get_model_features(
            sepsis_package
        )
    )

    print(
        "[AI] Sepsis model features:"
    )

    print(
        sepsis_features
    )

    # ========================================================
    # SEPSIS PREDICTION
    # ========================================================

    try:

        sepsis_probability = (
            predict_probability(

                patient_data,

                sepsis_package
            )
        )

    except Exception as e:

        print(
            "[AI] Sepsis prediction error:"
        )

        print(
            repr(e)
        )

        raise HTTPException(

            status_code=500,

            detail={

                "message": (
                    "Sepsis prediction failed"
                ),

                "error": str(e),

                "patient_id": (
                    patient.patient_id
                ),

                "model_features": (
                    sepsis_features
                )
            }
        )

    # ========================================================
    # TRAINING-SAVED THRESHOLD
    # ========================================================

    model_threshold = (
        sepsis_package.get(
            "threshold",
            0.50
        )
        if isinstance(
            sepsis_package,
            dict
        )
        else 0.50
    )

    try:

        model_threshold = float(
            model_threshold
        )

    except (
        ValueError,
        TypeError
    ):

        model_threshold = 0.50

    # ========================================================
    # SEPSIS PREDICTION CLASS
    # ========================================================

    sepsis_prediction = int(

        sepsis_probability
        >= model_threshold
    )

    sepsis_risk_level = (
        get_risk_level(
            sepsis_probability
        )
    )

    # ========================================================
    # CRITICAL STATUS
    # ========================================================

    patient.critical = bool(

        sepsis_probability
        >= CRITICAL_THRESHOLD
    )

    try:

        db.commit()

    except Exception as e:

        print(
            "[WARNING] Unable to update "
            f"critical status: {e}"
        )

        db.rollback()

    # ========================================================
    # ORGAN RISKS
    # ========================================================

    organ_risks = {

        "kidney": predict_organ_risk(

            patient_data,

            kidney_package,

            "Kidney"
        ),

        "liver": predict_organ_risk(

            patient_data,

            liver_package,

            "Liver"
        ),

        "lung": predict_organ_risk(

            patient_data,

            lung_package,

            "Lung"
        ),

        "cardiovascular": (
            predict_organ_risk(

                patient_data,

                cardiovascular_package,

                "Cardiovascular"
            )
        )
    }

    # ========================================================
    # PATIENT-SPECIFIC FEATURE IMPACT
    # ========================================================

    patient_feature_impact = (
        calculate_patient_specific_feature_impact(

            patient_data,

            sepsis_package,

            top_n=8
        )
    )

    # ========================================================
    # CLINICAL DATA RESPONSE
    # ========================================================

    clinical_data = {

        "age": patient_data.get(
            "age"
        ),

        "gender": patient_data.get(
            "gender"
        ),

        "heart_rate": patient_data.get(
            "heart_rate"
        ),

        "systolic_bp": patient_data.get(
            "systolic_bp"
        ),

        "diastolic_bp": patient_data.get(
            "diastolic_bp"
        ),

        "map": patient_data.get(
            "map"
        ),

        "respiratory_rate": patient_data.get(
            "respiratory_rate"
        ),

        "temperature": patient_data.get(
            "temperature"
        ),

        "spo2": patient_data.get(
            "spo2"
        ),

        "urine_output": patient_data.get(
            "urine_output"
        ),

        "gcs": patient_data.get(
            "gcs"
        ),

        "wbc": patient_data.get(
            "wbc"
        ),

        "platelets": patient_data.get(
            "platelets"
        ),

        "creatinine": patient_data.get(
            "creatinine"
        ),

        "bilirubin": patient_data.get(
            "bilirubin"
        ),

        "lactate": patient_data.get(
            "lactate"
        ),

        "glucose": patient_data.get(
            "glucose"
        ),

        "crp": patient_data.get(
            "crp"
        ),

        "procalcitonin": patient_data.get(
            "procalcitonin"
        ),

        "vasopressor": patient_data.get(
            "vasopressor"
        ),

        "mechanical_ventilation": (
            patient_data.get(
                "mechanical_ventilation"
            )
        ),

        "antibiotic_given": (
            patient_data.get(
                "antibiotic_given"
            )
        ),

        "fluid_given": (
            patient_data.get(
                "fluid_given"
            )
        )
    }

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    response = {

        "status": "success",

        "patient_id": (
            patient.patient_id
        ),

        "database_id": (
            patient.id
        ),

        # ====================================================
        # SEPSIS
        # ====================================================

        "sepsis": {

            "prediction": (
                sepsis_prediction
            ),

            "probability": round(

                sepsis_probability * 100,

                2
            ),

            "risk_level": (
                sepsis_risk_level
            ),

            "threshold": round(

                model_threshold * 100,

                2
            )
        },

        # ====================================================
        # ORGAN RISKS
        # ====================================================

        "organ_risks": organ_risks,

        # ====================================================
        # PATIENT-SPECIFIC EXPLANATION
        # ====================================================

        "patient_specific_feature_impact": (
            patient_feature_impact
        ),

        # Backward compatibility
        "permutation_importance": (
            patient_feature_impact
        ),

        # ====================================================
        # CLINICAL DATA
        # ====================================================

        "clinical_data": clinical_data,

        # ====================================================
        # SOURCE RECORDS
        # ====================================================

        "source_ids": {

            "vitals_id": getattr(

                latest_vitals,

                "id",

                None
            ),

            "labs_id": getattr(

                latest_labs,

                "id",

                None
            )
        },

        # ====================================================
        # MODEL STATUS
        # ====================================================

        "model_status": {

            "sepsis": (
                sepsis_package is not None
            ),

            "kidney": (
                kidney_package is not None
            ),

            "liver": (
                liver_package is not None
            ),

            "lung": (
                lung_package is not None
            ),

            "cardiovascular": (
                cardiovascular_package
                is not None
            )
        }
    }

    # ========================================================
    # TERMINAL SUMMARY
    # ========================================================

    print("=" * 70)

    print(
        "[AI] Prediction completed"
    )

    print(
        f"[AI] Patient ID: "
        f"{patient.patient_id}"
    )

    print(
        f"[AI] Database ID: "
        f"{patient.id}"
    )

    print(
        f"[AI] Sepsis probability: "
        f"{round(sepsis_probability * 100, 2)}%"
    )

    print(
        f"[AI] Sepsis risk: "
        f"{sepsis_risk_level}"
    )

    print(
        f"[AI] Sepsis prediction: "
        f"{sepsis_prediction}"
    )

    print(
        f"[AI] Critical: "
        f"{patient.critical}"
    )

    print(
        f"[AI] Explanation features: "
        f"{len(patient_feature_impact)}"
    )

    print("=" * 70)

    print()

    return response


# ============================================================
# MODEL STATUS
# ============================================================

@router.get(
    "/status"
)
def model_status():

    return {

        "sepsis_model": (
            sepsis_package is not None
        ),

        "kidney_model": (
            kidney_package is not None
        ),

        "liver_model": (
            liver_package is not None
        ),

        "lung_model": (
            lung_package is not None
        ),

        "cardiovascular_model": (
            cardiovascular_package is not None
        ),

        "model_directory": MODEL_DIR,

        "sepsis_model_path": (
            SEPSIS_MODEL_PATH
        ),

        "sepsis_model_exists": (
            os.path.exists(
                SEPSIS_MODEL_PATH
            )
        )
    }


# ============================================================
# CRITICAL PATIENT COUNT
# ============================================================

@router.get(
    "/critical-count"
)
def critical_count(
    db: Session = Depends(get_db)
):

    count = (
        db.query(Patient)
        .filter(
            Patient.critical == True
        )
        .count()
    )

    return {

        "critical_count": count
    }


# ============================================================
# CRITICAL PATIENTS
# ============================================================

@router.get(
    "/critical-patients"
)
def critical_patients(
    db: Session = Depends(get_db)
):

    patients = (
        db.query(Patient)
        .filter(
            Patient.critical == True
        )
        .all()
    )

    return {

        "count": len(
            patients
        ),

        "patients": [

            {

                "id": patient.id,

                "patient_id": getattr(
                    patient,
                    "patient_id",
                    None
                ),

                "first_name": getattr(
                    patient,
                    "first_name",
                    ""
                ),

                "last_name": getattr(
                    patient,
                    "last_name",
                    ""
                ),

                "critical": True
            }

            for patient in patients
        ]
    }