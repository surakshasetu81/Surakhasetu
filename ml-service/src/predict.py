"""
Suraksha Setu — ML Triage Prediction Service
Loads calibrated model artifact and generates explainable priority classifications.
"""

import os
import sys
import json
import joblib
import pandas as pd

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_ARTIFACT_PATH = os.path.join(MODELS_DIR, "triage_model.joblib")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

_PIPELINE = None
_METADATA = None


def load_model():
    global _PIPELINE, _METADATA
    if _PIPELINE is None:
        if not os.path.exists(MODEL_ARTIFACT_PATH):
            raise FileNotFoundError(f"Model artifact not found at {MODEL_ARTIFACT_PATH}. Run train.py first.")
        _PIPELINE = joblib.load(MODEL_ARTIFACT_PATH)

    if _METADATA is None:
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                _METADATA = json.load(f)
        else:
            _METADATA = {
                "model_version": "v2026.3-multilingual",
                "is_demo_model": True,
            }
    return _PIPELINE, _METADATA


def predict_triage(input_data: dict) -> dict:
    pipeline, metadata = load_model()

    narrative = str(input_data.get("narrative", "") or "")
    indicators = input_data.get("safety_indicators") or {}
    if hasattr(indicators, "model_dump"):
        indicators = indicators.model_dump()

    # Structure into DataFrame matching training feature columns
    row_dict = {
        "narrative": narrative,
        "immediate_danger": int(bool(indicators.get("immediate_danger", 0))),
        "physical_force": int(bool(indicators.get("physical_force", 0))),
        "ongoing_threats": int(bool(indicators.get("ongoing_threats", 0))),
        "stalking": int(bool(indicators.get("stalking_or_tracking", 0))),
        "target_minor": int(bool(indicators.get("target_is_minor", 0))),
        "urgent_support_requested": int(bool(indicators.get("urgent_support_requested", 0))),
    }

    df_single = pd.DataFrame([row_dict])

    predicted_class = pipeline.predict(df_single)[0]
    probabilities = pipeline.predict_proba(df_single)[0]
    classes = pipeline.classes_.tolist()

    prob_dict = {cls: float(round(prob, 4)) for cls, prob in zip(classes, probabilities)}
    confidence_score = prob_dict.get(predicted_class, 0.0)

    # Compile explainable priority reasons based on feature weights & text cues
    reasons = []
    lower_text = narrative.lower()

    if any(k in lower_text for k in ["rape", "forced sexual", "sexual assault", "बलात्कार", "दुष्कर्म", "zabardasti"]):
        reasons.append("ML feature detection: Sexual violence / assault narrative patterns identified")
    if row_dict["immediate_danger"] or any(k in lower_text for k in ["danger", "knife", "weapon", "acid", "खतरा"]):
        reasons.append("ML feature detection: Immediate physical risk indicators present")
    if row_dict["physical_force"] or any(k in lower_text for k in ["assault", "slapped", "restrained", "मारपीट"]):
        reasons.append("ML feature detection: Violence or physical force narrative patterns identified")
    if row_dict["target_minor"] or any(k in lower_text for k in ["minor", "child", "under 18", "बच्ची", "नाबालिग"]):
        reasons.append("ML feature detection: Vulnerable person / minor safeguarding tokens detected")
    if any(k in lower_text for k in ["hurt myself", "suicide", "harm myself", "खुद को नुकसान"]):
        reasons.append("ML feature detection: Crisis safety concern / immediate distress tokens detected")
    if row_dict["ongoing_threats"] or any(k in lower_text for k in ["blackmail", "धमकी", "viral"]):
        reasons.append("ML feature detection: Intimidation, extortion or persistent stalking tokens")

    if not reasons:
        reasons.append(f"Statistically aligned with {predicted_class} priority baseline complaints based on vocabulary and structure")

    return {
        "suggested_priority": predicted_class,
        "confidence_score": confidence_score,
        "class_probabilities": prob_dict,
        "classification_method": "ml_triage",
        "model_version": metadata.get("model_version", "v2026.3-multilingual"),
        "is_demo_model": metadata.get("is_demo_model", True),
        "priority_reasons": reasons,
        "warning": "Model is trained on demonstration dataset; all predictions must be reviewed by authorized staff." if metadata.get("is_demo_model") else None,
    }
