"""Pydantic v2 schemas for the org-intelligence-redesigner engine.

These models are the wire format between the frontend, the FastAPI
endpoints, and the classification logic. They intentionally stay
small and strict: every field is typed, every enum is a Literal, and
the TimeSplit sub-model enforces that the four fractions sum to one.
"""

from __future__ import annotations

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Enum-style literals
# ---------------------------------------------------------------------------

Function = Literal[
    "engineering",
    "product",
    "design",
    "data",
    "operations",
    "finance",
    "hr",
    "legal",
    "sales",
    "marketing",
    "customer_success",
    "executive",
]

Level = Literal[
    "IC",
    "manager",
    "senior_manager",
    "director",
    "vp",
    "c_suite",
]

NewRoleType = Literal[
    "IC",
    "DRI",
    "Player-Coach",
    "Eliminated-Absorbed",
]

SystemLayer = Literal[
    "Capability",
    "WorldModel",
    "Intelligence",
    "Interface",
    "Edge",
]


# ---------------------------------------------------------------------------
# TimeSplit sub-model
# ---------------------------------------------------------------------------


class TimeSplit(BaseModel):
    """How a role's week breaks down across four activity buckets.

    The four fractions must sum to 1.0 (within a small tolerance). The
    categories map directly onto the classification rules in
    ``engine/classifier.py``.
    """

    routing: float = Field(..., ge=0.0, le=1.0)
    building: float = Field(..., ge=0.0, le=1.0)
    customer_contact: float = Field(..., ge=0.0, le=1.0)
    people_development: float = Field(..., ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _sum_to_one(self) -> "TimeSplit":
        total = (
            self.routing
            + self.building
            + self.customer_contact
            + self.people_development
        )
        if abs(total - 1.0) > 1e-3:
            raise ValueError(
                f"TimeSplit fractions must sum to 1.0 (got {total:.4f})"
            )
        return self


# ---------------------------------------------------------------------------
# Current (hierarchical) role
# ---------------------------------------------------------------------------


class CurrentRole(BaseModel):
    """A single role in the *current* (hierarchical) org chart."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    reports_to: Optional[str] = None
    function: Function
    level: Level
    headcount: int = Field(default=1, ge=1)
    time_split: TimeSplit
    description: Optional[str] = None

    @field_validator("title")
    @classmethod
    def _title_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank")
        return v.strip()


# ---------------------------------------------------------------------------
# Redesigned role
# ---------------------------------------------------------------------------


class RedesignedRole(BaseModel):
    """The output of classifying a CurrentRole under the new framework."""

    original_role_id: str
    new_type: NewRoleType
    system_layer: SystemLayer
    redundancy_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    retained_responsibilities: list[str] = Field(default_factory=list)
    eliminated_responsibilities: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Org-level input / output envelopes
# ---------------------------------------------------------------------------


class OrgInput(BaseModel):
    """An entire current-state org chart submitted for analysis."""

    roles: list[CurrentRole]

    @field_validator("roles")
    @classmethod
    def _at_least_one_role(cls, v: list[CurrentRole]) -> list[CurrentRole]:
        if not v:
            raise ValueError("OrgInput must contain at least one role")
        return v


class OrgSummary(BaseModel):
    """Aggregate stats for a before/after comparison."""

    total_roles_before: int
    total_roles_after: int
    roles_eliminated: int
    avg_redundancy_score: float
    layers_before: int
    layers_after: int


class OrgOutput(BaseModel):
    """The classified redesign of an OrgInput plus summary stats."""

    redesigned_roles: list[RedesignedRole]
    summary: OrgSummary
