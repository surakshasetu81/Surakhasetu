"""
Suraksha Setu — Internal ML Triage & Legal Assessment Service
FastAPI microservice providing:
1. Explainable priority triage (POST /internal/v1/classify)
2. AI/ML-assisted legal category & applicable law recommendation (POST /internal/v1/legal-assessment)
"""

import sys
import os

# Add src to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import ClassificationRequest, ClassificationResponse, HealthResponse
from legal_schemas import LegalAssessmentRequest, LegalAssessmentResponse
from predict import predict_triage, load_model
from legal_recommender import assess_legal_frameworks
from legal_classifier import load_legal_classifier

app = FastAPI(
    title="Suraksha Setu ML Triage & Legal Recommendation Service",
    description="Internal machine learning service for priority triage and applicable law recommendation.",
    version="1.0.0",
)

# Restrict CORS to internal callers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    try:
        load_model()
        print("ML Triage model artifact loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load triage model during startup: {e}")

    try:
        load_legal_classifier()
        print("Legal Multi-Label Classifier loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load legal classifier during startup: {e}")


@app.get("/health", response_model=HealthResponse)
def health_check():
    try:
        _, metadata = load_model()
        return HealthResponse(
            status="ok",
            service="suraksha-setu-ml-service",
            model_loaded=True,
            model_version=metadata.get("model_version"),
            is_demo_dataset=metadata.get("is_demo_model", True),
        )
    except Exception as e:
        return HealthResponse(
            status="degraded",
            service="suraksha-setu-ml-service",
            model_loaded=False,
            model_version=None,
            is_demo_dataset=True,
        )


@app.get("/internal/v1/model-info")
def model_info():
    try:
        _, metadata = load_model()
        return {
            "status": "active",
            "metadata": metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {str(e)}")


@app.post("/internal/v1/classify", response_model=ClassificationResponse)
def classify_complaint(request: ClassificationRequest):
    try:
        prediction = predict_triage(request.model_dump())
        return ClassificationResponse(
            report_id=request.report_id,
            suggested_priority=prediction["suggested_priority"],
            confidence_score=prediction["confidence_score"],
            class_probabilities=prediction["class_probabilities"],
            classification_method=prediction["classification_method"],
            model_version=prediction["model_version"],
            is_demo_model=prediction["is_demo_model"],
            priority_reasons=prediction["priority_reasons"],
            warning=prediction["warning"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


@app.post("/internal/v1/legal-assessment", response_model=LegalAssessmentResponse)
def assess_legal(request: LegalAssessmentRequest):
    try:
        result = assess_legal_frameworks(request.model_dump())
        return LegalAssessmentResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legal assessment failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=False)
