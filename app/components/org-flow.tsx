"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { CurrentRole, RedesignedRole } from "@/lib/types";
import { ROLE_COLORS } from "@/lib/utils";

interface Props {
  roles: CurrentRole[];
  redesigned?: Record<string, RedesignedRole>;
  mode: "before" | "after";
}

function computePositions(roles: CurrentRole[]): Record<string, { x: number; y: number }> {
  // Layer by depth, then spread horizontally within each layer.
  const byId = new Map(roles.map((r) => [r.id, r] as const));
  const depth = new Map<string, number>();
  const walk = (id: string, seen: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const role = byId.get(id);
    if (!role || !role.reports_to) {
      depth.set(id, 0);
      return 0;
    }
    const d = walk(role.reports_to, seen) + 1;
    depth.set(id, d);
    return d;
  };
  roles.forEach((r) => walk(r.id, new Set()));

  const byDepth = new Map<number, string[]>();
  roles.forEach((r) => {
    const d = depth.get(r.id) ?? 0;
    const arr = byDepth.get(d) ?? [];
    arr.push(r.id);
    byDepth.set(d, arr);
  });

  const positions: Record<string, { x: number; y: number }> = {};
  byDepth.forEach((ids, d) => {
    ids.forEach((id, i) => {
      positions[id] = {
        x: i * 220 - (ids.length - 1) * 110,
        y: d * 140,
      };
    });
  });
  return positions;
}

export function OrgFlow({ roles, redesigned, mode }: Props) {
  const { nodes, edges } = useMemo(() => {
    const positions = computePositions(roles);
    const nodes: Node[] = roles.map((r) => {
      const rd = redesigned?.[r.id];
      const color =
        mode === "after" && rd ? ROLE_COLORS[rd.new_type] : "#52525b";
      const eliminated = mode === "after" && rd?.new_type === "Eliminated-Absorbed";
      return {
        id: r.id,
        position: positions[r.id] ?? { x: 0, y: 0 },
        data: {
          label: (
            <div
              style={{
                opacity: eliminated ? 0.4 : 1,
                textDecoration: eliminated ? "line-through" : "none",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600 }}>{r.title}</div>
              {mode === "after" && rd && (
                <div style={{ fontSize: 10, color, marginTop: 2 }}>
                  {rd.new_type} · {rd.system_layer}
                </div>
              )}
              {mode === "before" && (
                <div style={{ fontSize: 10, color: "#a1a1aa", marginTop: 2 }}>
                  {r.level} · {r.function}
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: "#18181b",
          border: `1px solid ${color}`,
          color: "#fafafa",
          borderRadius: 6,
          padding: 8,
          width: 190,
        },
      } satisfies Node;
    });

    const edges: Edge[] = roles
      .filter((r) => r.reports_to)
      .map((r) => ({
        id: `${r.reports_to}->${r.id}`,
        source: r.reports_to as string,
        target: r.id,
        style: { stroke: "#3f3f46" },
      }));

    return { nodes, edges };
  }, [roles, redesigned, mode]);

  return (
    <div className="h-[560px] rounded-lg border border-brand-border bg-brand-bg">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="#27272a" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
