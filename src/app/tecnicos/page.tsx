"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TecnicoRow = {
  id: number;
  nome: string;
  email: string | null;
  ativo: boolean;
  serviceStationId: number | null;
};

type StationGroup = {
  id: number;
  codigo: string;
  nome: string;
  empresa: string | null;
  localizacao: string | null;
  territorioTipo: string;
  regiaoOperacional: string | null;
  totalTecnicos: number;
  tecnicos: TecnicoRow[];
};

type TecnicosPayload = {
  activeStationId: number | null;
  activeStation: { id: number; codigo: string; nome: string } | null;
  canViewAllStations: boolean;
  stations: StationGroup[];
  unassigned: TecnicoRow[];
  totalTecnicos: number;
};

type AusenciaItem = {
  id: number;
  tecnicoKey: string;
  tecnicoNome: string;
  tipo: "ferias" | "ausencia";
  dataInicio: string;
  dataFim: string;
  motivo: string | null;
};

type AusenciasPayload = {
  ausencias: AusenciaItem[];
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function emptyPayload(): TecnicosPayload {
  return {
    activeStationId: null,
    activeStation: null,
    canViewAllStations: false,
    stations: [],
    unassigned: [],
    totalTecnicos: 0,
  };
}

export default function TecnicosPage() {
  const [payload, setPayload] = useState<TecnicosPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState("");
  const [selectedTecnico, setSelectedTecnico] = useState<string>("");
  const [ausencias, setAusencias] = useState<AusenciaItem[]>([]);
  const [ausenciasLoading, setAusenciasLoading] = useState(false);
  const [ausenciasError, setAusenciasError] = useState("");
  const [savingAusencia, setSavingAusencia] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({
    tipo: "ferias" as "ferias" | "ausencia",
    dataInicio: "",
    dataFim: "",
    motivo: "",
  });

  const loadTecnicos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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

      setPayload(data as TecnicosPayload);
    } catch (err) {
      setPayload(emptyPayload());
      setError(err instanceof Error ? err.message : "Erro ao carregar técnicos.");
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    void loadTecnicos();
  }, [loadTecnicos]);

  const loadAusencias = useCallback(async (tecnicoNome: string) => {
    setAusenciasLoading(true);
    setAusenciasError("");
    try {
      const params = new URLSearchParams({ tecnicoNome });
      const res = await fetch(`/api/tecnicos/ausencias?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as AusenciasPayload | { error?: string } | null;
      if (!res.ok) {
        throw new Error((data as { error?: string } | null)?.error || "Erro ao carregar ausências.");
      }
      setAusencias(Array.isArray((data as AusenciasPayload).ausencias) ? (data as AusenciasPayload).ausencias : []);
    } catch (err) {
      setAusencias([]);
      setAusenciasError(err instanceof Error ? err.message : "Erro ao carregar ausências.");
    } finally {
      setAusenciasLoading(false);
    }
  }, []);

  const openTecnicoModal = useCallback((tecnicoNome: string) => {
    setSelectedTecnico(tecnicoNome);
    const today = new Date();
    const todayText = toDateInput(today.toISOString());
    setAbsenceForm({ tipo: "ferias", dataInicio: todayText, dataFim: todayText, motivo: "" });
    void loadAusencias(tecnicoNome);
  }, [loadAusencias]);

  const closeTecnicoModal = useCallback(() => {
    setSelectedTecnico("");
    setAusencias([]);
    setAusenciasError("");
  }, []);

  const saveAusencia = useCallback(async () => {
    if (!selectedTecnico) return;
    if (!absenceForm.dataInicio || !absenceForm.dataFim) {
      setAusenciasError("Preenche data início e data fim.");
      return;
    }

    setSavingAusencia(true);
    setAusenciasError("");
    try {
      const res = await fetch("/api/tecnicos/ausencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tecnicoNome: selectedTecnico,
          tipo: absenceForm.tipo,
          dataInicio: absenceForm.dataInicio,
          dataFim: absenceForm.dataFim,
          motivo: absenceForm.motivo,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Não foi possível guardar.");
      await loadAusencias(selectedTecnico);
    } catch (err) {
      setAusenciasError(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setSavingAusencia(false);
    }
  }, [selectedTecnico, absenceForm, loadAusencias]);

  const removeAusencia = useCallback(async (id: number) => {
    if (!selectedTecnico) return;
    try {
      const res = await fetch(`/api/tecnicos/ausencias?id=${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Não foi possível remover.");
      await loadAusencias(selectedTecnico);
    } catch (err) {
      setAusenciasError(err instanceof Error ? err.message : "Não foi possível remover.");
    }
  }, [selectedTecnico, loadAusencias]);

  const totalStations = payload.stations.length;
  const totalActive = useMemo(
    () => payload.stations.reduce((acc, station) => acc + station.tecnicos.filter((tecnico) => tecnico.ativo).length, 0) + payload.unassigned.filter((tecnico) => tecnico.ativo).length,
    [payload]
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="app-hero-panel flex flex-col gap-4 rounded-2xl p-6 text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">Orey Técnica</p>
              <h1 className="mt-2 text-3xl font-bold">Técnicos</h1>
              <p className="mt-2 max-w-3xl text-sm text-sky-100">
                Lista dos técnicos afetos a cada estação de serviço, respeitando a estação ativa selecionada na aplicação.
              </p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3 text-sm text-sky-50 ring-1 ring-white/20">
              {payload.activeStation
                ? `Estação ativa: ${payload.activeStation.nome}`
                : payload.canViewAllStations
                  ? "Vista global: todas as estações"
                  : "Sem estação ativa explícita"}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Técnicos totais", value: payload.totalTecnicos },
              { label: "Técnicos ativos", value: totalActive },
              { label: "Estações visíveis", value: totalStations },
              { label: "Sem estação", value: payload.unassigned.length },
            ].map((item) => (
              <div key={item.label} className="app-hero-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100">{item.label}</p>
                <p className="mt-2 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Diretório de técnicos</h2>
              <p className="text-sm text-slate-500">Pesquisa por nome ou email e consulta o agrupamento por estação.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadTecnicos()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Atualizar lista
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[2fr,auto]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar técnico por nome ou email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
              Mostrar inativos
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              A carregar técnicos...
            </div>
          ) : payload.stations.length === 0 && payload.unassigned.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Não há técnicos para mostrar com os filtros atuais.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {payload.stations.map((station) => (
                <div key={station.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{station.nome}</h3>
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800">
                          {station.codigo}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {[station.empresa, station.localizacao, station.regiaoOperacional].filter(Boolean).join(" · ") || "Sem detalhe adicional"}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{station.totalTecnicos} técnico(s)</div>
                  </div>

                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left text-slate-600">
                          <th className="px-3 py-2 font-semibold">Nome</th>
                          <th className="px-3 py-2 font-semibold">Email</th>
                          <th className="px-3 py-2 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {station.tecnicos.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">
                              Sem técnicos registados nesta estação.
                            </td>
                          </tr>
                        ) : (
                          station.tecnicos.map((tecnico) => (
                            <tr key={tecnico.id}>
                              <td className="px-3 py-3 font-medium text-slate-900">
                                <button
                                  type="button"
                                  onClick={() => openTecnicoModal(tecnico.nome)}
                                  className="rounded px-1 py-0.5 text-left text-blue-700 transition hover:bg-blue-50 hover:underline"
                                  title="Gerir ausências/férias"
                                >
                                  {tecnico.nome}
                                </button>
                              </td>
                              <td className="px-3 py-3 text-slate-600">{tecnico.email || "—"}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tecnico.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                                  {tecnico.ativo ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {payload.unassigned.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
                  <div className="border-b border-amber-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Sem estação atribuída</h3>
                        <p className="mt-1 text-sm text-slate-500">Técnicos ativos na base de dados sem afetação a uma estação de serviço.</p>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{payload.unassigned.length} técnico(s)</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left text-slate-600">
                          <th className="px-3 py-2 font-semibold">Nome</th>
                          <th className="px-3 py-2 font-semibold">Email</th>
                          <th className="px-3 py-2 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payload.unassigned.map((tecnico) => (
                          <tr key={tecnico.id}>
                            <td className="px-3 py-3 font-medium text-slate-900">
                              <button
                                type="button"
                                onClick={() => openTecnicoModal(tecnico.nome)}
                                className="rounded px-1 py-0.5 text-left text-blue-700 transition hover:bg-blue-50 hover:underline"
                                title="Gerir ausências/férias"
                              >
                                {tecnico.nome}
                              </button>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{tecnico.email || "—"}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tecnico.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                                {tecnico.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {selectedTecnico ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={closeTecnicoModal}>
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ausências e férias</h3>
                <p className="text-sm text-slate-500">Técnico: <span className="font-semibold text-slate-700">{selectedTecnico}</span></p>
              </div>
              <button type="button" onClick={closeTecnicoModal} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Fechar</button>
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
              <select
                value={absenceForm.tipo}
                onChange={(event) => setAbsenceForm((current) => ({ ...current, tipo: event.target.value as "ferias" | "ausencia" }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ferias">Férias</option>
                <option value="ausencia">Ausência</option>
              </select>
              <input
                type="date"
                value={absenceForm.dataInicio}
                onChange={(event) => setAbsenceForm((current) => ({ ...current, dataInicio: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={absenceForm.dataFim}
                onChange={(event) => setAbsenceForm((current) => ({ ...current, dataFim: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveAusencia()}
                disabled={savingAusencia}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAusencia ? "A guardar..." : "Guardar"}
              </button>
              <input
                type="text"
                value={absenceForm.motivo}
                onChange={(event) => setAbsenceForm((current) => ({ ...current, motivo: event.target.value }))}
                placeholder="Motivo (opcional)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-4"
              />
            </div>

            {ausenciasError ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{ausenciasError}</div> : null}

            <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">Início</th>
                    <th className="px-3 py-2 font-semibold">Fim</th>
                    <th className="px-3 py-2 font-semibold">Motivo</th>
                    <th className="px-3 py-2 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {ausenciasLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">A carregar...</td>
                    </tr>
                  ) : ausencias.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">Sem registos para este técnico.</td>
                    </tr>
                  ) : (
                    ausencias.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${item.tipo === "ferias" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>
                            {item.tipo === "ferias" ? "Férias" : "Ausência"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{toDateInput(item.dataInicio)}</td>
                        <td className="px-3 py-2 text-slate-700">{toDateInput(item.dataFim)}</td>
                        <td className="px-3 py-2 text-slate-600">{item.motivo || "—"}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => void removeAusencia(item.id)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
