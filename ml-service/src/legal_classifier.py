"""
Suraksha Setu — Multi-Label Legal Category & Applicable Law Classifier
Pipeline:
- Multi-label classification (One-vs-Rest Logistic Regression)
- Word n-grams (1, 2) + Character n-grams (3, 5) for multilingual English, Hindi, and Hinglish
- Context indicators (target_minor, is_online)
- Reproducible artifact serialization to models/legal_classifier.joblib
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import MultiLabelBinarizer

# Ensure src in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from preprocessing import normalize_multilingual_text

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "legal_cases.csv")
MODEL_FILE = os.path.join(MODELS_DIR, "legal_classifier.joblib")
META_FILE = os.path.join(MODELS_DIR, "legal_metadata.json")

SUPPORTED_FRAMEWORKS = [
    "posh_act_2013",
    "bns_2023",
    "pocso_act_2012",
    "ugc_regulations_2015",
    "it_act_2000",
    "general_workplace_misconduct",
    "insufficient_information",
]


def train_legal_classifier():
    os.makedirs(MODELS_DIR, exist_ok=True)
    df = pd.read_csv(DATA_PATH)

    # Clean and normalize narrative
    df["clean_narrative"] = df["narrative"].fillna("").apply(normalize_multilingual_text)
    df["target_minor"] = df["target_minor"].fillna(0).astype(int)
    df["is_online"] = df["is_online"].fillna(0).astype(int)

    # Parse multi-labels
    df["label_list"] = df["legal_frameworks"].apply(lambda s: [lbl.strip() for lbl in str(s).split(";") if lbl.strip()])

    mlb = MultiLabelBinarizer(classes=SUPPORTED_FRAMEWORKS)
    Y = mlb.fit_transform(df["label_list"])

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "text_words",
                TfidfVectorizer(
                    ngram_range=(1, 2),
                    max_features=1200,
                    sublinear_tf=True,
                ),
                "clean_narrative",
            ),
            (
                "text_chars",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    max_features=1500,
                    sublinear_tf=True,
                ),
                "clean_narrative",
            ),
            (
                "indicators",
                "passthrough",
                ["target_minor", "is_online"],
            ),
        ]
    )

    classifier = OneVsRestClassifier(
        LogisticRegression(class_weight="balanced", C=2.0, max_iter=500, random_state=42)
    )

    model_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    X = df[["clean_narrative", "target_minor", "is_online"]]
    model_pipeline.fit(X, Y)

    # Save artifact
    joblib.dump(
        {"pipeline": model_pipeline, "mlb": mlb, "classes": list(mlb.classes_)},
        MODEL_FILE,
    )

    metadata = {
        "model_version": "v1.0.0-legal-multilabel",
        "dataset_type": "synthetic_development_sample",
        "is_demo_model": True,
        "classes": list(mlb.classes_),
        "sample_count": len(df),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Trained on synthetic development sample for architectural integration and pipeline validation. Advisory only.",
    }

    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("Legal classifier trained and saved successfully.")
    return model_pipeline, mlb, metadata


def load_legal_classifier():
    if not os.path.exists(MODEL_FILE):
        return train_legal_classifier()
    artifact = joblib.load(MODEL_FILE)
    meta = {}
    if os.path.exists(META_FILE):
        with open(META_FILE, "r", encoding="utf-8") as f:
            meta = json.load(f)
    return artifact["pipeline"], artifact["mlb"], meta


if __name__ == "__main__":
    train_legal_classifier()
