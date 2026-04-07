"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { OrgFlow } from "@/components/org-flow";
import { useOrgStore } from "@/lib/store";
import { ROLE_COLORS, ROLE_LABELS, downloadJSON } from "@/lib/utils";
import { generateTransitionPlan } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ResultsPage() {
  const { orgInput, orgOutput } = useOrgStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transitionPlan, setTransitionPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  if (!orgInput || !orgOutput) {
    return (
      <div className="space-y-6 py-20 text-center">
        <p className="text-brand-muted">No analysis loaded.</p>
        <Link href="/input">
          <Button>Analyse an org</Button>
        </Link>
      </div>
    );
  }

  const byOriginalId = Object.fromEntries(
    orgOutput.redesigned_roles.map((r) => [r.original_role_id, r]),
  );
  const rolesById = Object.fromEntries(orgInput.roles.map((r) => [r.id, r]));
  const summary = orgOutput.summary;
  const eliminatedPct = summary.total_roles_before
    ? Math.round((summary.roles_eliminated / summary.total_roles_before) * 100)
    : 0;

  async function handleGeneratePlan() {
    if (!orgInput || !orgOutput) return;
    setPlanLoading(true);
    setPlanError(null);
    try {
      const md = await generateTransitionPlan(orgInput, orgOutput);
      setTransitionPlan(md);
    } catch (e) {
      setPlanError((e as Error).message);
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Redesign</h1>
          <p className="text-sm text-brand-muted">
            Before/after comparison, role-by-role reasoning, and a transition plan.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadJSON("org-redesign.json", { orgInput, orgOutput })}
          >
            Export JSON
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Roles"
          value={`${summary.total_roles_before} → ${summary.total_roles_after}`}
          hint={`${summary.roles_eliminated} eliminated`}
        />
        <StatCard
          label="Layers"
          value={`${summary.layers_before} → ${summary.layers_after}`}
          hint="hierarchy depth"
        />
        <StatCard
          label="Avg redundancy"
          value={`${Math.round(summary.avg_redundancy_score * 100)}%`}
          hint="routing tax across roles"
        />
        <StatCard label="Eliminated" value={`${eliminatedPct}%`} hint="of total headcount" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Before / After</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">Before</p>
            <OrgFlow roles={orgInput.roles} mode="before" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">After</p>
            <OrgFlow
              roles={orgInput.roles}
              redesigned={byOriginalId}
              mode="after"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-2 text-xs">
          {(Object.keys(ROLE_COLORS) as (keyof typeof ROLE_COLORS)[]).map((k) => (
            <Badge key={k} color={ROLE_COLORS[k]}>
              {ROLE_LABELS[k]}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Role-by-role</h2>
        <div className="space-y-2">
          {orgOutput.redesigned_roles.map((rd) => {
            const orig = rolesById[rd.original_role_id];
            const expanded = expandedId === rd.original_role_id;
            return (
              <Card key={rd.original_role_id} className="space-y-2 py-4">
                <button
                  className="flex w-full items-center justify-between gap-4 text-left"
                  onClick={() =>
                    setExpandedId(expanded ? null : rd.original_role_id)
                  }
                >
                  <div>
                    <div className="text-sm font-semibold">{orig?.title ?? rd.original_role_id}</div>
                    <div className="text-xs text-brand-muted">
                      {orig?.function} · {orig?.level} · headcount {orig?.headcount}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={ROLE_COLORS[rd.new_type]}>{ROLE_LABELS[rd.new_type]}</Badge>
                    <span className="text-xs text-brand-muted">{rd.system_layer}</span>
                    <span className="font-mono text-xs text-brand-muted">
                      redundancy {Math.round(rd.redundancy_score * 100)}%
                    </span>
                  </div>
                </button>
                {expanded && (
                  <div className="space-y-3 border-t border-brand-border pt-3 text-sm">
                    <p className="text-brand-muted">{rd.reasoning}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-brand-muted">
                          Retained
                        </p>
                        <ul className="list-disc space-y-1 pl-4 text-xs">
                          {rd.retained_responsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-brand-muted">
                          Eliminated
                        </p>
                        <ul className="list-disc space-y-1 pl-4 text-xs">
                          {rd.eliminated_responsibilities.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transition plan</h2>
          <Button onClick={() => void handleGeneratePlan()} disabled={planLoading}>
            {planLoading ? "Drafting…" : "Generate transition plan"}
          </Button>
        </div>
        {planError && (
          <Card className="border-red-500/50 bg-red-500/10 text-sm text-red-300">
            {planError}
          </Card>
        )}
        {transitionPlan && (
          <Card className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{transitionPlan}</ReactMarkdown>
          </Card>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </Card>
  );
}
