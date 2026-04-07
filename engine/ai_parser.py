"""Natural-language org description parser backed by Claude.

Given a free-form paragraph describing an org, return a validated
``OrgInput`` with typed roles. Uses structured outputs against the
Pydantic ``OrgInput`` schema so the response is guaranteed to match
the wire format the rest of the engine expects.
"""

from __future__ import annotations

import os
from typing import Any

import anthropic
from pydantic import ValidationError

from .models import OrgInput

_MODEL = "claude-opus-4-6"

_SYSTEM_PROMPT = """You extract structured org charts from natural-language
descriptions.

You will be given a short description of a company's organisation. Your job is
to return an OrgInput JSON object: a list of roles with reporting
relationships, functions, levels, headcounts, and an estimated time_split
across four activity buckets (routing, building, customer_contact,
people_development) that must sum to exactly 1.0.

Rules:
- Use snake_case enum values exactly as specified in the schema.
- `function` must be one of: engineering, product, design, data, operations,
  finance, hr, legal, sales, marketing, customer_success, executive.
- `level` must be one of: IC, manager, senior_manager, director, vp, c_suite.
- `reports_to` must be either null (for top-level roles) or the `id` of
  another role in the same payload.
- Every role needs a stable `id` string (you may invent short slugs).
- `time_split` fractions must sum to 1.0.
- If the description is vague about time split, make a defensible guess based
  on the role archetype: routing-heavy for directors/VPs/TPMs; building-heavy
  for engineers and designers; customer-contact heavy for sales and CS.
- Prefer concise, realistic titles.

Few-shot examples:

Input: "We have a CTO who manages 3 engineering directors, each with 4-5 team
leads, plus a head of design with 6 designers."

Output:
{
  "roles": [
    {"id": "cto", "title": "CTO", "reports_to": null, "function": "executive",
     "level": "c_suite", "headcount": 1,
     "time_split": {"routing": 0.55, "building": 0.15, "customer_contact": 0.1, "people_development": 0.2}},
    {"id": "eng-dir", "title": "Director of Engineering", "reports_to": "cto",
     "function": "engineering", "level": "director", "headcount": 3,
     "time_split": {"routing": 0.7, "building": 0.05, "customer_contact": 0.05, "people_development": 0.2}},
    {"id": "team-lead", "title": "Engineering Manager", "reports_to": "eng-dir",
     "function": "engineering", "level": "manager", "headcount": 14,
     "time_split": {"routing": 0.5, "building": 0.1, "customer_contact": 0.05, "people_development": 0.35}},
    {"id": "head-design", "title": "Head of Design", "reports_to": null,
     "function": "design", "level": "director", "headcount": 1,
     "time_split": {"routing": 0.55, "building": 0.25, "customer_contact": 0.1, "people_development": 0.1}},
    {"id": "designer", "title": "Product Designer", "reports_to": "head-design",
     "function": "design", "level": "IC", "headcount": 6,
     "time_split": {"routing": 0.15, "building": 0.5, "customer_contact": 0.3, "people_development": 0.05}}
  ]
}
"""


class AIParserError(RuntimeError):
    """Raised when Claude cannot produce a valid OrgInput."""


def _client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIParserError(
            "ANTHROPIC_API_KEY is not set. Configure it in your environment "
            "to use AI parsing."
        )
    return anthropic.Anthropic(api_key=api_key)


def parse_org_description(text: str) -> OrgInput:
    """Turn a natural-language org description into a validated OrgInput."""
    if not text.strip():
        raise AIParserError("Description is empty.")

    client = _client()
    try:
        response = client.messages.parse(
            model=_MODEL,
            max_tokens=16000,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text.strip()}],
            output_format=OrgInput,
        )
    except anthropic.APIStatusError as e:
        raise AIParserError(f"Claude API error: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise AIParserError(f"Could not reach Claude API: {e}") from e

    parsed: Any = None
    for block in response.content:
        if getattr(block, "type", None) == "text" and getattr(block, "parsed_output", None) is not None:
            parsed = block.parsed_output
            break
    if parsed is None:
        raise AIParserError(
            "Claude did not return a structured response. Try rephrasing the "
            "description with clearer reporting relationships."
        )

    try:
        if isinstance(parsed, OrgInput):
            return parsed
        data = parsed.model_dump() if hasattr(parsed, "model_dump") else parsed
        return OrgInput.model_validate(data)
    except ValidationError as e:
        raise AIParserError(f"Claude returned invalid OrgInput: {e}") from e
