"""
Suraksha Setu — Legal Category & Applicable Law Recommendation Schemas
Pydantic contracts for legal assessment requests and responses.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LegalAssessmentRequest(BaseModel):
    report_id: Optional[str] = Field(default=None, description="Optional draft or case reference ID")
    narrative: str = Field(..., min_length=1, description="Incident description narrative")
    incident_category: Optional[str] = Field(default="other", description="User-selected incident category")
    context_type: Optional[str] = Field(default="workplace", description="Context: workplace, higher_education, educational, cyber, public, domestic, other")
    target_minor: Optional[bool] = Field(default=False, description="Whether affected person is under 18")
    is_online: Optional[bool] = Field(default=False, description="Whether incident occurred via online/electronic channels")
    language: Optional[str] = Field(default="en", description="Language code (en, hi, etc.)")


class IncidentCategoryResult(BaseModel):
    label: str = Field(..., description="Suggested primary incident category")
    explanation: str = Field(..., description="Plain-language explanation of why this category matches reported facts")


class AdditionalCategoryResult(BaseModel):
    label: str
    explanation: str


class CandidateProvision(BaseModel):
    section: str = Field(..., description="Statutory provision or section number, e.g. Section 2(n), Section 78")
    title: str = Field(..., description="Title of provision")
    summary: str = Field(..., description="Verified statutory summary from approved knowledge base")
    applicabilityCondition: str = Field(..., description="Condition required for applicability")
    officialSource: str = Field(..., description="Official India Code / Ministry URL")


class PotentiallyRelevantFramework(BaseModel):
    actName: str = Field(..., description="Full official act name")
    shortName: str = Field(..., description="Common short citation, e.g. POSH Act, 2013")
    statute: Optional[str] = None
    candidateProvisions: List[CandidateProvision] = Field(default_factory=list)
    reason: str = Field(..., description="Specific plain-language explanation of why this act may be relevant to the facts")
    officialSources: List[Dict[str, str]] = Field(default_factory=list)
    applicabilityStatus: str = Field(default="REQUIRES_HUMAN_REVIEW")


class ModelMetadata(BaseModel):
    modelVersion: str
    knowledgeBaseVersion: str
    assessmentMethod: str
    isDemoModel: bool = True
    labelsPredicted: List[str] = Field(default_factory=list)


class LegalAssessmentResponse(BaseModel):
    assessmentType: str = Field(default="LEGAL_CATEGORY_RECOMMENDATION")
    status: str = Field(..., description="PRELIMINARY, ADDITIONAL_INFORMATION_NEEDED, NO_SPECIFIC_MATCH_IDENTIFIED, or SERVICE_UNAVAILABLE")
    incidentCategory: IncidentCategoryResult
    additionalCategories: List[AdditionalCategoryResult] = Field(default_factory=list)
    potentiallyRelevantFrameworks: List[PotentiallyRelevantFramework] = Field(default_factory=list)
    additionalInformationNeeded: List[str] = Field(default_factory=list)
    modelMetadata: ModelMetadata
    disclaimer: str = Field(
        default="These AI/ML-assisted suggestions are preliminary legal information based on the details provided. They do not determine whether an offence occurred, establish liability, or replace advice from a qualified legal professional or a decision by an authorized body."
    )
