"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retries = DEFAULT_RETRIES,
  retryDelay = DEFAULT_RETRY_DELAY
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, { ...options, credentials: 'include', signal: options?.signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : null;
        throw new Error(message || `HTTP ${response.status}`);
      }
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await sleep(retryDelay * (attempt + 1));
      }
    }
  }
  throw lastError || new Error("Falha na chamada à API.");
}

export function useFetch<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (url: string, options?: RequestInit, retries = DEFAULT_RETRIES) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchWithRetry<T>(url, { ...options, signal: controller.signal }, retries);
      setData(result);
      return result;
    } catch (e: unknown) {
      if (!(e instanceof Error && e.name === "AbortError")) {
        const message = e instanceof Error ? e.message : "Erro ao carregar dados.";
        setError(message);
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return useMemo(() => ({ data, loading, error, execute, reset }), [data, loading, error, execute, reset]);
}

export { fetchWithRetry };
