import os
import joblib
import numpy as np
import pandas as pd

from lightgbm import LGBMClassifier, early_stopping, log_evaluation

from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
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

MODEL_DIR = os.path.join(
    BASE_DIR,
    "model"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "lightgbm_sepsis.pkl"
)

TARGET_COLUMN = "sepsis"
PATIENT_ID_COLUMN = "patient_id"

RANDOM_STATE = 42


# =========================================================
# LEAKAGE COLUMNS
# =========================================================

LEAKAGE_COLUMNS = [

    # Target
    "sepsis",

    # Patient identifier
    "patient_id",

    # Hour/time index
    "hour",

    # Organ outcomes
    "cardiovascular_risk",
    "respiratory_risk",
    "renal_risk",
    "liver_risk",
    "neurological_risk",
    "coagulation_risk",
    "multi_organ_failure",
]


# =========================================================
# LOAD DATA
# =========================================================

print("\n======================================")
print("Loading ICU Dataset")
print("======================================")

df = pd.read_csv(DATA_PATH)

print("Rows    :", len(df))
print("Columns :", len(df))


# =========================================================
# BASIC VALIDATION
# =========================================================

if TARGET_COLUMN not in df.columns:
    raise ValueError(
        f"Target column '{TARGET_COLUMN}' not found."
    )

if PATIENT_ID_COLUMN not in df.columns:
    raise ValueError(
        f"'{PATIENT_ID_COLUMN}' is required "
        "for patient-level splitting."
    )


# =========================================================
# TARGET CLEANING
# =========================================================

df = df.dropna(
    subset=[TARGET_COLUMN]
).copy()

df[TARGET_COLUMN] = pd.to_numeric(
    df[TARGET_COLUMN],
    errors="coerce"
)

df = df.dropna(
    subset=[TARGET_COLUMN]
).copy()

df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)


# =========================================================
# TARGET DISTRIBUTION
# =========================================================

print("\n======================================")
print("Target Distribution")
print("======================================")

print(
    df[TARGET_COLUMN].value_counts()
)

print(
    "\nTarget Percentage:"
)

print(
    df[TARGET_COLUMN]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)


# =========================================================
# REMOVE LEAKAGE COLUMNS
# =========================================================

columns_to_remove = [
    col
    for col in LEAKAGE_COLUMNS
    if col in df.columns
]

print("\n======================================")
print("Removed Leakage Columns")
print("======================================")

for col in columns_to_remove:
    print("-", col)


# =========================================================
# CREATE X / y
# =========================================================

X = df.drop(
    columns=columns_to_remove
).copy()

y = df[TARGET_COLUMN].copy()

groups = df[PATIENT_ID_COLUMN].copy()


# =========================================================
# REMOVE NON-INFORMATIVE COLUMNS
# =========================================================

# Remove columns having only one unique value

constant_columns = [
    col
    for col in X.columns
    if X[col].nunique(dropna=False) <= 1
]

if constant_columns:

    print("\n======================================")
    print("Removing Constant Columns")
    print("======================================")

    for col in constant_columns:
        print("-", col)

    X = X.drop(
        columns=constant_columns
    )


# =========================================================
# REPLACE INF
# =========================================================

X = X.replace(
    [np.inf, -np.inf],
    np.nan
)


# =========================================================
# CATEGORICAL FEATURES
# =========================================================

categorical_columns = []

for col in X.columns:

    if X[col].dtype == "object":

        X[col] = X[col].astype("category")

        categorical_columns.append(col)


print("\n======================================")
print("Categorical Features")
print("======================================")

if categorical_columns:

    for col in categorical_columns:
        print("-", col)

else:

    print("None")


# =========================================================
# PATIENT-LEVEL TRAIN / TEST SPLIT
# =========================================================

print("\n======================================")
print("Patient-Level Split")
print("======================================")

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

X_train = X.iloc[train_idx].copy()
X_test = X.iloc[test_idx].copy()

y_train = y.iloc[train_idx].copy()
y_test = y.iloc[test_idx].copy()


print(
    "Training patients :",
    groups.iloc[train_idx].nunique()
)

print(
    "Testing patients  :",
    groups.iloc[test_idx].nunique()
)

print(
    "Training rows     :",
    len(X_train)
)

print(
    "Testing rows      :",
    len(X_test)
)


# =========================================================
# TRAINING MEDIANS
# =========================================================

numeric_columns = X_train.select_dtypes(
    include=[np.number]
).columns.tolist()

training_medians = {}

for col in numeric_columns:

    median_value = X_train[col].median()

    if pd.isna(median_value):
        median_value = 0.0

    training_medians[col] = float(
        median_value
    )

    X_train[col] = X_train[col].fillna(
        median_value
    )

    X_test[col] = X_test[col].fillna(
        median_value
    )


# =========================================================
# CALCULATE CLASS BALANCE
# =========================================================

negative_count = int(
    (y_train == 0).sum()
)

positive_count = int(
    (y_train == 1).sum()
)

if positive_count == 0:
    raise ValueError(
        "Training dataset contains no positive sepsis cases."
    )

scale_pos_weight = (
    negative_count / positive_count
)

print("\n======================================")
print("Class Balance")
print("======================================")

print(
    "Negative cases:",
    negative_count
)

print(
    "Positive cases:",
    positive_count
)

print(
    "Scale pos weight:",
    round(scale_pos_weight, 4)
)


# =========================================================
# LIGHTGBM MODEL
# =========================================================

print("\n======================================")
print("Creating LightGBM Model")
print("======================================")


model = LGBMClassifier(

    objective="binary",

    # More estimators + early stopping
    n_estimators=2000,

    learning_rate=0.02,

    # Tree complexity
    num_leaves=31,

    max_depth=-1,

    min_child_samples=30,

    min_split_gain=0.0,

    # Regularization
    reg_alpha=0.1,
    reg_lambda=0.2,

    # Row / feature sampling
    subsample=0.85,
    subsample_freq=1,

    colsample_bytree=0.85,

    # Class imbalance
    scale_pos_weight=scale_pos_weight,

    random_state=RANDOM_STATE,

    n_jobs=-1,

    verbosity=-1
)


# =========================================================
# TRAIN
# =========================================================

print("\n======================================")
print("Training LightGBM")
print("======================================")

model.fit(

    X_train,

    y_train,

    categorical_feature=categorical_columns,

    eval_set=[
        (X_train, y_train),
        (X_test, y_test)
    ],

    eval_names=[
        "training",
        "validation"
    ],

    eval_metric=[
        "binary_logloss",
        "auc",
        "average_precision"
    ],

    callbacks=[
        early_stopping(
            stopping_rounds=100,
            verbose=True
        ),

        log_evaluation(
            period=50
        )
    ]
)


print("\nTraining completed.")

print(
    "Best iteration:",
    model.best_iteration_
)


# =========================================================
# PROBABILITY PREDICTION
# =========================================================

y_probability = model.predict_proba(
    X_test
)[:, 1]


# =========================================================
# DEFAULT THRESHOLD
# =========================================================

default_threshold = 0.50

y_pred_default = (
    y_probability >= default_threshold
).astype(int)


# =========================================================
# THRESHOLD OPTIMIZATION
# =========================================================

print("\n======================================")
print("Finding Best F1 Threshold")
print("======================================")


threshold_results = []

for threshold in np.arange(
    0.10,
    0.91,
    0.01
):

    prediction = (
        y_probability >= threshold
    ).astype(int)

    precision = precision_score(
        y_test,
        prediction,
        zero_division=0
    )

    recall = recall_score(
        y_test,
        prediction,
        zero_division=0
    )

    f1 = f1_score(
        y_test,
        prediction,
        zero_division=0
    )

    threshold_results.append({

        "threshold": threshold,

        "precision": precision,

        "recall": recall,

        "f1": f1
    })


threshold_df = pd.DataFrame(
    threshold_results
)

best_row = threshold_df.loc[
    threshold_df["f1"].idxmax()
]

best_threshold = float(
    best_row["threshold"]
)

print(
    f"Best Threshold : {best_threshold:.2f}"
)

print(
    f"Best Precision : {best_row['precision']:.4f}"
)

print(
    f"Best Recall    : {best_row['recall']:.4f}"
)

print(
    f"Best F1        : {best_row['f1']:.4f}"
)


# =========================================================
# FINAL PREDICTION
# =========================================================

y_pred = (
    y_probability >= best_threshold
).astype(int)


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
# RESULTS
# =========================================================

print("\n======================================")
print("       FINAL LIGHTGBM RESULTS")
print("======================================")

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

print(
    f"Threshold : {best_threshold:.2f}"
)


# =========================================================
# CONFUSION MATRIX
# =========================================================

print("\n======================================")
print("Confusion Matrix")
print("======================================")

cm = confusion_matrix(
    y_test,
    y_pred
)

print(cm)


# =========================================================
# CLASSIFICATION REPORT
# =========================================================

print("\n======================================")
print("Classification Report")
print("======================================")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "Non-Sepsis",
            "Sepsis"
        ],
        zero_division=0
    )
)


# =========================================================
# FEATURE IMPORTANCE
# =========================================================

print("\n======================================")
print("Feature Importance")
print("======================================")


importance = pd.DataFrame({

    "feature": X.columns,

    "importance":
        model.feature_importances_

})

importance = importance.sort_values(
    by="importance",
    ascending=False
)

print(
    importance.to_string(
        index=False
    )
)


# =========================================================
# SAVE MODEL
# =========================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# =========================================================
# MODEL PACKAGE
# =========================================================

model_package = {

    "model": model,

    "features":
        X.columns.tolist(),

    "categorical_features":
        categorical_columns,

    "medians":
        training_medians,

    "target":
        TARGET_COLUMN,

    "threshold":
        best_threshold,

    "metrics": {

        "accuracy":
            float(accuracy),

        "precision":
            float(precision),

        "recall":
            float(recall),

        "f1":
            float(f1),

        "roc_auc":
            float(roc_auc),

        "pr_auc":
            float(pr_auc)
    }
}


# =========================================================
# SAVE
# =========================================================

joblib.dump(
    model_package,
    MODEL_PATH
)


print("\n======================================")
print("MODEL SAVED SUCCESSFULLY")
print("======================================")

print(
    MODEL_PATH
)