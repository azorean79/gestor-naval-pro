"use client";

import type { OfflineSyncOperation, OfflineSyncPushResponse, OfflineSyncState } from "./types";

const QUEUE_STORAGE_KEY = "offline-sync-queue-v1";
const STATE_STORAGE_KEY = "offline-sync-state-v1";
const DEVICE_ID_STORAGE_KEY = "offline-sync-device-id-v1";
const SNAPSHOT_PREFIX = "offline-sync-snapshot:";
const UPDATE_EVENT = "offline-sync:update";
const DEFAULT_STATE: OfflineSyncState = {
  pendingCount: 0,
  syncing: false,
  online: true,
  lastSyncAt: null,
  lastError: null,
};

export class OfflineSyncHttpError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "OfflineSyncHttpError";
    this.status = status;
    this.payload = payload;
  }
}

function hasWindow() {
  return typeof window !== "undefined";
}

function dispatchUpdate() {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readStoredQueue() {
  if (!hasWindow()) return [] as OfflineSyncOperation[];
  return safeParseJson<OfflineSyncOperation[]>(window.localStorage.getItem(QUEUE_STORAGE_KEY), []);
}

function writeStoredQueue(queue: OfflineSyncOperation[]) {
  if (!hasWindow()) return;
  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

function readStoredState() {
  if (!hasWindow()) return DEFAULT_STATE;
  const state = safeParseJson<Partial<OfflineSyncState>>(window.localStorage.getItem(STATE_STORAGE_KEY), {});
  return {
    ...DEFAULT_STATE,
    ...state,
    pendingCount: readStoredQueue().length,
    online: navigator.onLine,
  } satisfies OfflineSyncState;
}

function writeStoredState(patch: Partial<OfflineSyncState>) {
  if (!hasWindow()) return DEFAULT_STATE;
  const nextState = {
    ...readStoredState(),
    ...patch,
    pendingCount: readStoredQueue().length,
    online: navigator.onLine,
  } satisfies OfflineSyncState;
  window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(nextState));
  dispatchUpdate();
  return nextState;
}

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOfflineSyncDeviceId() {
  if (!hasWindow()) return "server";
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;
  const next = `device-${randomId()}`;
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
  return next;
}

export function getOfflineSyncQueue() {
  return readStoredQueue();
}

export function getOfflineSyncState() {
  return readStoredState();
}

export function subscribeOfflineSync(listener: () => void) {
  if (!hasWindow()) return () => {};
  const wrapped = () => listener();
  window.addEventListener(UPDATE_EVENT, wrapped);
  window.addEventListener("storage", wrapped);
  window.addEventListener("online", wrapped);
  window.addEventListener("offline", wrapped);
  return () => {
    window.removeEventListener(UPDATE_EVENT, wrapped);
    window.removeEventListener("storage", wrapped);
    window.removeEventListener("online", wrapped);
    window.removeEventListener("offline", wrapped);
  };
}

export function updateOfflineSyncConnectivity(online: boolean) {
  return writeStoredState({ online });
}

export function enqueueOfflineSyncOperation(operation: Omit<OfflineSyncOperation, "id" | "createdAt" | "deviceId"> & { id?: string }) {
  const nextOperation: OfflineSyncOperation = {
    id: operation.id || randomId(),
    createdAt: new Date().toISOString(),
    deviceId: getOfflineSyncDeviceId(),
    ...operation,
  };
  const queue = readStoredQueue();
  writeStoredQueue([...queue, nextOperation]);
  writeStoredState({ lastError: null });
  return nextOperation;
}

export function removeOfflineSyncOperations(ids: string[]) {
  const idSet = new Set(ids);
  const nextQueue = readStoredQueue().filter((item) => !idSet.has(item.id));
  writeStoredQueue(nextQueue);
  writeStoredState({});
}

export function clearOfflineSyncError() {
  writeStoredState({ lastError: null });
}

export function writeOfflineSnapshot<T>(key: string, value: T) {
  if (!hasWindow()) return;
  window.localStorage.setItem(`${SNAPSHOT_PREFIX}${key}`, JSON.stringify(value));
}

export function readOfflineSnapshot<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  return safeParseJson<T>(window.localStorage.getItem(`${SNAPSHOT_PREFIX}${key}`), fallback);
}

export function deleteOfflineSnapshot(key: string) {
  if (!hasWindow()) return;
  window.localStorage.removeItem(`${SNAPSHOT_PREFIX}${key}`);
}

function isNetworkFailure(error: unknown) {
  if (!error) return false;
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("network") || message.includes("fetch") || message.includes("failed to fetch");
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function performOfflineAwareJsonRequest<T>(options: {
  path: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  queueEntry?: Partial<Pick<OfflineSyncOperation, "entityType" | "entityId" | "summary">>;
}) {
  const body = options.body;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const queueFallback = () => {
    const queued = enqueueOfflineSyncOperation({
      path: options.path,
      method: options.method,
      headers,
      body,
      entityType: options.queueEntry?.entityType,
      entityId: options.queueEntry?.entityId,
      summary: options.queueEntry?.summary,
    });
    return { queued: true as const, data: null as T | null, queuedOperation: queued };
  };

  if (hasWindow() && !navigator.onLine) {
    return queueFallback();
  }

  try {
    const response = await fetch(options.path, {
      method: options.method,
      headers,
      body: body == null ? undefined : JSON.stringify(body),
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw new OfflineSyncHttpError(
        typeof payload === "object" && payload && "error" in (payload as Record<string, unknown>)
          ? String((payload as Record<string, unknown>).error || "Erro no pedido.")
          : "Erro no pedido.",
        response.status,
        payload,
      );
    }
    return { queued: false as const, data: payload as T, queuedOperation: null };
  } catch (error) {
    if (error instanceof OfflineSyncHttpError) {
      throw error;
    }
    if (isNetworkFailure(error)) {
      return queueFallback();
    }
    throw error;
  }
}

let flushPromise: Promise<OfflineSyncPushResponse | null> | null = null;

export async function flushOfflineSyncQueue() {
  if (!hasWindow()) return null;
  if (flushPromise) return flushPromise;
  if (!navigator.onLine) {
    writeStoredState({ online: false, syncing: false });
    return null;
  }

  const queue = readStoredQueue();
  if (queue.length === 0) {
    writeStoredState({ syncing: false, online: true, lastError: null });
    return {
      ok: true,
      processedCount: 0,
      successCount: 0,
      results: [],
    } satisfies OfflineSyncPushResponse;
  }

  flushPromise = (async () => {
    writeStoredState({ syncing: true, online: true, lastError: null });
    try {
      const response = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: queue }),
      });
      const payload = await parseJsonResponse(response);
      if (!response.ok) {
        const message = typeof payload === "object" && payload && "error" in (payload as Record<string, unknown>)
          ? String((payload as Record<string, unknown>).error || "Falha na sincronização offline.")
          : "Falha na sincronização offline.";
        writeStoredState({ syncing: false, lastError: message });
        throw new OfflineSyncHttpError(message, response.status, payload);
      }

      const parsed = payload as OfflineSyncPushResponse;
      const successfulIds = Array.isArray(parsed.results)
        ? parsed.results.filter((result) => result.ok).map((result) => result.id)
        : [];
      if (successfulIds.length > 0) {
        removeOfflineSyncOperations(successfulIds);
      }
      writeStoredState({
        syncing: false,
        lastSyncAt: successfulIds.length > 0 ? new Date().toISOString() : readStoredState().lastSyncAt,
        lastError: parsed.ok ? null : parsed.results.find((result) => !result.ok)?.error || null,
      });
      return parsed;
    } catch (error) {
      if (error instanceof OfflineSyncHttpError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Falha ao sincronizar operações offline.";
      writeStoredState({ syncing: false, lastError: message });
      throw error;
    } finally {
      flushPromise = null;
      dispatchUpdate();
    }
  })();

  return flushPromise;
}
