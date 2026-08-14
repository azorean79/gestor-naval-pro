"use client";

import { useQuery } from "@tanstack/react-query";
import type { Jangada, JangadaCatalogOption } from "@/types/jangadas-page";

async function fetchJangadas(): Promise<Jangada[]> {
  const res = await fetch("/api/jangadas?scope=all");
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : [];
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Erro HTTP ${res.status}`);
  }
  return Array.isArray(data) ? data : [];
}

export function useJangadas() {
  return useQuery<Jangada[]>({
    queryKey: ["jangadas", "list"],
    queryFn: fetchJangadas,
  });
}

async function fetchJangadaCatalogOptions(): Promise<JangadaCatalogOption[]> {
  const res = await fetch("/api/jangadas/catalog-options");
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : {};
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Erro HTTP ${res.status}`);
  }
  return Array.isArray(data?.options)
    ? data.options.filter(
        (item: unknown): item is JangadaCatalogOption => {
          if (!item || typeof item !== "object") return false;
          const candidate = item as Partial<JangadaCatalogOption>;
          return Boolean(String(candidate.marca || "").trim()) && Boolean(String(candidate.modelo || "").trim());
        }
      )
    : [];
}

export function useJangadaCatalogOptions() {
  return useQuery<JangadaCatalogOption[]>({
    queryKey: ["jangadas", "catalog-options"],
    queryFn: fetchJangadaCatalogOptions,
  });
}

async function fetchJangadaPackTypes(): Promise<string[]> {
  const res = await fetch("/api/jangadas/pack-types", { cache: "no-store" });
  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : {};
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Erro HTTP ${res.status}`);
  }
  return Array.isArray(data?.options)
    ? data.options.map((item: unknown) => String(item || "").trim()).filter(Boolean)
    : [];
}

export function useJangadaPackTypes() {
  return useQuery<string[]>({
    queryKey: ["jangadas", "pack-types"],
    queryFn: fetchJangadaPackTypes,
  });
}
