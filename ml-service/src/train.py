"""
Suraksha Setu — ML Model Training Pipeline
Trains a calibrated multilingual safety triage classifier on verified development data.
"""

import os
import sys
import json
import joblib
from datetime import datetime, timezone
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from preprocessing import build_preprocessor, INDICATOR_COLUMNS

MODEL_VERSION = "v2026.3-multilingual"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "sample_cases.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_ARTIFACT_PATH = os.path.join(MODELS_DIR, "triage_model.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")


def train_model():
    print(f"[{datetime.now(timezone.utc).isoformat()}] Loading development dataset from: {DATA_PATH}")
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} records. Columns: {list(df.columns)}")

    # Schema Validation
    required_cols = ["narrative", "priority"] + INDICATOR_COLUMNS
    for c in required_cols:
        if c not in df.columns:
            raise ValueError(f"Missing required column: {c}")

    # Label Validation
    valid_labels = {"HIGH", "MEDIUM", "LOW"}
    found_labels = set(df["priority"].unique())
    if not found_labels.issubset(valid_labels):
        raise ValueError(f"Invalid priority labels detected: {found_labels - valid_labels}")

    print("Class distribution:\n", df["priority"].value_counts())

    # Train / Test Separation (Stratified 80/20)
    X = df[["narrative"] + INDICATOR_COLUMNS]
    y = df["priority"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training split: {len(X_train)} samples, Test split: {len(X_test)} samples")

    # Build full reproducible pipeline
    preprocessor = build_preprocessor()
    classifier = LogisticRegression(
        class_weight="balanced",
        C=1.5,
        max_iter=1000,
        random_state=42,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])

    print("Fitting feature extraction and classification pipeline...")
    pipeline.fit(X_train, y_train)

    # Evaluate on holdout test set
    y_pred = pipeline.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    conf_matrix = confusion_matrix(y_test, y_pred, labels=["HIGH", "MEDIUM", "LOW"]).tolist()

    print("\nHoldout Test Set Evaluation Report:")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix (HIGH, MEDIUM, LOW):\n", conf_matrix)

    # Save artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_ARTIFACT_PATH)
    print(f"Model artifact saved to: {MODEL_ARTIFACT_PATH}")

    metadata = {
        "model_version": MODEL_VERSION,
        "is_demo_model": True,
        "dataset_type": "synthetic_development_sample",
        "dataset_size": len(df),
        "training_size": len(X_train),
        "test_size": len(X_test),
        "classes": ["HIGH", "MEDIUM", "LOW"],
        "metrics": {
            "accuracy": report.get("accuracy", 0.0),
            "macro_f1": report.get("macro avg", {}).get("f1-score", 0.0),
            "high_priority_recall": report.get("HIGH", {}).get("recall", 0.0),
            "high_priority_precision": report.get("HIGH", {}).get("precision", 0.0),
            "medium_priority_recall": report.get("MEDIUM", {}).get("recall", 0.0),
            "medium_priority_precision": report.get("MEDIUM", {}).get("precision", 0.0),
            "low_priority_recall": report.get("LOW", {}).get("recall", 0.0),
            "low_priority_precision": report.get("LOW", {}).get("precision", 0.0),
            "confusion_matrix": conf_matrix,
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Trained on synthetic development sample for architectural integration and pipeline validation. Not certified as a standalone clinical or legal decision system.",
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Model metadata saved to: {METADATA_PATH}")
    return metadata


if __name__ == "__main__":
    train_model()
