"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { epirbModelData } from "@/modules/epirbs/epirbModelData";
import { resolveEpirbManuals } from "@/modules/epirbs/manualResolver";
import { sortNaviosAlphabetically } from "@/lib/navios-sort";

type Epirb = {
  id: number;
  shipId?: number | null;
  serial: string;
  marca?: string | null;
  modelo?: string | null;
  tipo?: string | null;
  hexId?: string | null;
  estado?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  dataValidadeBateria?: string | null;
  observacoes?: string | null;
};

type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
};

const INITIAL_FORM = {
  serial: "",
  marca: "Ocean Signal",
  modelo: "EPIRB1",
  tipo: "406 MHz",
  hexId: "",
  estado: "Ativo",
  shipId: "",
  dataInspecao: "",
  dataProxInspecao: "",
  dataValidadeBateria: "",
  observacoes: "",
};

function normalizeCatalogKey(value: string | null | undefined): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export default function EpirbsPage() {
  const [epirbs, setEpirbs] = useState<Epirb[]>([]);
  const [navios, setNavios] = useState<Navio[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMarca, setFilterMarca] = useState("");
  const [filterModelo, setFilterModelo] = useState("");
  const [selectedEpirbs, setSelectedEpirbs] = useState<number[]>([]);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const [batchShipId, setBatchShipId] = useState("");
  const [batchEstado, setBatchEstado] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const [epirbsRes, naviosRes] = await Promise.all([
        fetch("/api/epirbs", { cache: "no-store" }),
        fetch("/api/navios", { cache: "no-store" }),
      ]);

      const epirbsData = await epirbsRes.json().catch(() => []);
      const naviosRaw = await naviosRes.json().catch(() => []);
      const naviosData = Array.isArray(naviosRaw?.data) ? naviosRaw.data : naviosRaw;

      setEpirbs(Array.isArray(epirbsData) ? epirbsData : []);
      setNavios(Array.isArray(naviosData) ? sortNaviosAlphabetically(naviosData) : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const navioById = useMemo(() => {
    const map = new Map<number, Navio>();
    navios.forEach((navio) => map.set(navio.id, navio));
    return map;
  }, [navios]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return epirbs.filter((item) => {
      const navioNome = item.shipId ? navioById.get(Number(item.shipId))?.nome || "" : "";
      const haystack = `${item.serial} ${item.marca || ""} ${item.modelo || ""} ${item.hexId || ""} ${navioNome}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesMarca = !filterMarca || normalizeCatalogKey(item.marca) === normalizeCatalogKey(filterMarca);
      const matchesModelo = !filterModelo || normalizeCatalogKey(item.modelo) === normalizeCatalogKey(filterModelo);
      return matchesSearch && matchesMarca && matchesModelo;
    });
  }, [epirbs, navioById, search, filterMarca, filterModelo]);

  const oceanSignalModels = epirbModelData.find((entry) => entry.brand === "Ocean Signal")?.models || [];

  const brandOptions = useMemo(() => {
    const byKey = new Map<string, string>();

    for (const entry of epirbModelData) {
      const brand = String(entry.brand || "").trim();
      const key = normalizeCatalogKey(brand);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, brand);
    }

    for (const item of epirbs) {
      const brand = String(item.marca || "").trim();
      const key = normalizeCatalogKey(brand);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, brand);
    }

    const currentBrand = String(form.marca || "").trim();
    const currentKey = normalizeCatalogKey(currentBrand);
    if (currentKey && !byKey.has(currentKey)) {
      byKey.set(currentKey, currentBrand);
    }

    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [epirbs, form.marca]);

  const filterBrandOptions = useMemo(() => brandOptions, [brandOptions]);

  const modelOptions = useMemo(() => {
    const selectedBrandKey = normalizeCatalogKey(form.marca);
    const byKey = new Map<string, string>();

    for (const entry of epirbModelData) {
      const entryBrandKey = normalizeCatalogKey(entry.brand);
      if (selectedBrandKey && entryBrandKey !== selectedBrandKey) continue;

      for (const model of entry.models || []) {
        const label = String(model.model || "").trim();
        const key = normalizeCatalogKey(label);
        if (!key || byKey.has(key)) continue;
        byKey.set(key, label);
      }
    }

    for (const item of epirbs) {
      const itemBrandKey = normalizeCatalogKey(item.marca || "");
      if (selectedBrandKey && itemBrandKey !== selectedBrandKey) continue;

      const label = String(item.modelo || "").trim();
      const key = normalizeCatalogKey(label);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, label);
    }

    const currentModel = String(form.modelo || "").trim();
    const currentKey = normalizeCatalogKey(currentModel);
    if (currentKey && !byKey.has(currentKey)) {
      byKey.set(currentKey, currentModel);
    }

    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [epirbs, form.marca, form.modelo]);

  const filterModelOptions = useMemo(() => {
    const selectedBrandKey = normalizeCatalogKey(filterMarca);
    const byKey = new Map<string, string>();

    for (const entry of epirbModelData) {
      const entryBrandKey = normalizeCatalogKey(entry.brand);
      if (selectedBrandKey && entryBrandKey !== selectedBrandKey) continue;

      for (const model of entry.models || []) {
        const label = String(model.model || "").trim();
        const key = normalizeCatalogKey(label);
        if (!key || byKey.has(key)) continue;
        byKey.set(key, label);
      }
    }

    for (const item of epirbs) {
      const itemBrandKey = normalizeCatalogKey(item.marca || "");
      if (selectedBrandKey && itemBrandKey !== selectedBrandKey) continue;

      const label = String(item.modelo || "").trim();
      const key = normalizeCatalogKey(label);
      if (!key || byKey.has(key)) continue;
      byKey.set(key, label);
    }

    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [epirbs, filterMarca]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serial.trim()) {
      alert("Nº de série do EPIRB é obrigatório.");
      return;
    }

    setSaving(true);
    const payload = {
      serial: form.serial.trim(),
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      tipo: form.tipo.trim() || null,
      hexId: form.hexId.trim() || null,
      estado: form.estado.trim() || "Ativo",
      shipId: form.shipId ? Number(form.shipId) : null,
      dataInspecao: form.dataInspecao || null,
      dataProxInspecao: form.dataProxInspecao || null,
      dataValidadeBateria: form.dataValidadeBateria || null,
      observacoes: form.observacoes.trim() || null,
    };

    const res = await fetch(editId ? `/api/epirbs/${editId}` : "/api/epirbs", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Não foi possível guardar o EPIRB.");
      setSaving(false);
      return;
    }

    resetForm();
    await loadAll();
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Eliminar este EPIRB?")) return;
    const res = await fetch(`/api/epirbs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Não foi possível eliminar o EPIRB.");
      return;
    }
    await loadAll();
  }

  function startEdit(item: Epirb) {
    setEditId(item.id);
    setForm({
      serial: item.serial || "",
      marca: item.marca || "Ocean Signal",
      modelo: item.modelo || "",
      tipo: item.tipo || "",
      hexId: item.hexId || "",
      estado: item.estado || "Ativo",
      shipId: item.shipId ? String(item.shipId) : "",
      dataInspecao: item.dataInspecao || "",
      dataProxInspecao: item.dataProxInspecao || "",
      dataValidadeBateria: item.dataValidadeBateria || "",
      observacoes: item.observacoes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSelectEpirb(id: number, checked: boolean) {
    setSelectedEpirbs((prev) => checked ? [...prev, id] : prev.filter((itemId) => itemId !== id));
  }

  function handleSelectAllEpirbs(checked: boolean) {
    setSelectedEpirbs(checked ? filtered.map((item) => item.id) : []);
  }

  async function handleDeleteBatch() {
    if (selectedEpirbs.length === 0) return;
    if (!window.confirm(`Eliminar ${selectedEpirbs.length} EPIRB(s) selecionado(s)?`)) return;

    setDeletingBatch(true);
    try {
      const res = await fetch("/api/epirbs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedEpirbs }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Não foi possível eliminar os EPIRBs selecionados.");
      }

      setSelectedEpirbs([]);
      await loadAll();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível eliminar os EPIRBs selecionados.");
    } finally {
      setDeletingBatch(false);
    }
  }

  async function handleBatchAction(action: "assign-ship" | "clear-ship" | "set-status") {
    if (selectedEpirbs.length === 0) return;
    if (action === "assign-ship" && !batchShipId) {
      alert("Selecione primeiro o navio para a associação em lote.");
      return;
    }
    if (action === "set-status" && !batchEstado) {
      alert("Selecione primeiro o estado para a atualização em lote.");
      return;
    }

    setBatchApplying(true);
    try {
      const res = await fetch("/api/epirbs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedEpirbs,
          action,
          shipId: action === "assign-ship" ? Number(batchShipId) : undefined,
          estado: action === "set-status" ? batchEstado : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Não foi possível aplicar a ação em lote nos EPIRBs.");
      }

      setSelectedEpirbs([]);
      await loadAll();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível aplicar a ação em lote nos EPIRBs.");
    } finally {
      setBatchApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-100 via-white to-indigo-100 p-6 shadow-lg">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">Orey Técnica</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Módulo EPIRBs</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold text-slate-900">Registo e acompanhamento dos EPIRBs, com manuais Ocean Signal e associação direta ao navio.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{editId ? "Editar EPIRB" : "Novo EPIRB"}</h2>
                <p className="text-sm text-slate-500">Formulário rápido para criar ou corrigir o equipamento.</p>
              </div>
              {editId ? (
                <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Cancelar edição
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="w-full rounded-lg border px-3 py-2" placeholder="Nº de série" value={form.serial} onChange={(e) => setForm((prev) => ({ ...prev, serial: e.target.value }))} required />
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.marca}
                onChange={(e) => setForm((prev) => ({ ...prev, marca: e.target.value, modelo: "" }))}
              >
                <option value="">Selecionar marca</option>
                {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.modelo}
                onChange={(e) => setForm((prev) => ({ ...prev, modelo: e.target.value }))}
                disabled={!form.marca}
              >
                <option value="">{form.marca ? "Selecionar modelo" : "Selecione primeiro a marca"}</option>
                {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
              </select>
              <input className="w-full rounded-lg border px-3 py-2" placeholder="Tipo" value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))} />
              <input className="w-full rounded-lg border px-3 py-2" placeholder="HEX ID" value={form.hexId} onChange={(e) => setForm((prev) => ({ ...prev, hexId: e.target.value }))} />
              <select className="w-full rounded-lg border px-3 py-2" value={form.shipId} onChange={(e) => setForm((prev) => ({ ...prev, shipId: e.target.value }))}>
                <option value="">Sem navio associado</option>
                {navios.map((navio) => (
                  <option key={navio.id} value={navio.id}>{navio.nome}{navio.matricula ? ` (${navio.matricula})` : ""}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.dataInspecao} onChange={(e) => setForm((prev) => ({ ...prev, dataInspecao: e.target.value }))} />
                <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.dataProxInspecao} onChange={(e) => setForm((prev) => ({ ...prev, dataProxInspecao: e.target.value }))} />
                <input type="date" className="w-full rounded-lg border px-3 py-2" value={form.dataValidadeBateria} onChange={(e) => setForm((prev) => ({ ...prev, dataValidadeBateria: e.target.value }))} />
              </div>
              <textarea className="w-full rounded-lg border px-3 py-2" rows={4} placeholder="Observações" value={form.observacoes} onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg bg-slate-200 px-4 py-2 text-sm" onClick={resetForm}>Limpar</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? "A guardar..." : editId ? "Atualizar" : "Criar EPIRB"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Lista de EPIRBs</h2>
                <p className="text-sm text-slate-500">Clique num registo para abrir a ficha detalhada.</p>
              </div>
              <div className="grid w-full gap-2 md:w-auto md:grid-cols-3">
                <input
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Pesquisar serial / modelo / navio"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={filterMarca}
                  onChange={(e) => {
                    setFilterMarca(e.target.value);
                    setFilterModelo("");
                  }}
                >
                  <option value="">Todas as marcas</option>
                  {filterBrandOptions.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={filterModelo}
                  onChange={(e) => setFilterModelo(e.target.value)}
                  disabled={!filterMarca}
                >
                  <option value="">{filterMarca ? "Todos os modelos" : "Selecione uma marca"}</option>
                  {filterModelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><p className="text-xs uppercase tracking-wide text-violet-700">Total</p><p className="text-2xl font-bold text-violet-900">{epirbs.length}</p></div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs uppercase tracking-wide text-emerald-700">Ativos</p><p className="text-2xl font-bold text-emerald-900">{epirbs.filter((item) => String(item.estado || "").toLowerCase().includes("ativo")).length}</p></div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-3"><p className="text-xs uppercase tracking-wide text-sky-700">Associados a navio</p><p className="text-2xl font-bold text-sky-900">{epirbs.filter((item) => item.shipId).length}</p></div>
            </div>

            <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Modelos Ocean Signal colados no módulo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {oceanSignalModels.map((model) => {
                  const manualData = resolveEpirbManuals("Ocean Signal", model.model);
                  return (
                    <div key={model.model} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-950">
                      <div className="font-semibold">{model.model}</div>
                      <div className="text-xs text-indigo-700">{manualData.manuals.length} manual(is) mapeado(s)</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500">A carregar EPIRBs...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={selectedEpirbs.length === 0 || deletingBatch || batchApplying}
                    onClick={() => void handleDeleteBatch()}
                  >
                    {deletingBatch ? "A eliminar..." : `Eliminar selecionados (${selectedEpirbs.length})`}
                  </button>
                  <select className="rounded border px-2 py-1.5 text-xs" value={batchShipId} onChange={(e) => setBatchShipId(e.target.value)} disabled={batchApplying}>
                    <option value="">Associar a navio...</option>
                    {navios.map((navio) => (
                      <option key={navio.id} value={navio.id}>{navio.nome}{navio.matricula ? ` (${navio.matricula})` : ""}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={selectedEpirbs.length === 0 || batchApplying || !batchShipId}
                    onClick={() => void handleBatchAction("assign-ship")}
                  >
                    Associar navio
                  </button>
                  <button
                    type="button"
                    className="rounded bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={selectedEpirbs.length === 0 || batchApplying}
                    onClick={() => void handleBatchAction("clear-ship")}
                  >
                    Remover navio
                  </button>
                  <select className="rounded border px-2 py-1.5 text-xs" value={batchEstado} onChange={(e) => setBatchEstado(e.target.value)} disabled={batchApplying}>
                    <option value="">Atualizar estado...</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Em manutenção">Em manutenção</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={selectedEpirbs.length === 0 || batchApplying || !batchEstado}
                    onClick={() => void handleBatchAction("set-status")}
                  >
                    Aplicar estado
                  </button>
                  <span className="text-xs text-slate-500">Selecionados: {selectedEpirbs.length}</span>
                </div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-violet-100 text-violet-900">
                      <th className="p-3 text-left font-semibold">
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedEpirbs.length === filtered.length}
                          onChange={(e) => handleSelectAllEpirbs(e.target.checked)}
                        />
                      </th>
                      <th className="p-3 text-left font-semibold">Serial</th>
                      <th className="p-3 text-left font-semibold">Marca / Modelo</th>
                      <th className="p-3 text-left font-semibold">HEX ID</th>
                      <th className="p-3 text-left font-semibold">Navio</th>
                      <th className="p-3 text-left font-semibold">Estado</th>
                      <th className="p-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const navio = item.shipId ? navioById.get(Number(item.shipId)) : null;
                      return (
                        <tr key={item.id} className="border-b align-top">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedEpirbs.includes(item.id)}
                              onChange={(e) => handleSelectEpirb(item.id, e.target.checked)}
                            />
                          </td>
                          <td className="p-3 font-mono">
                            <Link href={`/epirbs/${item.id}`} className="font-semibold text-blue-700 hover:underline">{item.serial}</Link>
                          </td>
                          <td className="p-3">{[item.marca, item.modelo].filter(Boolean).join(" · ") || "—"}</td>
                          <td className="p-3">{item.hexId || "—"}</td>
                          <td className="p-3">{navio ? navio.nome : "Sem navio"}</td>
                          <td className="p-3">{item.estado || "—"}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button type="button" className="rounded bg-amber-400 px-2 py-1 text-xs font-semibold text-slate-900" onClick={() => startEdit(item)}>Editar</button>
                              <button type="button" className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white" onClick={() => handleDelete(item.id)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">Nenhum EPIRB encontrado.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
