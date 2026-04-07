// Thin client for the FastAPI backend.
// Override the base URL with NEXT_PUBLIC_API_BASE at build time.

import type { OrgInput, OrgOutput, RedesignedRole, CurrentRole } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchTemplate(name: string): Promise<OrgInput> {
  const res = await fetch(`${API_BASE}/api/templates/${name}`, { cache: "no-store" });
  return handle<OrgInput>(res);
}

export async function classifyOrg(input: OrgInput): Promise<OrgOutput> {
  const res = await fetch(`${API_BASE}/api/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle<OrgOutput>(res);
}

export async function classifyRole(role: CurrentRole): Promise<RedesignedRole> {
  const res = await fetch(`${API_BASE}/api/classify-role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(role),
  });
  return handle<RedesignedRole>(res);
}

export async function parseOrgText(description: string): Promise<OrgInput> {
  const res = await fetch(`${API_BASE}/api/parse-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  return handle<OrgInput>(res);
}

export async function generateTransitionPlan(
  input: OrgInput,
  output: OrgOutput,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/transition-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_input: input, org_output: output }),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { plan_markdown: string };
  return data.plan_markdown;
}
