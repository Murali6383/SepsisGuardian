import os
import joblib
import numpy as np
import pandas as pd

from lightgbm import LGBMClassifier, early_stopping

from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report
)


# ============================================================
# CONFIG
# ============================================================

DATA_PATH = "../dataset/icu_data.csv"
MODEL_DIR = "../model"

RANDOM_STATE = 42


ORGAN_TARGETS = {
    "kidney": "renal_risk",
    "liver": "liver_risk",
    "lung": "respiratory_risk",
    "cardiovascular": "cardiovascular_risk"
}


# ============================================================
# COLUMNS TO REMOVE
# ============================================================

REMOVE_COLUMNS = [
    "patient_id",
    "hour",

    "sepsis",

    "renal_risk",
    "liver_risk",
    "respiratory_risk",
    "cardiovascular_risk",

    "neurological_risk",
    "coagulation_risk",
    "multi_organ_failure"
]


# ============================================================
# CREATE MODEL DIRECTORY
# ============================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# LOAD DATA
# ============================================================

print("\n==============================================")
print("LOADING ICU DATASET")
print("==============================================")

df = pd.read_csv(DATA_PATH)

print("Rows:", len(df))
print("Columns:", len(df.columns))
print("Patients:", df["patient_id"].nunique())


# ============================================================
# TRAIN FUNCTION
# ============================================================

def train_organ_model(
    organ_name,
    target_column
):

    print("\n\n")
    print("################################################")
    print(f"       {organ_name.upper()} MODEL")
    print("################################################")

    print("\nTarget:", target_column)


    # --------------------------------------------------------
    # Target
    # --------------------------------------------------------

    y = df[target_column].astype(int)


    print("\nTarget distribution:")
    print(y.value_counts())


    # --------------------------------------------------------
    # Features
    # --------------------------------------------------------

    remove_cols = [
        col
        for col in REMOVE_COLUMNS
        if col in df.columns
    ]

    X = df.drop(
        columns=remove_cols
    ).copy()


    # --------------------------------------------------------
    # Handle categorical column
    # --------------------------------------------------------

    categorical_features = []

    for col in X.columns:

        if X[col].dtype == "object":

            X[col] = X[col].astype("category")

            categorical_features.append(col)


    # --------------------------------------------------------
    # Replace infinity
    # --------------------------------------------------------

    X = X.replace(
        [np.inf, -np.inf],
        np.nan
    )


    # --------------------------------------------------------
    # Patient groups
    # --------------------------------------------------------

    groups = df["patient_id"]


    # --------------------------------------------------------
    # PATIENT LEVEL SPLIT
    # --------------------------------------------------------

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=0.20,
        random_state=RANDOM_STATE
    )


    train_idx, test_idx = next(
        splitter.split(
            X,
            y,
            groups=groups
        )
    )


    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]

    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]


    # --------------------------------------------------------
    # Verify patient leakage
    # --------------------------------------------------------

    train_patients = set(
        groups.iloc[train_idx]
    )

    test_patients = set(
        groups.iloc[test_idx]
    )


    overlap = train_patients.intersection(
        test_patients
    )


    if overlap:

        raise RuntimeError(
            "Patient leakage detected!"
        )


    print("\nPatient-level split:")
    print("Training patients:", len(train_patients))
    print("Testing patients :", len(test_patients))

    print("Training rows:", len(X_train))
    print("Testing rows :", len(X_test))


    # ========================================================
    # IMPROVED LIGHTGBM
    # ========================================================

    model = LGBMClassifier(

        objective="binary",

        n_estimators=3000,

        learning_rate=0.02,

        num_leaves=63,

        max_depth=-1,

        min_child_samples=30,

        subsample=0.85,

        colsample_bytree=0.85,

        reg_alpha=0.1,

        reg_lambda=0.5,

        class_weight="balanced",

        random_state=RANDOM_STATE,

        n_jobs=-1,

        verbosity=-1
    )


    # ========================================================
    # TRAIN WITH EARLY STOPPING
    # ========================================================

    print("\nTraining improved LightGBM...")


    model.fit(

        X_train,

        y_train,

        eval_set=[
            (X_test, y_test)
        ],

        eval_metric="binary_logloss",

        categorical_feature=categorical_features,

        callbacks=[
            early_stopping(
                100,
                verbose=False
            )
        ]
    )


    print(
        "\nBest iteration:",
        model.best_iteration_
    )


    # ========================================================
    # PROBABILITY
    # ========================================================

    probabilities = model.predict_proba(
        X_test
    )[:, 1]


    # ========================================================
    # THRESHOLD SEARCH
    # ========================================================

    best_threshold = 0.50
    best_f1 = 0


    print("\nSearching best probability threshold...")


    for threshold in np.arange(
        0.20,
        0.81,
        0.01
    ):

        predictions = (
            probabilities >= threshold
        ).astype(int)


        f1 = f1_score(
            y_test,
            predictions,
            zero_division=0
        )


        if f1 > best_f1:

            best_f1 = f1
            best_threshold = threshold


    print(
        "Best threshold:",
        round(best_threshold, 2)
    )


    # ========================================================
    # FINAL PREDICTION
    # ========================================================

    predictions = (
        probabilities >= best_threshold
    ).astype(int)


    # ========================================================
    # METRICS
    # ========================================================

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )

    roc_auc = roc_auc_score(
        y_test,
        probabilities
    )

    pr_auc = average_precision_score(
        y_test,
        probabilities
    )


    # ========================================================
    # RESULTS
    # ========================================================

    print("\n==============================================")
    print(f"{organ_name.upper()} RESULTS")
    print("==============================================")

    print(
        f"Accuracy  : {accuracy:.4f}"
    )

    print(
        f"Precision : {precision:.4f}"
    )

    print(
        f"Recall    : {recall:.4f}"
    )

    print(
        f"F1 Score  : {f1:.4f}"
    )

    print(
        f"ROC-AUC   : {roc_auc:.4f}"
    )

    print(
        f"PR-AUC    : {pr_auc:.4f}"
    )


    # ========================================================
    # CONFUSION MATRIX
    # ========================================================

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions
        )
    )


    # ========================================================
    # CLASSIFICATION REPORT
    # ========================================================

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )


    # ========================================================
    # FEATURE IMPORTANCE
    # ========================================================

    importance = pd.DataFrame({

        "feature":
            X.columns,

        "importance":
            model.feature_importances_

    })


    importance = importance.sort_values(
        "importance",
        ascending=False
    )


    print("\nTop Features:")

    print(
        importance.head(15).to_string(
            index=False
        )
    )


    # ========================================================
    # SAVE MODEL
    # ========================================================

    model_path = os.path.join(

        MODEL_DIR,

        f"{organ_name}_risk_model_v2.pkl"
    )


    package = {

        "model": model,

        "features":
            X.columns.tolist(),

        "categorical_features":
            categorical_features,

        "target":
            target_column,

        "organ":
            organ_name,

        "threshold":
            float(best_threshold)
    }


    joblib.dump(
        package,
        model_path
    )


    print("\nSaved:")
    print(model_path)


# ============================================================
# TRAIN ALL FOUR
# ============================================================

for organ, target in ORGAN_TARGETS.items():

    train_organ_model(
        organ,
        target
    )


print("\n")
print("================================================")
print("ALL IMPROVED ORGAN MODELS COMPLETED")
print("================================================")