"""Claude-backed transition plan generator.

Given a before (``OrgInput``) and after (``OrgOutput``) snapshot of an org,
ask Claude to draft a practical 90-day transition plan in markdown. Uses
adaptive thinking so Claude can reason about change management tradeoffs.
"""

from __future__ import annotations

import json
import os

import anthropic

from .models import OrgInput, OrgOutput

_MODEL = "claude-opus-4-6"

_SYSTEM_PROMPT = """You are a seasoned org-design advisor helping leaders
execute a shift from a hierarchical org to an intelligence-era org based on
the "From Hierarchy to Intelligence" framework by Block (4 system layers:
Capability, WorldModel, Intelligence, Interface; 3 role types: IC, DRI,
Player-Coach). You will be given a JSON payload with the current org chart
(``org_input``) and the proposed redesign (``org_output``).

Produce a **90-day transition plan in markdown** organised into three
phases:

## Weeks 1-4 — Diagnose & align
## Weeks 5-8 — Reclassify & build world-model systems
## Weeks 9-12 — Redeploy & measure

In each phase, cover:
- Concrete actions the CEO / exec team should take this phase.
- Which specific roles (reference them by title and id from the payload)
  should be reclassified or eliminated first, and why.
- What "world model" systems (dashboards, telemetry, shared context stores,
  AI copilots) need to be built to replace routing work.
- How to redeploy people whose roles were eliminated — what IC / DRI /
  Player-Coach slots they can grow into.
- Change-management risks and how to mitigate them (trust, morale,
  customer continuity, regulatory).

End the document with a short **"Watch-outs"** section listing the top
three failure modes for this specific org.

Rules:
- Use markdown headings, bullet lists, and bold for emphasis. No tables.
- Reference specific role ids/titles from the payload — do not give
  generic advice.
- Be direct and practical. No filler. 800-1400 words.
- Never claim certainty about things the data doesn't support. Flag
  assumptions explicitly.
"""


class AIAdvisorError(RuntimeError):
    """Raised when Claude cannot produce a transition plan."""


def _client() -> anthropic.Anthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIAdvisorError(
            "ANTHROPIC_API_KEY is not set. Configure it in your environment "
            "to generate transition plans."
        )
    return anthropic.Anthropic(api_key=api_key)


def generate_transition_plan(org_input: OrgInput, org_output: OrgOutput) -> str:
    """Return a markdown 90-day transition plan for the given redesign."""
    client = _client()

    payload = {
        "org_input": org_input.model_dump(),
        "org_output": org_output.model_dump(),
    }
    user_message = (
        "Here is the before/after org data. Produce the 90-day transition "
        "plan as specified.\n\n"
        f"```json\n{json.dumps(payload, indent=2)}\n```"
    )

    try:
        with client.messages.stream(
            model=_MODEL,
            max_tokens=16000,
            thinking={"type": "adaptive"},
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            final = stream.get_final_message()
    except anthropic.APIStatusError as e:
        raise AIAdvisorError(f"Claude API error: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise AIAdvisorError(f"Could not reach Claude API: {e}") from e

    chunks: list[str] = []
    for block in final.content:
        if getattr(block, "type", None) == "text":
            chunks.append(block.text)
    text = "\n".join(c for c in chunks if c).strip()
    if not text:
        raise AIAdvisorError("Claude returned an empty transition plan.")
    return text
