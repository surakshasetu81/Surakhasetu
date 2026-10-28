"""
Suraksha Setu — ML Triage Service Schemas
Pydantic contracts for internal ML classification requests and responses.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class SafetyIndicators(BaseModel):
    immediate_danger: Optional[bool] = Field(default=False, description="Explicit immediate physical danger reported")
    physical_force: Optional[bool] = Field(default=False, description="Physical violence or assault reported")
    ongoing_threats: Optional[bool] = Field(default=False, description="Explicit ongoing threats of violence or leak")
    stalking_or_tracking: Optional[bool] = Field(default=False, description="Stalking, physical pursuit, or geolocation tracking")
    ongoing_harassment: Optional[bool] = Field(default=False, description="Persistent repeated harassment")
    fear_of_retaliation: Optional[bool] = Field(default=False, description="Complainant reports fear of adverse retaliation")
    target_is_minor: Optional[bool] = Field(default=False, description="Concern involves person below 18 years")
    urgent_support_requested: Optional[bool] = Field(default=False, description="User selected urgent safety assistance")


class ClassificationRequest(BaseModel):
    report_id: Optional[str] = Field(default=None, description="Report reference ID")
    narrative: str = Field(..., min_length=5, description="Complaint description narrative")
    incident_category: Optional[str] = Field(default="other", description="Category identifier")
    language: Optional[str] = Field(default="en", description="Report language code (en, hi, etc.)")
    safety_indicators: Optional[SafetyIndicators] = Field(default_factory=SafetyIndicators)


class ClassificationResponse(BaseModel):
    report_id: Optional[str]
    suggested_priority: str = Field(..., description="HIGH, MEDIUM, or LOW")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence estimate")
    class_probabilities: Dict[str, float] = Field(default_factory=dict)
    classification_method: str = Field(default="ml_triage")
    model_version: str
    is_demo_model: bool = Field(default=True, description="True if trained on synthetic/demo dataset")
    priority_reasons: List[str] = Field(default_factory=list)
    warning: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    model_version: Optional[str]
    is_demo_dataset: bool
