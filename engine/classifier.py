"""Rule-based role classification engine.

Given a ``CurrentRole``, produce a ``RedesignedRole`` that assigns it
to one of the four new role types (IC, DRI, Player-Coach,
Eliminated-Absorbed), places it on a system layer, and explains why.

The classification is intentionally deterministic and rule-based:
the framework's value is in the explicitness of the rules, not in
opaque ML.
"""

from __future__ import annotations

from .layer_mapper import map_to_layer
from .models import (
    CurrentRole,
    NewRoleType,
    OrgInput,
    OrgOutput,
    OrgSummary,
    RedesignedRole,
    SystemLayer,
)
from .redundancy import score as redundancy_score


class RoleClassifier:
    """Classify individual roles and whole orgs."""

    # ------------------------------------------------------------------
    # Single-role classification
    # ------------------------------------------------------------------

    def classify(
        self,
        role: CurrentRole,
        roles_by_id: dict[str, CurrentRole] | None = None,
    ) -> RedesignedRole:
        """Classify a single role into the new framework."""
        ts = role.time_split
        rscore = redundancy_score(role, roles_by_id)
        layer = map_to_layer(role.function, role.level, role.title)
        new_type, reasoning, layer = self._decide_type(role, rscore, layer)
        retained, eliminated = self._split_responsibilities(role, new_type)
        return RedesignedRole(
            original_role_id=role.id,
            new_type=new_type,
            system_layer=layer,
            redundancy_score=round(rscore, 3),
            reasoning=reasoning,
            retained_responsibilities=retained,
            eliminated_responsibilities=eliminated,
        )

    # ------------------------------------------------------------------
    # Rule application
    # ------------------------------------------------------------------

    def _decide_type(
        self,
        role: CurrentRole,
        rscore: float,
        default_layer: SystemLayer,
    ) -> tuple[NewRoleType, str, SystemLayer]:
        """Apply the classification rules in order and return the pick."""
        ts = role.time_split

        # Rule 1: high routing, low building -> eliminated / absorbed.
        # The world model replaces this work directly.
        if ts.routing > 0.5 and ts.building < 0.2:
            reasoning = (
                f"{int(ts.routing * 100)}% of this role is information "
                "routing and only "
                f"{int(ts.building * 100)}% is building. The world model "
                "absorbs the routing work; there is no residual job that "
                "needs a dedicated human."
            )
            return "Eliminated-Absorbed", reasoning, default_layer

        # Rule 2: strong people-development + real building -> Player-Coach.
        # This has to come before the pure-building IC rule so that
        # building-heavy managers are not mis-classified as pure ICs.
        if ts.people_development >= 0.25 and ts.building >= 0.25:
            reasoning = (
                f"This role spends {int(ts.building * 100)}% building and "
                f"{int(ts.people_development * 100)}% growing people. "
                "In the redesign that is a Player-Coach: still shipping, "
                "still deepening a capability, and responsible for the "
                "craft and career of a small number of ICs."
            )
            return "Player-Coach", reasoning, default_layer

        # Rule 3: strong customer contact -> Edge IC or DRI.
        # DRI if the role already has significant people-dev responsibility
        # (i.e. it coordinates others against a specific outcome),
        # otherwise an IC on the Edge layer.
        if ts.customer_contact > 0.4:
            if ts.people_development >= 0.1 or role.level in (
                "manager",
                "senior_manager",
                "director",
                "vp",
            ):
                reasoning = (
                    f"{int(ts.customer_contact * 100)}% of the week is "
                    "direct customer or edge contact, and the role already "
                    "carries cross-cutting responsibility. This is a DRI: "
                    "time-boxed ownership of an edge outcome, authority "
                    "without headcount."
                )
                return "DRI", reasoning, "Edge"
            reasoning = (
                f"{int(ts.customer_contact * 100)}% of the week is direct "
                "customer contact. In the new org this is an Edge IC — "
                "the humans who still learn from reality."
            )
            return "IC", reasoning, "Edge"

        # Rule 4: building dominates -> IC on the appropriate layer.
        if ts.building > 0.5:
            reasoning = (
                f"{int(ts.building * 100)}% of the week is building. "
                f"This is an IC on the {default_layer} layer, with the "
                "routing tax removed."
            )
            return "IC", reasoning, default_layer

        # Rule 5: middling routing with some building, senior level ->
        # a DRI is the only sensible landing spot. The role already
        # crosses functional boundaries; make that explicit and
        # time-box it.
        if role.level in ("director", "vp", "senior_manager") and ts.routing >= 0.4:
            reasoning = (
                "The role sits at a level that today exists mostly to "
                "compress status across functions. In the redesign it "
                "becomes a DRI: one throat against a specific outcome, "
                "time-boxed and composed of existing capabilities — no "
                "permanent headcount."
            )
            return "DRI", reasoning, "Intelligence"

        # Rule 6: fallback. Small amount of building, not enough people
        # development to be a player-coach, not enough edge contact to
        # be an edge IC. Treat as an IC on the default layer and let the
        # redundancy score speak for how much of the job survives.
        reasoning = (
            "No dominant activity. Defaulting to IC on the "
            f"{default_layer} layer; the redundancy score of "
            f"{rscore:.2f} indicates how much of the current scope is "
            "routing tax that the world model should absorb."
        )
        return "IC", reasoning, default_layer

    # ------------------------------------------------------------------
    # Responsibility buckets
    # ------------------------------------------------------------------

    def _split_responsibilities(
        self, role: CurrentRole, new_type: NewRoleType
    ) -> tuple[list[str], list[str]]:
        """Produce human-readable retained vs eliminated responsibility lists."""
        retained: list[str] = []
        eliminated: list[str] = []
        ts = role.time_split

        if ts.building > 0.15:
            retained.append("Deepening the capability or interface they own")
        if ts.customer_contact > 0.2:
            retained.append("Direct customer and edge contact")
        if ts.people_development > 0.2 and new_type == "Player-Coach":
            retained.append("Growing a small number of ICs through craft and judgement")
        if new_type == "DRI":
            retained.append("Single-throat ownership of a specific, time-boxed outcome")
        if ts.routing > 0.2:
            eliminated.append("Status compression and cross-team routing")
        if ts.routing > 0.3:
            eliminated.append("Standing meetings whose purpose is information transfer")
        if new_type == "Eliminated-Absorbed":
            eliminated.append("The role as a whole — work absorbed into the world model")

        if not retained:
            retained.append("(nothing dominant retained)")
        if not eliminated:
            eliminated.append("(no obvious routing tax — rare)")
        return retained, eliminated

    # ------------------------------------------------------------------
    # Whole-org classification
    # ------------------------------------------------------------------

    def classify_org(self, org: OrgInput) -> OrgOutput:
        """Classify every role in an OrgInput and compute summary stats."""
        roles_by_id = {r.id: r for r in org.roles}
        redesigned = [self.classify(r, roles_by_id) for r in org.roles]

        total_before = sum(r.headcount for r in org.roles)
        eliminated_headcount = sum(
            role.headcount
            for role, new in zip(org.roles, redesigned)
            if new.new_type == "Eliminated-Absorbed"
        )
        total_after = total_before - eliminated_headcount

        layers_before = self._layers_before(org)
        layers_after = 3  # IC / DRI / Player-Coach — the new taxonomy is flat.

        avg_red = (
            sum(r.redundancy_score for r in redesigned) / len(redesigned)
            if redesigned
            else 0.0
        )

        summary = OrgSummary(
            total_roles_before=total_before,
            total_roles_after=total_after,
            roles_eliminated=eliminated_headcount,
            avg_redundancy_score=round(avg_red, 3),
            layers_before=layers_before,
            layers_after=layers_after,
        )
        return OrgOutput(redesigned_roles=redesigned, summary=summary)

    def _layers_before(self, org: OrgInput) -> int:
        """Depth of the deepest reports_to chain in the current org."""
        roles_by_id = {r.id: r for r in org.roles}

        def depth(role_id: str, seen: set[str]) -> int:
            if role_id in seen:
                return 0
            seen.add(role_id)
            role = roles_by_id.get(role_id)
            if role is None or role.reports_to is None:
                return 1
            return 1 + depth(role.reports_to, seen)

        if not org.roles:
            return 0
        return max(depth(r.id, set()) for r in org.roles)
