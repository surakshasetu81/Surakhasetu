"""
Suraksha Setu — ML Model Evaluation & Quality Gates
Computes detailed diagnostic metrics:
- False-negative analysis for urgent cases
- Per-class precision, recall, F1
- Verification quality thresholds
"""

import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "sample_cases.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_ARTIFACT_PATH = os.path.join(MODELS_DIR, "triage_model.joblib")
EVAL_RESULTS_PATH = os.path.join(MODELS_DIR, "evaluation_results.json")


def run_evaluation():
    if not os.path.exists(MODEL_ARTIFACT_PATH):
        raise FileNotFoundError(f"Model artifact not found at {MODEL_ARTIFACT_PATH}. Run train.py first.")

    pipeline = joblib.load(MODEL_ARTIFACT_PATH)
    df = pd.read_csv(DATA_PATH)

    X = df.drop(columns=["priority", "case_id"], errors="ignore")
    y_true = df["priority"]

    y_pred = pipeline.predict(X)
    probs = pipeline.predict_proba(X)
    classes = pipeline.classes_.tolist()

    report = classification_report(y_true, y_pred, output_dict=True)
    labels = ["HIGH", "MEDIUM", "LOW"]
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()

    # False-negative analysis for HIGH priority:
    # High cases predicted as Medium or Low
    high_mask = (y_true == "HIGH")
    high_total = int(high_mask.sum())
    high_missed = int(((y_true == "HIGH") & (y_pred != "HIGH")).sum())
    fn_rate_high = float(high_missed / high_total) if high_total > 0 else 0.0

    # False-positive analysis for HIGH priority:
    # Non-high cases predicted as HIGH
    non_high_mask = (y_true != "HIGH")
    non_high_total = int(non_high_mask.sum())
    fp_high = int(((y_true != "HIGH") & (y_pred == "HIGH")).sum())
    fp_rate_high = float(fp_high / non_high_total) if non_high_total > 0 else 0.0

    eval_data = {
        "dataset_evaluated": "sample_cases.csv",
        "total_samples": len(df),
        "classes": labels,
        "overall_accuracy": report.get("accuracy", 0.0),
        "macro_avg_f1": report.get("macro avg", {}).get("f1-score", 0.0),
        "weighted_avg_f1": report.get("weighted avg", {}).get("f1-score", 0.0),
        "per_class_metrics": {
            cls: {
                "precision": report.get(cls, {}).get("precision", 0.0),
                "recall": report.get(cls, {}).get("recall", 0.0),
                "f1_score": report.get(cls, {}).get("f1-score", 0.0),
                "support": report.get(cls, {}).get("support", 0),
            } for cls in labels
        },
        "confusion_matrix": {
            "labels": labels,
            "matrix": cm,
        },
        "urgent_safety_analysis": {
            "high_priority_total": high_total,
            "high_priority_missed_false_negatives": high_missed,
            "false_negative_rate_high": fn_rate_high,
            "high_priority_false_positives": fp_high,
            "false_positive_rate_high": fp_rate_high,
            "deterministic_rule_safeguard_note": "Deterministic safety rules (Layer 1) always override model predictions to ensure high-priority safety triggers are never suppressed.",
        },
    }

    with open(EVAL_RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(eval_data, f, indent=2)

    print("Evaluation completed successfully.")
    print(f"Results written to: {EVAL_RESULTS_PATH}")
    return eval_data


if __name__ == "__main__":
    run_evaluation()
