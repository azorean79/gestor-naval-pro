"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolveEpirbManuals } from "@/modules/epirbs/manualResolver";
import { sortNaviosAlphabetically } from "@/lib/navios-sort";

type Epirb = {
  id: number;
  shipId?: number | null;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  tipo?: string | null;
  hexId?: string | null;
  estado?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  dataValidadeBateria?: string | null;
  ownerName?: string | null;
  ownerAddress?: string | null;
  ownerPhone?: string | null;
  emergencyContact1Name?: string | null;
  emergencyContact1Phone?: string | null;
  emergencyContact2Name?: string | null;
  emergencyContact2Phone?: string | null;
  observacoes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  navio?: Navio | null;
  dossier?: EpirbDossier;
};

type Cliente = {
  id?: number;
  nome?: string | null;
  telefone?: string | null;
  telmovel?: string | null;
  morada?: string | null;
  moradaNumero?: string | null;
  codigoPostal?: string | null;
  localidade?: string | null;
  ilha?: string | null;
};

type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
  mmsi?: string | null;
  callSignal?: string | null;
  proprietario?: string | null;
  cliente?: Cliente | null;
};

type EpirbDossierSummary = {
  hasShipAssociation?: boolean;
  hasHexId?: boolean;
  criticalCount?: number;
  warningCount?: number;
  manualCount?: number;
  statusHealth?: "critical" | "warning" | "ok" | "info";
  statusLabel?: string;
  nextDeadline?: {
    id: string;
    title: string;
    entityLabel: string;
    date: string;
    daysRemaining: number | null;
    severity: "critical" | "warning" | "ok" | "info";
    status: string;
    href?: string;
    source: string;
  } | null;
  lastInspectionAt?: string | null;
  lastActivityAt?: string | null;
};

type EpirbDossierTimelineItem = {
  id: string;
  kind: string;
  title: string;
  description: string;
  entityType: "epirb" | "navio";
  entityLabel: string;
  date: string | null;
  status: string;
  severity: "critical" | "warning" | "ok" | "info";
  href?: string;
  source: string;
};

type EpirbDossierDocument = {
  id: string;
  title: string;
  documentType: string;
  entityType: "epirb";
  entityLabel: string;
  reference?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  status: string;
  severity: "critical" | "warning" | "ok" | "info";
  href: string;
  source: string;
};

type EpirbDossierDeadline = {
  id: string;
  title: string;
  entityType: "epirb" | "navio";
  entityLabel: string;
  date: string;
  daysRemaining: number | null;
  severity: "critical" | "warning" | "ok" | "info";
  status: string;
  href: string;
  source: string;
};

type EpirbDossier = {
  summary?: EpirbDossierSummary;
  timeline?: EpirbDossierTimelineItem[];
  documents?: EpirbDossierDocument[];
  deadlines?: EpirbDossierDeadline[];
};

function normalizeDateInput(value: string | null | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined) {
  const normalized = normalizeDateInput(value);
  if (!normalized) return "—";
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT");
}

function buildOwnerAddress(cliente?: Cliente | null) {
  if (!cliente) return "";
  return [
    [cliente.morada, cliente.moradaNumero].filter(Boolean).join(", "),
    [cliente.codigoPostal, cliente.localidade].filter(Boolean).join(" "),
    cliente.ilha,
  ].filter(Boolean).join(" · ");
}

function formatDaysRemaining(value: number | null | undefined) {
  if (value === null || value === undefined) return "Sem data";
  if (value < 0) return `${Math.abs(value)} dias em atraso`;
  if (value === 0) return "Vence hoje";
  if (value === 1) return "1 dia restante";
  return `${value} dias restantes`;
}

function severityClasses(value: "critical" | "warning" | "ok" | "info" | undefined) {
  switch (value) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function timelineKindClasses(kind: string) {
  if (kind === "inspection") return "border-violet-200 bg-violet-50 text-violet-700";
  if (kind === "deadline") return "border-amber-200 bg-amber-50 text-amber-700";
  if (kind === "association") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function EpirbFichaPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params && typeof params === "object" ? (params as Record<string, string | string[]>).id : undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [epirb, setEpirb] = useState<Epirb | null>(null);
  const [form, setForm] = useState<Epirb | null>(null);
  const [navios, setNavios] = useState<Navio[]>([]);
  const [shipDetails, setShipDetails] = useState<Navio | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAll() {
      if (!id) return;
      setLoading(true);
      try {
        const [epirbRes, naviosRes] = await Promise.all([
          fetch(`/api/epirbs/${encodeURIComponent(id)}`, { cache: "no-store" }),
          fetch("/api/navios", { cache: "no-store" }),
        ]);

        const epirbData = epirbRes.ok ? await epirbRes.json() : null;
        const naviosRaw = naviosRes.ok ? await naviosRes.json() : [];
        const naviosData = Array.isArray(naviosRaw?.data) ? naviosRaw.data : naviosRaw;

        if (!active) return;

        setEpirb(epirbData);
        setForm(epirbData);
        setNavios(Array.isArray(naviosData) ? sortNaviosAlphabetically(naviosData) : []);

        if (epirbData?.shipId) {
          const shipRes = await fetch(`/api/navios/${encodeURIComponent(String(epirbData.shipId))}`, { cache: "no-store" });
          const shipData = shipRes.ok ? await shipRes.json() : null;
          if (active) setShipDetails(shipData);
        } else {
          setShipDetails(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAll();
    return () => {
      active = false;
    };
  }, [id]);

  const navioById = useMemo(() => {
    const map = new Map<number, Navio>();
    navios.forEach((navio) => map.set(navio.id, navio));
    return map;
  }, [navios]);

  function handleChange(field: keyof Epirb, value: string) {
    setForm((prev) => ({ ...(prev || {}), [field]: value } as Epirb));
  }

  async function handleSave() {
    if (!id || !form) return;
    if (!String(form.serial || "").trim()) {
      alert("Nº de série do EPIRB é obrigatório.");
      return;
    }

    setSaving(true);
    const payload = {
      shipId: form.shipId ? Number(form.shipId) : null,
      serial: String(form.serial || "").trim(),
      marca: form.marca ? String(form.marca).trim() : null,
      modelo: form.modelo ? String(form.modelo).trim() : null,
      tipo: form.tipo ? String(form.tipo).trim() : null,
      hexId: form.hexId ? String(form.hexId).trim() : null,
      estado: form.estado ? String(form.estado).trim() : "Ativo",
      dataInspecao: form.dataInspecao ? normalizeDateInput(form.dataInspecao) : null,
      dataProxInspecao: form.dataProxInspecao ? normalizeDateInput(form.dataProxInspecao) : null,
      dataValidadeBateria: form.dataValidadeBateria ? normalizeDateInput(form.dataValidadeBateria) : null,
      ownerName: form.ownerName ? String(form.ownerName).trim() : null,
      ownerAddress: form.ownerAddress ? String(form.ownerAddress).trim() : null,
      ownerPhone: form.ownerPhone ? String(form.ownerPhone).trim() : null,
      emergencyContact1Name: form.emergencyContact1Name ? String(form.emergencyContact1Name).trim() : null,
      emergencyContact1Phone: form.emergencyContact1Phone ? String(form.emergencyContact1Phone).trim() : null,
      emergencyContact2Name: form.emergencyContact2Name ? String(form.emergencyContact2Name).trim() : null,
      emergencyContact2Phone: form.emergencyContact2Phone ? String(form.emergencyContact2Phone).trim() : null,
      observacoes: form.observacoes ? String(form.observacoes).trim() : null,
    };

    const res = await fetch(`/api/epirbs/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Não foi possível guardar a ficha do EPIRB.");
      setSaving(false);
      return;
    }

    const updated = await res.json();
    const refreshedRes = await fetch(`/api/epirbs/${encodeURIComponent(id)}`, { cache: "no-store" });
    const refreshed = refreshedRes.ok ? await refreshedRes.json() : updated;
    setEpirb(refreshed);
    setForm(refreshed);
    setEdit(false);
    setSaving(false);

    if (refreshed?.shipId) {
      const shipRes = await fetch(`/api/navios/${encodeURIComponent(String(refreshed.shipId))}`, { cache: "no-store" });
      setShipDetails(shipRes.ok ? await shipRes.json() : null);
    } else {
      setShipDetails(null);
    }
  }

  async function handleDelete() {
    if (!id || !epirb) return;
    if (!window.confirm(`Eliminar o EPIRB ${epirb.serial || `#${epirb.id}`}?`)) return;

    const res = await fetch(`/api/epirbs/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Não foi possível eliminar o EPIRB.");
      return;
    }

    router.push("/epirbs");
  }

  if (loading) return <div className="p-8">A carregar ficha do EPIRB...</div>;
  if (!epirb || !form) {
    return <div className="p-8 text-red-600">EPIRB não encontrado.</div>;
  }

  const selectedNavio = form.shipId ? (shipDetails || navioById.get(Number(form.shipId)) || null) : null;
  const ownerNameResolved = String(form.ownerName || selectedNavio?.proprietario || selectedNavio?.cliente?.nome || "").trim();
  const ownerAddressResolved = String(form.ownerAddress || buildOwnerAddress(selectedNavio?.cliente) || "").trim();
  const ownerPhoneResolved = String(form.ownerPhone || selectedNavio?.cliente?.telefone || selectedNavio?.cliente?.telmovel || "").trim();
  const manualData = resolveEpirbManuals(form.marca, form.modelo);
  const dossier = epirb.dossier;
  const dossierSummary = dossier?.summary;
  const dossierTimeline = Array.isArray(dossier?.timeline) ? dossier.timeline.slice(0, 8) : [];
  const dossierDocuments = Array.isArray(dossier?.documents) ? dossier.documents : [];
  const dossierDeadlines = Array.isArray(dossier?.deadlines) ? dossier.deadlines.slice(0, 4) : [];
  const dossierCards = [
    {
      label: "Estado operacional",
      value: dossierSummary?.statusLabel || "Sem leitura",
      hint: dossierSummary?.statusHealth === "critical"
        ? "Há prazos vencidos ou urgentes no beacon"
        : dossierSummary?.statusHealth === "warning"
          ? "Existem dados para completar"
          : "Sem alertas relevantes agora",
    },
    {
      label: "Navio associado",
      value: dossierSummary?.hasShipAssociation ? (selectedNavio?.nome || "Associado") : "Sem navio",
      hint: dossierSummary?.hasShipAssociation ? "Ligação operacional ativa" : "Convém ligar o beacon ao navio",
    },
    {
      label: "HEX ID",
      value: dossierSummary?.hasHexId ? (form.hexId || "Registado") : "Em falta",
      hint: dossierSummary?.hasHexId ? "Identificador operacional presente" : "Campo essencial ainda vazio",
    },
    {
      label: "Documentação técnica",
      value: `${dossierDocuments.length}`,
      hint: `${dossierSummary?.manualCount ?? dossierDocuments.length} manual(is) ligados ao modelo`,
    },
  ] as const;

  const stateBadge = String(form.estado || "").toLowerCase().includes("inativo")
    ? "bg-red-100 text-red-700"
    : String(form.estado || "").toLowerCase().includes("manuten")
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="min-h-screen bg-slate-50 py-8" suppressHydrationWarning>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-violet-950">Ficha do EPIRB</h1>
              <p className="mt-1 text-sm text-violet-800">Registo do beacon, associação ao navio e dados de emergência do armador.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateBadge}`}>Estado: {form.estado || "—"}</span>
              <Link href="/epirbs" className="text-sm font-medium text-blue-700 underline">← Voltar para EPIRBs</Link>
              {!edit ? (
                <button type="button" onClick={() => setEdit(true)} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-500">Editar</button>
              ) : (
                <>
                  <button type="button" onClick={handleSave} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? "A guardar..." : "Gravar"}</button>
                  <button type="button" onClick={() => { setForm(epirb); setEdit(false); }} className="rounded-lg bg-slate-200 px-4 py-2 text-sm">Cancelar</button>
                </>
              )}
              <button type="button" onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dossiê do EPIRB</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Timeline e saúde operacional</h2>
              <p className="mt-1 text-sm text-slate-600">Inspeções, bateria, associação ao navio e biblioteca técnica num único ponto.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => document.getElementById("section-epirb-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Ver timeline
              </button>
              <button type="button" onClick={() => document.getElementById("section-epirb-docs")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-100">
                Abrir documentos
              </button>
              {selectedNavio?.id ? (
                <Link href={`/navios/${selectedNavio.id}`} className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100">
                  Abrir navio
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dossierCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-600">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div id="section-epirb-timeline" className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Timeline unificada</h3>
                  <p className="mt-1 text-xs text-slate-500">Eventos do EPIRB, prazos e histórico do navio associado.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{dossierTimeline.length} registo(s)</span>
              </div>

              <div className="mt-4 space-y-3">
                {dossierTimeline.length > 0 ? dossierTimeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${timelineKindClasses(item.kind)}`}>
                            {item.status || item.kind}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{item.description || item.source}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{item.entityLabel} · {item.source}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>{formatDate(item.date)}</p>
                        {item.href ? <Link href={item.href} className="mt-1 inline-flex font-medium text-blue-700 hover:underline">Abrir</Link> : null}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Ainda não existem eventos suficientes para compor a timeline deste EPIRB.
                  </div>
                )}
              </div>
            </div>

            <div id="section-epirb-docs" className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Documentação técnica</h3>
                <div className="mt-3 space-y-3">
                  {dossierDocuments.length > 0 ? dossierDocuments.map((doc) => (
                    <a key={doc.id} href={doc.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-cyan-100 bg-cyan-50 p-3 hover:bg-cyan-100 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{doc.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{doc.reference || doc.documentType}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{doc.source}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityClasses(doc.severity)}`}>{doc.status}</span>
                      </div>
                    </a>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Sem documentos técnicos registados no dossier deste EPIRB.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Prazos em seguimento</h3>
                <div className="mt-3 space-y-3">
                  {dossierDeadlines.length > 0 ? dossierDeadlines.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.entityLabel} · {item.source}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityClasses(item.severity)}`}>
                          {formatDaysRemaining(item.daysRemaining)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{formatDate(item.date)}</p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Sem prazos monitorizados para este EPIRB.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Dados gerais</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Nº Série</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.serial || ""} onChange={(e) => handleChange("serial", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.serial || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Marca</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.marca || ""} onChange={(e) => handleChange("marca", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.marca || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Modelo</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.modelo || ""} onChange={(e) => handleChange("modelo", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.modelo || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Tipo</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.tipo || ""} onChange={(e) => handleChange("tipo", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.tipo || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">HEX ID</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.hexId || ""} onChange={(e) => handleChange("hexId", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.hexId || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Estado</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.estado || ""} onChange={(e) => handleChange("estado", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{form.estado || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Navio associado</label>
                {edit ? (
                  <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.shipId ? String(form.shipId) : ""} onChange={(e) => handleChange("shipId", e.target.value)}>
                    <option value="">Sem navio associado</option>
                    {navios.map((navio) => <option key={navio.id} value={navio.id}>{navio.nome}{navio.matricula ? ` (${navio.matricula})` : ""}</option>)}
                  </select>
                ) : selectedNavio ? (
                  <Link href={`/navios/${selectedNavio.id}`} className="mt-1 inline-block text-sm font-medium text-blue-700 underline">{selectedNavio.nome}</Link>
                ) : <p className="mt-1 text-sm font-medium text-slate-900">Sem navio associado</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Data validade bateria</label>
                {edit ? <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={normalizeDateInput(form.dataValidadeBateria)} onChange={(e) => handleChange("dataValidadeBateria", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(form.dataValidadeBateria)}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Última inspeção</label>
                {edit ? <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={normalizeDateInput(form.dataInspecao)} onChange={(e) => handleChange("dataInspecao", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(form.dataInspecao)}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Próxima inspeção</label>
                {edit ? <input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={normalizeDateInput(form.dataProxInspecao)} onChange={(e) => handleChange("dataProxInspecao", e.target.value)} /> : <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(form.dataProxInspecao)}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Observações</label>
                {edit ? <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={4} value={form.observacoes || ""} onChange={(e) => handleChange("observacoes", e.target.value)} /> : <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{form.observacoes || "—"}</p>}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Manual técnico</p>
              <p className="mt-1 text-sm text-cyan-900">{manualData.displayLabel || form.marca || "Marca"}</p>
              {manualData.manuals.length > 0 ? (
                <div className="mt-3 flex flex-col gap-2">
                  {manualData.manuals.map((manual) => (
                    <a key={manual.fileName} href={manual.href} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Abrir {manual.fileName}</a>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">Sem manuais mapeados.</p>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Resumo</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li><b>Criado em:</b> {formatDate(epirb.createdAt)}</li>
                <li><b>Atualizado em:</b> {formatDate(epirb.updatedAt)}</li>
                <li><b>Navio:</b> {selectedNavio?.nome || "Sem navio"}</li>
                <li><b>MMSI:</b> {selectedNavio?.mmsi || "—"}</li>
                <li><b>Call Sign:</b> {selectedNavio?.callSignal || "—"}</li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-violet-950">Dados do registo do EPIRB / embarcação</h2>
            <p className="text-sm text-violet-800 mt-1">Se algum campo ficar em branco, a ficha continua a mostrar o fallback do navio/cliente associado quando existir.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Nome da Embarcação</label>
              <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900">{selectedNavio?.nome || "—"}</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">MMSI</label>
              <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900">{selectedNavio?.mmsi || "—"}</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Call Sign</label>
              <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900">{selectedNavio?.callSignal || "—"}</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Nome do Armador / Proprietário</label>
              {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.ownerName || ""} onChange={(e) => handleChange("ownerName", e.target.value)} placeholder={selectedNavio?.proprietario || selectedNavio?.cliente?.nome || "Nome do armador"} /> : <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900">{ownerNameResolved || "—"}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Morada do Armador / Proprietário</label>
              {edit ? <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" rows={3} value={form.ownerAddress || ""} onChange={(e) => handleChange("ownerAddress", e.target.value)} placeholder={buildOwnerAddress(selectedNavio?.cliente) || "Morada do armador"} /> : <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap text-slate-900">{ownerAddressResolved || "—"}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Telefone e/ou Telemóvel do Armador / Proprietário</label>
              {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.ownerPhone || ""} onChange={(e) => handleChange("ownerPhone", e.target.value)} placeholder={selectedNavio?.cliente?.telefone || selectedNavio?.cliente?.telmovel || "Telefone/telemóvel"} /> : <p className="mt-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900">{ownerPhoneResolved || "—"}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-4">
            <h3 className="text-sm font-semibold text-violet-950">Contactos de Emergência (até dois contactos)</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Nome (1º contacto)</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.emergencyContact1Name || ""} onChange={(e) => handleChange("emergencyContact1Name", e.target.value)} /> : <p className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900">{form.emergencyContact1Name || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Telefone e/ou Telemóvel (1º contacto)</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.emergencyContact1Phone || ""} onChange={(e) => handleChange("emergencyContact1Phone", e.target.value)} /> : <p className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900">{form.emergencyContact1Phone || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Nome (2º contacto)</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.emergencyContact2Name || ""} onChange={(e) => handleChange("emergencyContact2Name", e.target.value)} /> : <p className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900">{form.emergencyContact2Name || "—"}</p>}
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Telefone e/ou Telemóvel (2º contacto)</label>
                {edit ? <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={form.emergencyContact2Phone || ""} onChange={(e) => handleChange("emergencyContact2Phone", e.target.value)} /> : <p className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-900">{form.emergencyContact2Phone || "—"}</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
