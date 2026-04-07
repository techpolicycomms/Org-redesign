"""FastAPI application for the org-intelligence-redesigner engine.

Endpoints:
    GET  /api/health                  health check
    GET  /api/templates/{name}        return a sample org by name
    POST /api/classify                classify an entire OrgInput
    POST /api/classify-role           classify a single CurrentRole
    POST /api/parse-text              Claude-parsed natural-language org
    POST /api/transition-plan         Claude-generated 90-day plan
"""

from __future__ import annotations

import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()  # Pull ANTHROPIC_API_KEY from repo-root .env if present.

from .ai_advisor import AIAdvisorError, generate_transition_plan
from .ai_parser import AIParserError, parse_org_description
from .classifier import RoleClassifier
from .models import CurrentRole, OrgInput, OrgOutput, RedesignedRole

app = FastAPI(
    title="org-intelligence-redesigner",
    description="Turn a hierarchical org chart into an intelligence-era redesign.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_classifier = RoleClassifier()
_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
_TEMPLATE_NAMES = {"startup-50", "midsize-500", "enterprise-5000"}


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}


@app.get("/api/templates/{name}")
def get_template(name: str) -> dict:
    """Return one of the bundled sample org JSON files."""
    if name not in _TEMPLATE_NAMES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown template '{name}'. Known: {sorted(_TEMPLATE_NAMES)}",
        )
    path = _TEMPLATES_DIR / f"{name}.json"
    if not path.exists():
        raise HTTPException(status_code=500, detail=f"Template file missing: {path}")
    with path.open() as fh:
        return json.load(fh)


@app.post("/api/classify", response_model=OrgOutput)
def classify_org(org: OrgInput) -> OrgOutput:
    """Classify an entire org chart and return the redesigned output."""
    return _classifier.classify_org(org)


@app.post("/api/classify-role", response_model=RedesignedRole)
def classify_single_role(role: CurrentRole) -> RedesignedRole:
    """Classify a single role in isolation (no parent chain context)."""
    return _classifier.classify(role)


class ParseTextRequest(BaseModel):
    description: str


@app.post("/api/parse-text", response_model=OrgInput)
def parse_text(req: ParseTextRequest) -> OrgInput:
    """Turn a free-form org description into a structured OrgInput via Claude."""
    try:
        return parse_org_description(req.description)
    except AIParserError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


class TransitionPlanRequest(BaseModel):
    org_input: OrgInput
    org_output: OrgOutput


class TransitionPlanResponse(BaseModel):
    plan_markdown: str


@app.post("/api/transition-plan", response_model=TransitionPlanResponse)
def transition_plan(req: TransitionPlanRequest) -> TransitionPlanResponse:
    """Generate a Claude-written 90-day transition plan for the redesign."""
    try:
        md = generate_transition_plan(req.org_input, req.org_output)
    except AIAdvisorError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    return TransitionPlanResponse(plan_markdown=md)
