"use client";

import { useQuery } from "@tanstack/react-query";
import type { TecnicosPayload, AusenciasPayload } from "@/types/tecnicos-page";

async function fetchTecnicos(search: string, showInactive: boolean): Promise<TecnicosPayload> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (showInactive) params.set("includeInactive", "true");

  const res = await fetch(`/api/tecnicos${params.toString() ? `?${params.toString()}` : ""}`, {
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as TecnicosPayload | { error?: string } | null;
  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error || "Erro ao carregar técnicos.");
  }
  return data as TecnicosPayload;
}

export function useTecnicos(search: string, showInactive: boolean) {
  return useQuery<TecnicosPayload>({
    queryKey: ["tecnicos", search.trim(), showInactive],
    queryFn: () => fetchTecnicos(search, showInactive),
  });
}

type TecnicoProdutividadeRow = {
  id: number;
  nome: string;
  email: string | null;
  estacao: string;
  estacaoCodigo: string;
  completedCount: number;
  totalHours: number;
  avgMinutes: number;
};

async function fetchTecnicosProdutividade(): Promise<TecnicoProdutividadeRow[]> {
  const res = await fetch("/api/tecnicos/produtividade", { cache: "no-store" });
  if (!res.ok) throw new Error("Erro ao carregar dados de produtividade.");
  return res.json();
}

export function useTecnicosProdutividade(enabled: boolean) {
  return useQuery<TecnicoProdutividadeRow[]>({
    queryKey: ["tecnicos", "produtividade"],
    queryFn: fetchTecnicosProdutividade,
    enabled,
  });
}

async function fetchAusencias(tecnicoNome: string): Promise<AusenciasPayload> {
  const params = new URLSearchParams({ tecnicoNome });
  const res = await fetch(`/api/tecnicos/ausencias?${params.toString()}`, { cache: "no-store" });
  const data = (await res.json().catch(() => null)) as AusenciasPayload | { error?: string } | null;
  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error || "Erro ao carregar ausências.");
  }
  return data as AusenciasPayload;
}

export function useAusencias(tecnicoNome: string, enabled: boolean) {
  return useQuery<AusenciasPayload>({
    queryKey: ["ausencias", tecnicoNome],
    queryFn: () => fetchAusencias(tecnicoNome),
    enabled,
  });
}
