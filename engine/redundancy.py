"""Redundancy scoring: how much of a role is hierarchy-as-routing.

The score is a float in [0, 1]. Higher means more of the role is
information routing that a world model could absorb.

Inputs:
- the role's own time_split (base signal)
- the role's reports_to chain, so we can detect stacked routing layers
- the role's level, so pure IC work is never fully marked as redundant
"""

from __future__ import annotations

from .models import CurrentRole


def _build_chain(
    role: CurrentRole, roles_by_id: dict[str, CurrentRole]
) -> list[CurrentRole]:
    """Walk upwards from a role through reports_to, returning ancestors."""
    chain: list[CurrentRole] = []
    seen: set[str] = set()
    current_id = role.reports_to
    while current_id and current_id not in seen:
        seen.add(current_id)
        parent = roles_by_id.get(current_id)
        if parent is None:
            break
        chain.append(parent)
        current_id = parent.reports_to
    return chain


def score(
    role: CurrentRole,
    roles_by_id: dict[str, CurrentRole] | None = None,
) -> float:
    """Return the redundancy score for a role.

    Base = time_split.routing.
    Stacking penalty: if the reports_to chain has >=3 ancestors whose
      routing share exceeds 0.5, add +0.15 (capped at 1.0).
    Edge bonus: direct customer contact reduces the score — if
      customer_contact > 0.3, subtract 0.1.
    Level floor: IC roles can never exceed 0.75, because even a
      routing-heavy IC is usually routing *their own* work, which is
      less compressible than a manager's status-compression routing.
    """
    roles_by_id = roles_by_id or {}

    base = role.time_split.routing

    # Stacking penalty.
    chain = _build_chain(role, roles_by_id)
    routing_ancestors = sum(1 for a in chain if a.time_split.routing > 0.5)
    if routing_ancestors >= 3:
        base += 0.15

    # Edge bonus (reduction).
    if role.time_split.customer_contact > 0.3:
        base -= 0.1

    # Level floor for ICs.
    if role.level == "IC":
        base = min(base, 0.75)

    return max(0.0, min(1.0, base))
