"use client";
import { useState, useEffect, useCallback } from "react";

export function usePersistentFilters<T extends Record<string, string>>(
  pageKey: string,
  defaults: T
) {
  const storageKey = `filters_${pageKey}`;

  const [filters, setFilters] = useState<T>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch { /* quota exceeded */ }
  }, [filters, storageKey]);

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaults);
    try { localStorage.removeItem(storageKey); } catch { /* */ }
  }, [defaults, storageKey]);

  return { filters, setFilter, resetFilters, setFilters };
}
