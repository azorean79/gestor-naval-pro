"use client";

import { useEffect, useMemo, useState } from "react";

type DeliveryMethod = "cliente" | "transitario" | "navio";
type SaoMiguelPortCall =
  | "Rabo de Peixe"
  | "Ponta Delgada"
  | "Porto Formoso"
  | "Vila Franca do Campo"
  | "Ribeira Quente"
  | "Lagoa";

type LogisticsQueueItem = {
  queueId: number;
  raftId: number;
  serial: string;
  shipName: string;
  model: string;
  status: string;
  arrivedViaForwarder?: boolean;
  arrivalDate?: string;
  readyForDelivery?: boolean;
  deliveryMethod?: DeliveryMethod | null;
  saoMiguelPortCall?: SaoMiguelPortCall | null;
  delivered?: boolean;
  deliveredAt?: string | null;
  updatedAt?: string;
};

type EditDraft = {
  arrivedViaForwarder: boolean;
  arrivalDate: string;
  readyForDelivery: boolean;
  deliveryMethod: DeliveryMethod | "";
  saoMiguelPortCall: SaoMiguelPortCall | "";
};

const PORT_OPTIONS: SaoMiguelPortCall[] = [
  "Rabo de Peixe",
  "Ponta Delgada",
  "Porto Formoso",
  "Vila Franca do Campo",
  "Ribeira Quente",
  "Lagoa",
];

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  cliente: "Entregar ao cliente",
  transitario: "Entregar ao transitário",
  navio: "Entregar no navio",
};

function formatQueueStatusLabel(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase() === "finalizada"
    ? "Pronta para entrega"
    : String(value || "—");
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toDraft(item: LogisticsQueueItem): EditDraft {
  return {
    arrivedViaForwarder: Boolean(item.arrivedViaForwarder),
    arrivalDate: String(item.arrivalDate || ""),
    readyForDelivery: Boolean(item.readyForDelivery),
    deliveryMethod: (item.deliveryMethod as DeliveryMethod) || "",
    saoMiguelPortCall: (item.saoMiguelPortCall as SaoMiguelPortCall) || "",
  };
}

function formatDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default function LogisticaPage() {
  const [items, setItems] = useState<LogisticsQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draft, setDraft] = useState<EditDraft>({
    arrivedViaForwarder: false,
    arrivalDate: "",
    readyForDelivery: false,
    deliveryMethod: "",
    saoMiguelPortCall: "",
  });

  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/service-station", { cache: "no-store" });
      const payload = await res.json().catch(() => []);
      if (!res.ok) throw new Error(payload?.error || "Falha ao carregar módulo de logística.");

      const list = Array.isArray(payload) ? (payload as LogisticsQueueItem[]) : [];
      setItems(list);

      if (list.length > 0) {
        const nextSelected = selectedId && list.some((item) => item.queueId === selectedId)
          ? selectedId
          : list[0].queueId;
        setSelectedId(nextSelected);

        const selected = list.find((item) => item.queueId === nextSelected);
        if (selected) setDraft(toDraft(selected));
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Falha ao carregar dados de logística.");
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const term = normalizeText(search);
    if (!term) return items;

    return items.filter((item) => {
      const serial = normalizeText(item.serial);
      const ship = normalizeText(item.shipName);
      const model = normalizeText(item.model);
      return serial.includes(term) || ship.includes(term) || model.includes(term);
    });
  }, [items, search]);

  const selectedItem = useMemo(
    () => items.find((item) => item.queueId === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selectedItem) return;
    setDraft(toDraft(selectedItem));
  }, [selectedItem?.queueId]);

  const handleSelect = (item: LogisticsQueueItem) => {
    setSelectedId(item.queueId);
    setDraft(toDraft(item));
    setSuccess("");
    setError("");
  };

  const saveDraft = async () => {
    if (!selectedItem) return;

    setSavingId(selectedItem.queueId);
    setError("");
    setSuccess("");

    try {
      const payload = {
        id: selectedItem.queueId,
        arrivedViaForwarder: draft.arrivedViaForwarder,
        arrivalDate: draft.arrivalDate || undefined,
        readyForDelivery: draft.readyForDelivery,
        deliveryMethod: draft.deliveryMethod || null,
        saoMiguelPortCall: draft.saoMiguelPortCall || null,
      };

      const res = await fetch("/api/service-station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Falha ao gravar logística.");

      setSuccess("Logística atualizada com sucesso.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gravar logística.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleDelivered = async (item: LogisticsQueueItem, nextDelivered: boolean) => {
    setSavingId(item.queueId);
    setError("");
    setSuccess("");

    try {
      if (nextDelivered && !window.confirm(`Marcar a jangada ${item.serial || item.raftId} como entregue?`)) {
        return;
      }

      const res = await fetch(`/api/jangadas/${item.raftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivered: nextDelivered }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || (nextDelivered ? "Falha ao marcar como entregue." : "Falha ao remover estado de entregue."));

      setSuccess(nextDelivered ? "Entrega registada com sucesso." : "Estado de entregue removido com sucesso.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar o estado de entrega.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Módulo de Logística · Jangadas</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestão de receção e entrega: transitário, data de chegada, pronta para entrega, método e porto de escala.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadItems()}
          disabled={loading || savingId !== null}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}
      {success ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por serial, navio ou modelo..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="max-h-[560px] overflow-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-500">A carregar registos logísticos...</div>
            ) : filteredItems.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">Sem registos para apresentar.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const selected = item.queueId === selectedId;
                  return (
                    <li key={item.queueId}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item)}
                        className={`w-full px-4 py-3 text-left transition ${selected ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{item.serial || "—"}</p>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {item.delivered ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Entregue
                              </span>
                            ) : null}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                              {formatQueueStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{item.shipName || "Sem navio"}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.model || "—"}</p>
                        {item.deliveredAt ? (
                          <p className="mt-1 text-[11px] font-medium text-emerald-700">Entregue em {formatDate(item.deliveredAt)}</p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedItem ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
              Selecione uma jangada para editar os dados logísticos.
            </div>
          ) : (
            <>
              <div className="mb-5 border-b border-slate-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Jangada selecionada</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedItem.serial || "—"}</p>
                <p className="text-sm text-slate-600">{selectedItem.shipName || "Sem navio"}</p>
                <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedItem.delivered ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {selectedItem.delivered ? `Entregue${selectedItem.deliveredAt ? ` em ${formatDate(selectedItem.deliveredAt)}` : ""}` : "Por entregar"}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.arrivedViaForwarder}
                    onChange={(event) => setDraft((prev) => ({ ...prev, arrivedViaForwarder: event.target.checked }))}
                  />
                  Chegou via transitário
                </label>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Data de chegada</label>
                  <input
                    type="date"
                    value={draft.arrivalDate}
                    onChange={(event) => setDraft((prev) => ({ ...prev, arrivalDate: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.readyForDelivery}
                    onChange={(event) => setDraft((prev) => ({ ...prev, readyForDelivery: event.target.checked }))}
                  />
                  Pronta para entrega
                </label>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Método de entrega</label>
                  <select
                    value={draft.deliveryMethod}
                    onChange={(event) => setDraft((prev) => ({ ...prev, deliveryMethod: event.target.value as DeliveryMethod | "" }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecionar...</option>
                    <option value="cliente">{DELIVERY_LABELS.cliente}</option>
                    <option value="transitario">{DELIVERY_LABELS.transitario}</option>
                    <option value="navio">{DELIVERY_LABELS.navio}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Porto de escala (São Miguel)</label>
                  <select
                    value={draft.saoMiguelPortCall}
                    onChange={(event) => setDraft((prev) => ({ ...prev, saoMiguelPortCall: event.target.value as SaoMiguelPortCall | "" }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecionar...</option>
                    {PORT_OPTIONS.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void saveDraft()}
                      disabled={savingId === selectedItem.queueId}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingId === selectedItem.queueId ? "A guardar..." : "Guardar logística"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleDelivered(selectedItem, !Boolean(selectedItem.delivered))}
                      disabled={savingId === selectedItem.queueId}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${selectedItem.delivered ? "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                    >
                      {selectedItem.delivered ? "Remover entregue" : "Marcar como entregue"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
