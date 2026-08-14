"use client";

import React, { useMemo, useState } from "react";
import { FATO_HOTSPOTS } from "@/lib/fatos-imersao-checklist";

export type ImmersionSuitDiagramProps = {
  statuses?: Record<string, string>;
  selectedZones?: string[];
  onToggleZone?: (key: string) => void;
  interactive?: boolean;
  compact?: boolean;
};

function statusColor(st?: string, selected?: boolean) {
  if (selected) return { fill: "#f59e0b", ring: "#d97706", text: "Fuga" };
  if (st === "F" || st === "S") return { fill: "#ef4444", ring: "#b91c1c", text: st };
  if (st === "R") return { fill: "#3b82f6", ring: "#1d4ed8", text: "R" };
  if (st === "N/A") return { fill: "#94a3b8", ring: "#64748b", text: "N/A" };
  return { fill: "#10b981", ring: "#059669", text: "OK" };
}

function SuitSilhouette({ side }: { side: "front" | "back" }) {
  return (
    <g opacity={0.95}>
      <ellipse cx="50" cy="10" rx="9" ry="8" fill="#dc2626" stroke="#991b1b" strokeWidth="0.6" />
      <path
        d="M35 16 Q32 18 30 28 L28 48 L22 70 L26 72 L32 52 L34 78 L30 98 L38 98 L42 78 L50 80 L58 78 L62 98 L70 98 L66 78 L68 52 L74 72 L78 70 L72 48 L70 28 Q68 18 65 16 Z"
        fill="#ef4444"
        stroke="#991b1b"
        strokeWidth="0.7"
      />
      <rect x="47" y="20" width="6" height="36" rx="1.5" fill="#1e293b" opacity={side === "front" ? 0.85 : 0.25} />
      <rect x="28" y="22" width="8" height="3" rx="0.5" fill="#fef08a" opacity="0.9" />
      <rect x="64" y="22" width="8" height="3" rx="0.5" fill="#fef08a" opacity="0.9" />
      <rect x="36" y="70" width="6" height="3" rx="0.5" fill="#fef08a" opacity="0.85" />
      <rect x="58" y="70" width="6" height="3" rx="0.5" fill="#fef08a" opacity="0.85" />
      {side === "back" && (
        <ellipse cx="50" cy="42" rx="12" ry="16" fill="#f87171" stroke="#991b1b" strokeWidth="0.5" opacity="0.5" />
      )}
      <text x="50" y="106" textAnchor="middle" fontSize="4.5" fill="#64748b" fontWeight="600">
        {side === "front" ? "FRENTE" : "COSTAS"}
      </text>
    </g>
  );
}

export default function ImmersionSuitDiagram({
  statuses = {},
  selectedZones = [],
  onToggleZone,
  interactive = true,
  compact = false,
}: ImmersionSuitDiagramProps) {
  const [hover, setHover] = useState<string | null>(null);
  const selected = useMemo(() => new Set(selectedZones), [selectedZones]);

  const sides = [
    { id: "front" as const, spots: FATO_HOTSPOTS.filter((h) => h.side === "front") },
    { id: "back" as const, spots: FATO_HOTSPOTS.filter((h) => h.side === "back") },
  ];

  return (
    <div className={`grid ${compact ? "grid-cols-2 gap-2" : "grid-cols-1 md:grid-cols-2 gap-4"}`}>
      {sides.map(({ id, spots }) => (
        <div
          key={id}
          className="relative bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2"
        >
          <svg viewBox="0 0 100 112" className="w-full h-auto max-h-[420px]">
            <SuitSilhouette side={id} />
            {spots.map((h) => {
              const statusKey = h.key.replace(/B$/, "");
              const st = statuses[statusKey] || statuses[h.key];
              const isSel = selected.has(h.key) || selected.has(statusKey);
              const c = statusColor(st, isSel);
              const isHover = hover === h.key;
              return (
                <g
                  key={h.key}
                  className={interactive ? "cursor-pointer" : undefined}
                  onMouseEnter={() => setHover(h.key)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => {
                    if (!interactive || !onToggleZone) return;
                    onToggleZone(h.key);
                  }}
                >
                  <circle
                    cx={h.x}
                    cy={h.y}
                    r={isHover || isSel ? 4.2 : 3.4}
                    fill={c.fill}
                    stroke="white"
                    strokeWidth="1.2"
                    opacity={0.95}
                  />
                  <circle cx={h.x} cy={h.y} r={isHover ? 6.5 : 5.5} fill="none" stroke={c.ring} strokeWidth="0.6" opacity="0.5" />
                  {(isHover || isSel) && (
                    <text
                      x={h.x}
                      y={h.y - 6}
                      textAnchor="middle"
                      fontSize="3.2"
                      fill="#0f172a"
                      fontWeight="700"
                    >
                      {h.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      ))}
      {!compact && (
        <div className="md:col-span-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300 px-1">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> OK</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Falha</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Reparado</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Zona de fuga</span>
          {interactive && <span className="text-slate-400">Clique nos pontos para marcar fugas</span>}
        </div>
      )}
    </div>
  );
}
