"""
Suraksha Setu — ML Pipeline Unit & Integration Tests
Tests:
- Schema contracts
- Preprocessing and multilingual text normalization
- Model inference across English, Hindi, and Hinglish inputs
- Quality gate metrics
- Demo / synthetic designation enforcement
"""

import os
import sys
import pytest

# Ensure src is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from preprocessing import normalize_multilingual_text, INDICATOR_COLUMNS
from predict import predict_triage, load_model
from schemas import ClassificationRequest, ClassificationResponse


def test_multilingual_normalization():
    # Test Devanagari Hindi
    hindi = "आरोपी ने मुझे धमकी दी।"
    norm_hi = normalize_multilingual_text(hindi)
    assert "धमकी" in norm_hi

    # Test Hinglish
    hinglish = "Mujhe Office Me Dhamki Di Gayi!!!"
    norm_hg = normalize_multilingual_text(hinglish)
    assert norm_hg == "mujhe office me dhamki di gayi"

    # Test English
    english = "  URGENT: Stalking  and   threats. "
    norm_en = normalize_multilingual_text(english)
    assert norm_en == "urgent stalking and threats"


def test_model_loaded_and_demo_flag():
    pipeline, metadata = load_model()
    assert pipeline is not None
    assert metadata["is_demo_model"] is True, "Model MUST be explicitly flagged as demo/synthetic"
    assert "HIGH" in metadata["classes"]
    assert "MEDIUM" in metadata["classes"]
    assert "LOW" in metadata["classes"]


def test_predict_urgent_safety_case():
    urgent_case = {
        "narrative": "Someone attacked me with a knife in the dark hallway and threatened to kill me.",
        "safety_indicators": {
            "immediate_danger": True,
            "physical_force": True,
            "ongoing_threats": True,
        }
    }
    result = predict_triage(urgent_case)
    assert result["suggested_priority"] == "HIGH"
    assert result["confidence_score"] > 0.5
    assert "HIGH" in result["class_probabilities"]
    assert len(result["priority_reasons"]) > 0


def test_predict_workplace_harassment_case():
    harassment_case = {
        "narrative": "Colleague constantly passes inappropriate personal remarks about my clothing and sends unwanted messages.",
        "safety_indicators": {
            "immediate_danger": False,
            "physical_force": False,
            "ongoing_threats": False,
            "ongoing_harassment": True,
        }
    }
    result = predict_triage(harassment_case)
    assert result["suggested_priority"] in ["MEDIUM", "HIGH"]
    assert result["confidence_score"] > 0.0


def test_predict_general_inquiry_case():
    inquiry_case = {
        "narrative": "What is the procedure to request legal awareness booklets about POSH Act 2013?",
        "safety_indicators": {
            "immediate_danger": False,
            "physical_force": False,
            "ongoing_threats": False,
        }
    }
    result = predict_triage(inquiry_case)
    assert result["suggested_priority"] == "LOW"
    assert result["confidence_score"] > 0.0


def test_predict_hinglish_narrative():
    hinglish_case = {
        "narrative": "Office me senior mujh par zor jabardasti kar raha tha aur maarne ki dhamki di.",
        "safety_indicators": {
            "immediate_danger": True,
            "physical_force": True,
        }
    }
    result = predict_triage(hinglish_case)
    assert result["suggested_priority"] == "HIGH"


def test_classification_request_schema():
    req = ClassificationRequest(
        report_id="SS-TEST-001",
        narrative="Verifying schema validation requirements.",
        language="en",
    )
    assert req.report_id == "SS-TEST-001"
    assert req.safety_indicators.immediate_danger is False
