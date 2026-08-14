export type OfflineSyncMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export type OfflineSyncOperation = {
  id: string;
  path: string;
  method: OfflineSyncMethod;
  headers?: Record<string, string>;
  body?: unknown;
  createdAt: string;
  deviceId: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  attemptCount?: number;
  failedPermanently?: boolean;
};

export type OfflineSyncResult = {
  id: string;
  ok: boolean;
  status: number;
  body?: unknown;
  error?: string;
  skipped?: boolean;
};

export type OfflineSyncState = {
  pendingCount: number;
  syncing: boolean;
  online: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  retryAfterMs?: number;
};

export type OfflineSyncPushResponse = {
  ok: boolean;
  processedCount: number;
  successCount: number;
  results: OfflineSyncResult[];
};
