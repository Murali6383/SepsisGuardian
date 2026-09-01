import pandas as pd
import numpy as np
import joblib
import os

from lightgbm import LGBMClassifier

from sklearn.model_selection import train_test_split

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


# =========================================================
# CONFIGURATION
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "icu_data.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "lightgbm_sepsis.pkl"
)

TARGET_COLUMN = "sepsis"

PATIENT_ID_COLUMN = "patient_id"


# =========================================================
# COLUMNS THAT MUST NOT BE USED FOR SEPSIS PREDICTION
# =========================================================

LEAKAGE_COLUMNS = [

    # Target
    "sepsis",

    # Patient identifier
    "patient_id",

    # Time index
    "hour",

    # Organ/outcome labels
    "cardiovascular_risk",
    "respiratory_risk",
    "renal_risk",
    "liver_risk",
    "neurological_risk",
    "coagulation_risk",
    "multi_organ_failure"
]


# =========================================================
# LOAD DATA
# =========================================================

print("\n====================================")
print("Loading ICU Dataset")
print("====================================")

df = pd.read_csv(DATA_PATH)

print("Rows    :", df.shape[0])
print("Columns :", df.shape[1])


# =========================================================
# CHECK TARGET
# =========================================================

if TARGET_COLUMN not in df.columns:

    raise ValueError(
        f"Target column '{TARGET_COLUMN}' not found."
    )


print("\nTarget column:", TARGET_COLUMN)


# =========================================================
# TARGET DISTRIBUTION
# =========================================================

print("\n====================================")
print("Target Distribution")
print("====================================")

print(
    df[TARGET_COLUMN].value_counts()
)


# =========================================================
# REMOVE LEAKAGE COLUMNS
# =========================================================

columns_to_remove = [
    column
    for column in LEAKAGE_COLUMNS
    if column in df.columns
]

print("\n====================================")
print("Removed Columns")
print("====================================")

for column in columns_to_remove:

    print("-", column)


# =========================================================
# CREATE FEATURES AND TARGET
# =========================================================

X = df.drop(
    columns=columns_to_remove
)

y = df[TARGET_COLUMN]


# =========================================================
# HANDLE TARGET
# =========================================================

y = y.astype(int)


# =========================================================
# REPLACE INFINITE VALUES
# =========================================================

X = X.replace(
    [np.inf, -np.inf],
    np.nan
)


# =========================================================
# IDENTIFY CATEGORICAL FEATURES
# =========================================================

categorical_columns = []

for column in X.columns:

    if X[column].dtype == "object":

        X[column] = X[column].astype("category")

        categorical_columns.append(column)


print("\n====================================")
print("Categorical Features")
print("====================================")

for column in categorical_columns:

    print("-", column)


# =========================================================
# DISPLAY FEATURES
# =========================================================

print("\n====================================")
print("Features Used for Training")
print("====================================")

for column in X.columns:

    print("-", column)


# =========================================================
# TRAIN TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

    stratify=y
)


print("\n====================================")
print("Dataset Split")
print("====================================")

print("Training samples :", len(X_train))

print("Testing samples  :", len(X_test))


# =========================================================
# LIGHTGBM MODEL
# =========================================================

model = LGBMClassifier(

    objective="binary",

    n_estimators=500,

    learning_rate=0.03,

    num_leaves=31,

    max_depth=-1,

    subsample=0.8,

    colsample_bytree=0.8,

    class_weight="balanced",

    random_state=42,

    verbosity=-1
)


# =========================================================
# TRAIN MODEL
# =========================================================

print("\n====================================")
print("Training LightGBM")
print("====================================")

model.fit(

    X_train,

    y_train,

    categorical_feature=categorical_columns
)


print("\nTraining completed successfully!")


# =========================================================
# PREDICTION
# =========================================================

y_pred = model.predict(
    X_test
)

y_probability = model.predict_proba(
    X_test
)[:, 1]


# =========================================================
# METRICS
# =========================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

pr_auc = average_precision_score(
    y_test,
    y_probability
)


# =========================================================
# DISPLAY RESULTS
# =========================================================

print("\n====================================")
print("       LIGHTGBM RESULTS")
print("====================================")

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


# =========================================================
# CONFUSION MATRIX
# =========================================================

print("\n====================================")
print("Confusion Matrix")
print("====================================")

print(
    confusion_matrix(
        y_test,
        y_pred
    )
)


# =========================================================
# CLASSIFICATION REPORT
# =========================================================

print("\n====================================")
print("Classification Report")
print("====================================")

print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# =========================================================
# FEATURE IMPORTANCE
# =========================================================

print("\n====================================")
print("Feature Importance")
print("====================================")

importance = pd.DataFrame({

    "feature": X.columns,

    "importance": model.feature_importances_

})

importance = importance.sort_values(
    by="importance",
    ascending=False
)

print(
    importance.to_string(index=False)
)


# =========================================================
# SAVE MODEL
# =========================================================

model_package = {

    "model": model,

    "features": X.columns.tolist(),

    "categorical_features":
        categorical_columns,

    "target":
        TARGET_COLUMN
}


joblib.dump(

    model_package,

    MODEL_PATH

)


print("\n====================================")
print("MODEL SAVED")
print("====================================")

print(
    MODEL_PATH
)
os.makedirs(
    os.path.dirname(MODEL_PATH),
    exist_ok=True
)