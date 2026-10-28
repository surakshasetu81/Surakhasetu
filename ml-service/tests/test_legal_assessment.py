import pytest
import sys
import os

# Ensure ml-service and ml-service/src are on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from legal_kb import get_all_frameworks, get_verified_provisions, is_provision_verified
from legal_recommender import assess_legal_frameworks
from legal_schemas import LegalAssessmentRequest, LegalAssessmentResponse


def test_knowledge_base_integrity():
    frameworks = get_all_frameworks()
    assert "posh_act_2013" in frameworks
    assert "bns_2023" in frameworks
    assert "pocso_act_2012" in frameworks
    assert "ugc_regulations_2015" in frameworks
    assert "it_act_2000" in frameworks
    
    # Test hallucination check
    assert is_provision_verified("posh_act_2013", "Section 2(n)") is True
    assert is_provision_verified("posh_act_2013", "Section 999_NON_EXISTENT") is False


def test_posh_workplace_sexual_harassment():
    req = LegalAssessmentRequest(
        narrative="My manager repeatedly demanded sexual favors in exchange for career promotion and touched me inappropriately in the office.",
        context_type="workplace",
        incident_category="Sexual Harassment",
        target_minor=False
    )
    raw = assess_legal_frameworks(req)
    res = LegalAssessmentResponse(**raw)
    assert res.incidentCategory.label == "Workplace Sexual Harassment"
    act_names = [f.actName for f in res.potentiallyRelevantFrameworks]
    assert any("Sexual Harassment of Women at Workplace" in name for name in act_names)
    posh_framework = next(f for f in res.potentiallyRelevantFrameworks if "Sexual Harassment of Women" in f.actName)
    assert len(posh_framework.candidateProvisions) > 0


def test_general_workplace_bullying_not_posh():
    req = LegalAssessmentRequest(
        narrative="My manager screams at me, assigns impossible deadlines, and micromanages all tasks. There is no sexual conduct, but continuous unfair treatment and mental harassment.",
        context_type="workplace",
        incident_category="Workplace Harassment",
        target_minor=False
    )
    raw = assess_legal_frameworks(req)
    res = LegalAssessmentResponse(**raw)
    # Must NOT suggest POSH
    act_names = [f.actName for f in res.potentiallyRelevantFrameworks]
    assert not any("Sexual Harassment of Women" in name for name in act_names)
    assert "internal" in res.incidentCategory.label.lower() or "general" in res.incidentCategory.label.lower()


def test_stalking_bns():
    req = LegalAssessmentRequest(
        narrative="A colleague has been continuously following me home every evening, waiting outside my gate and tracking my movements.",
        context_type="workplace",
        incident_category="Stalking",
        target_minor=False
    )
    raw = assess_legal_frameworks(req)
    res = LegalAssessmentResponse(**raw)
    act_names = [f.actName for f in res.potentiallyRelevantFrameworks]
    assert any("Bharatiya Nyaya Sanhita" in name for name in act_names)
    bns_framework = next(f for f in res.potentiallyRelevantFrameworks if "Bharatiya Nyaya Sanhita" in f.actName)
    provision_ids = [p.section for p in bns_framework.candidateProvisions]
    assert "Section 78" in provision_ids


def test_pocso_under_18():
    req = LegalAssessmentRequest(
        narrative="A minor girl studying in class 11 was subjected to unwelcome touching and sexual advances by a senior staff member.",
        context_type="school",
        incident_category="Sexual Assault",
        target_minor=True
    )
    raw = assess_legal_frameworks(req)
    res = LegalAssessmentResponse(**raw)
    act_names = [f.actName for f in res.potentiallyRelevantFrameworks]
    assert any("Protection of Children from Sexual Offences" in name for name in act_names)
    assert any("pocso" in info.lower() or "safeguarding" in info.lower() for info in res.additionalInformationNeeded)


def test_vague_description_returns_additional_info_needed():
    req = LegalAssessmentRequest(
        narrative="Something bad happened yesterday.",
        context_type="workplace",
        incident_category="other",
        target_minor=False
    )
    raw = assess_legal_frameworks(req)
    res = LegalAssessmentResponse(**raw)
    assert res.status in ["ADDITIONAL_INFORMATION_NEEDED", "NO_SPECIFIC_MATCH_IDENTIFIED"]
    assert len(res.additionalInformationNeeded) > 0


def test_hallucinated_provision_filter():
    # Calling get_verified_provisions with an unapproved section must return empty or omit it
    provisions = get_verified_provisions("posh_act_2013", specific_sections=["Section 9999_HALLUCINATED"])
    assert len(provisions) == 0


def test_fastapi_legal_assessment_endpoint():
    from fastapi.testclient import TestClient
    from app import app
    client = TestClient(app)
    
    payload = {
        "narrative": "Colleague at the university college approached me inappropriately in the faculty lab and made explicit sexual advances.",
        "context_type": "higher_education",
        "incident_category": "Sexual Harassment",
        "target_minor": False
    }
    response = client.post("/internal/v1/legal-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["assessmentType"] == "LEGAL_CATEGORY_RECOMMENDATION"
    assert data["status"] in ["PRELIMINARY", "REQUIRES_HUMAN_REVIEW"]
    act_names = [f["actName"] for f in data["potentiallyRelevantFrameworks"]]
    assert any("UGC Regulations" in name or "Sexual Harassment" in name for name in act_names)
    assert "disclaimer" in data
