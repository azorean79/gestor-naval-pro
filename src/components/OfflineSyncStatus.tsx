"use client";

import * as React from "react";
import { clearOfflineSyncError, flushOfflineSyncQueue, getOfflineSyncState, subscribeOfflineSync } from "@/lib/offline-sync/client";
import type { OfflineSyncState } from "@/lib/offline-sync/types";

function formatSyncMoment(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-PT");
}

export default function OfflineSyncStatus() {
  const [state, setState] = React.useState<OfflineSyncState>(() => getOfflineSyncState());
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    const update = () => setState(getOfflineSyncState());
    update();
    return subscribeOfflineSync(update);
  }, []);

  const hasPending = state.pendingCount > 0;
  const toneClasses = !state.online
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : hasPending
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <div className={`fixed bottom-4 right-4 z-[1200] w-[min(92vw,22rem)] rounded-xl border shadow-lg ${toneClasses}`}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold">
            {!state.online ? "Modo offline ativo" : hasPending ? "Sincronização pendente" : "Dados sincronizados"}
          </div>
          <div className="text-xs opacity-90">
            {hasPending ? `${state.pendingCount} operação(ões) por sincronizar` : "Sem pendências na fila local"}
          </div>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wide">
          {state.syncing ? "sync..." : expanded ? "menos" : "mais"}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-black/10 px-4 py-3 text-xs">
          <div className="space-y-1">
            <p><b>Estado:</b> {state.online ? "online" : "offline"}</p>
            <p><b>Pendentes:</b> {state.pendingCount}</p>
            <p><b>Última sincronização:</b> {formatSyncMoment(state.lastSyncAt)}</p>
            {state.lastError ? <p className="text-rose-700"><b>Último erro:</b> {state.lastError}</p> : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void flushOfflineSyncQueue()}
              disabled={!state.online || state.syncing || state.pendingCount === 0}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 disabled:opacity-50"
            >
              Sincronizar agora
            </button>
            {state.lastError ? (
              <button
                type="button"
                onClick={() => clearOfflineSyncError()}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700"
              >
                Limpar erro
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
