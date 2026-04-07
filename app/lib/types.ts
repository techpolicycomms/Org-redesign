// TypeScript mirrors of the Pydantic models in engine/models.py.
// Keep these in sync by hand — the backend is the source of truth.

export type Functional =
  | "engineering"
  | "product"
  | "design"
  | "data"
  | "operations"
  | "finance"
  | "hr"
  | "legal"
  | "sales"
  | "marketing"
  | "customer_success"
  | "executive";

export type Level =
  | "IC"
  | "manager"
  | "senior_manager"
  | "director"
  | "vp"
  | "c_suite";

export type NewRoleType =
  | "IC"
  | "DRI"
  | "Player-Coach"
  | "Eliminated-Absorbed";

export type SystemLayer =
  | "Capability"
  | "WorldModel"
  | "Intelligence"
  | "Interface"
  | "Edge";

export interface TimeSplit {
  routing: number;
  building: number;
  customer_contact: number;
  people_development: number;
}

export interface CurrentRole {
  id: string;
  title: string;
  reports_to: string | null;
  function: Functional;
  level: Level;
  headcount: number;
  time_split: TimeSplit;
  description?: string | null;
}

export interface RedesignedRole {
  original_role_id: string;
  new_type: NewRoleType;
  system_layer: SystemLayer;
  redundancy_score: number;
  reasoning: string;
  retained_responsibilities: string[];
  eliminated_responsibilities: string[];
}

export interface OrgSummary {
  total_roles_before: number;
  total_roles_after: number;
  roles_eliminated: number;
  avg_redundancy_score: number;
  layers_before: number;
  layers_after: number;
}

export interface OrgInput {
  roles: CurrentRole[];
}

export interface OrgOutput {
  redesigned_roles: RedesignedRole[];
  summary: OrgSummary;
}
