"use client";

import { useQuery } from "@tanstack/react-query";

export type DashboardPayload = {
  stats: unknown;
  needs: unknown;
  auditoria: unknown;
  ordensKpis: unknown;
  otAlerts: unknown;
  alerts: unknown;
  agendaMetrics: unknown;
  dataQuality: unknown;
  tecnicos: unknown;
  jangadas: unknown[];
  expiring: unknown;
};

async function fetchDashboard(): Promise<DashboardPayload> {
  const res = await fetch("/api/dashboard");
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error || `Erro ao carregar dashboard: ${res.status}`);
  }
  return payload as DashboardPayload;
}

export function useDashboard() {
  return useQuery<DashboardPayload>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function prefetchDashboardKey() {
  return ["dashboard"];
}
