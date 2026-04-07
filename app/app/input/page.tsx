"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { classifyOrg, fetchTemplate, parseOrgText } from "@/lib/api";
import { useOrgStore } from "@/lib/store";
import type { CurrentRole, Functional, Level, OrgInput, TimeSplit } from "@/lib/types";

const FUNCTIONS: Functional[] = [
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
];

const LEVELS: Level[] = [
  "IC",
  "manager",
  "senior_manager",
  "director",
  "vp",
  "c_suite",
];

const TEMPLATES = [
  { key: "startup-50", label: "Startup (~50)" },
  { key: "midsize-500", label: "Midsize SaaS (~500)" },
  { key: "enterprise-5000", label: "Enterprise (~5000)" },
];

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyRole(): CurrentRole {
  return {
    id: randomId(),
    title: "",
    reports_to: null,
    function: "engineering",
    level: "IC",
    headcount: 1,
    time_split: {
      routing: 0.25,
      building: 0.25,
      customer_contact: 0.25,
      people_development: 0.25,
    },
  };
}

function normaliseSplit(split: TimeSplit): TimeSplit {
  const total =
    split.routing + split.building + split.customer_contact + split.people_development;
  if (total === 0) {
    return { routing: 0.25, building: 0.25, customer_contact: 0.25, people_development: 0.25 };
  }
  return {
    routing: split.routing / total,
    building: split.building / total,
    customer_contact: split.customer_contact / total,
    people_development: split.people_development / total,
  };
}

export default function InputPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { setOrgInput, setOrgOutput, orgInput } = useOrgStore();

  const [roles, setRoles] = useState<CurrentRole[]>(orgInput?.roles ?? []);
  const [textDescription, setTextDescription] = useState("");
  const [parsing, setParsing] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load template from query string on mount, if requested.
  useEffect(() => {
    const t = params.get("template");
    if (t && roles.length === 0) {
      void loadTemplate(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTemplate(name: string) {
    try {
      setError(null);
      const tpl = await fetchTemplate(name);
      setRoles(tpl.roles);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      setError(null);
      const text = await file.text();
      const parsed = JSON.parse(text) as OrgInput;
      setRoles(parsed.roles ?? []);
    } catch (e) {
      setError(`Failed to parse JSON: ${(e as Error).message}`);
    }
  }

  async function handleParseText() {
    if (!textDescription.trim()) return;
    setParsing(true);
    setError(null);
    try {
      const parsed = await parseOrgText(textDescription);
      setRoles(parsed.roles);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setParsing(false);
    }
  }

  async function handleAnalyse() {
    if (roles.length === 0) {
      setError("Add at least one role first.");
      return;
    }
    setAnalysing(true);
    setError(null);
    try {
      const input: OrgInput = { roles };
      const output = await classifyOrg(input);
      setOrgInput(input);
      setOrgOutput(output);
      router.push("/results");
    } catch (e) {
      setError((e as Error).message);
      setAnalysing(false);
    }
  }

  function addEmptyRole() {
    setRoles((r) => [...r, emptyRole()]);
  }

  function updateRole(id: string, patch: Partial<CurrentRole>) {
    setRoles((r) => r.map((role) => (role.id === id ? { ...role, ...patch } : role)));
  }

  function updateSplit(id: string, key: keyof TimeSplit, value: number) {
    setRoles((r) =>
      r.map((role) => {
        if (role.id !== id) return role;
        const next = { ...role.time_split, [key]: value };
        return { ...role, time_split: normaliseSplit(next) };
      }),
    );
  }

  function removeRole(id: string) {
    setRoles((r) => r.filter((role) => role.id !== id));
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Analyse an org</h1>
        <p className="text-sm text-brand-muted">
          Four ways to load an org. Pick whichever is least painful.
        </p>
      </header>

      {error && (
        <Card className="border-red-500/50 bg-red-500/10 text-sm text-red-300">
          {error}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-lg font-semibold">A · Upload JSON</h2>
          <p className="mb-4 text-sm text-brand-muted">
            Drop an <code>OrgInput</code> JSON file.
          </p>
          <label
            className="flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed border-brand-border text-sm text-brand-muted hover:bg-brand-bg"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFileUpload(f);
            }}
          >
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
              }}
            />
            Drop here or click to browse
          </label>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">B · Use a template</h2>
          <p className="mb-4 text-sm text-brand-muted">
            Start from a realistic sample org.
          </p>
          <div className="flex flex-col gap-2">
            {TEMPLATES.map((t) => (
              <Button
                key={t.key}
                variant="secondary"
                onClick={() => void loadTemplate(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">C · Manual entry</h2>
          <p className="mb-4 text-sm text-brand-muted">
            Add roles one by one. Time-split sliders auto-normalise to 100%.
          </p>
          <Button onClick={addEmptyRole}>Add role</Button>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold">D · Describe in plain text</h2>
          <p className="mb-4 text-sm text-brand-muted">
            Paste a natural-language description. Claude parses it into structured
            roles, which you can then edit below.
          </p>
          <Textarea
            rows={5}
            placeholder="We have a CTO who manages 3 engineering directors, each with 4-5 team leads…"
            value={textDescription}
            onChange={(e) => setTextDescription(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={() => void handleParseText()} disabled={parsing}>
              {parsing ? "Parsing your org structure…" : "Parse with Claude"}
            </Button>
            {parsing && (
              <span className="text-xs text-brand-muted">
                Working against the Claude API…
              </span>
            )}
          </div>
        </Card>
      </div>

      {roles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Roles <span className="text-brand-muted">({roles.length})</span>
            </h2>
            <Button onClick={() => void handleAnalyse()} disabled={analysing}>
              {analysing ? "Analysing…" : "Analyse"}
            </Button>
          </div>
          <div className="space-y-3">
            {roles.map((role) => (
              <Card key={role.id} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={role.title}
                      onChange={(e) => updateRole(role.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Function</Label>
                    <Select
                      value={role.function}
                      onChange={(e) =>
                        updateRole(role.id, { function: e.target.value as Functional })
                      }
                    >
                      {FUNCTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select
                      value={role.level}
                      onChange={(e) =>
                        updateRole(role.id, { level: e.target.value as Level })
                      }
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Reports to</Label>
                    <Select
                      value={role.reports_to ?? ""}
                      onChange={(e) =>
                        updateRole(role.id, {
                          reports_to: e.target.value || null,
                        })
                      }
                    >
                      <option value="">— none —</option>
                      {roles
                        .filter((r) => r.id !== role.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title || r.id}
                          </option>
                        ))}
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <div>
                    <Label>Headcount</Label>
                    <Input
                      type="number"
                      min={1}
                      value={role.headcount}
                      onChange={(e) =>
                        updateRole(role.id, { headcount: Number(e.target.value) || 1 })
                      }
                    />
                  </div>
                  {(
                    ["routing", "building", "customer_contact", "people_development"] as const
                  ).map((k) => (
                    <div key={k}>
                      <Label>
                        {k.replace("_", " ")} ({Math.round(role.time_split[k] * 100)}%)
                      </Label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={role.time_split[k]}
                        onChange={(e) => updateSplit(role.id, k, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => removeRole(role.id)}>
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
