// Shared helpers.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NewRoleType } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const ROLE_COLORS: Record<NewRoleType, string> = {
  IC: "#3b82f6",
  DRI: "#f59e0b",
  "Player-Coach": "#22c55e",
  "Eliminated-Absorbed": "#ef4444",
};

export const ROLE_LABELS: Record<NewRoleType, string> = {
  IC: "IC",
  DRI: "DRI",
  "Player-Coach": "Player-Coach",
  "Eliminated-Absorbed": "Eliminated",
};

export function downloadJSON(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
