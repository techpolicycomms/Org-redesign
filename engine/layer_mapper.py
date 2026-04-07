"""Maps a role's function and level to one of the four system layers.

The four system layers from the framework:

- Capability  — atomic building blocks (infra, platform eng, legal, finance ops)
- WorldModel  — the company's living representation of itself and its customers
- Intelligence — composes capabilities into solutions (product, strategy)
- Interface   — delivery surfaces (design, front-end, marketing creative)
- Edge        — direct customer/market contact (sales, CS, support)

The mapping is intentionally simple and explicit; callers can override it
per-role by passing a richer context to ``map_to_layer``.
"""

from __future__ import annotations

from .models import Function, Level, SystemLayer

# ---------------------------------------------------------------------------
# Default function -> layer table
# ---------------------------------------------------------------------------

# The default layer a function lands on. This is the starting point; the
# map_to_layer function applies a handful of level-sensitive overrides
# below to catch the cases where the default is clearly wrong (e.g. a
# VP Engineering is not a Capability builder in their current job).
_FUNCTION_TO_LAYER: dict[Function, SystemLayer] = {
    "engineering": "Capability",
    "product": "Intelligence",
    "design": "Interface",
    "data": "WorldModel",
    "operations": "Capability",
    "finance": "Capability",
    "hr": "Interface",
    "legal": "Capability",
    "sales": "Edge",
    "marketing": "Interface",
    "customer_success": "Edge",
    "executive": "Intelligence",
}


def map_to_layer(
    function: Function,
    level: Level,
    title: str | None = None,
) -> SystemLayer:
    """Return the system layer for a role given its function and level.

    Rules applied on top of ``_FUNCTION_TO_LAYER``:

    1. Senior managers and above in non-executive functions still
       notionally belong to their function's layer — the redundancy
       score, not the layer, is where we capture "this is mostly routing".
    2. Executives always sit at the Intelligence layer in the new world,
       because in the redesign their job is composing capabilities into
       strategic bets.
    3. Titles containing "infra", "platform", or "sre" pin the role to
       Capability even if the function is engineering broadly. Titles
       containing "data" or "analytics" pin to WorldModel.
    """

    title_l = (title or "").lower()

    # Title-based overrides always win.
    if any(k in title_l for k in ("infra", "platform", "sre", "devops")):
        return "Capability"
    if any(k in title_l for k in ("data scien", "analytics", "ml ", "machine learning")):
        return "WorldModel"
    if any(k in title_l for k in ("research", "ux research")):
        return "WorldModel"
    if any(k in title_l for k in ("support", "customer success")):
        return "Edge"

    if function == "executive":
        return "Intelligence"

    return _FUNCTION_TO_LAYER[function]
