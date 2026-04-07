// Zustand store: holds the current org input and the latest classification.
// Persisted to sessionStorage so navigating between /input and /results
// doesn't blow away the user's work.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { OrgInput, OrgOutput } from "./types";

interface OrgState {
  orgInput: OrgInput | null;
  orgOutput: OrgOutput | null;
  setOrgInput: (input: OrgInput | null) => void;
  setOrgOutput: (output: OrgOutput | null) => void;
  reset: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      orgInput: null,
      orgOutput: null,
      setOrgInput: (orgInput) => set({ orgInput }),
      setOrgOutput: (orgOutput) => set({ orgOutput }),
      reset: () => set({ orgInput: null, orgOutput: null }),
    }),
    {
      name: "org-redesigner-state",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as unknown as Storage) : sessionStorage,
      ),
    },
  ),
);
