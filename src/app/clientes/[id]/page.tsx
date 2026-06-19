"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CLIENTE_PAYMENT_MODE_OPTIONS } from "@/lib/cliente-payment-options";
import { NAVIO_TIPO_NAVIO_OPTIONS, NAVIO_TIPO_PESCA_OPTIONS } from "@/lib/navio-legal-types";
import { sortNaviosAlphabetically } from "@/lib/navios-sort";

type Navio = {
  id: number;
  nome: string;
  matricula: string;
  ilha: string | null;
  tipoPesca: string;
  clienteId?: number | null;
  cliente?: { id: number; nome: string } | null;
};

type Cliente = {
  id: number;
  nome: string;
  numeroCliente?: string | null;
  modoPagamento?: string | null;
  nif?: string | null;
  email?: string | null;
  telefone?: string | null;
  telmovel?: string | null;
  morada?: string | null;
  moradaNumero?: string | null;
  codigoPostal?: string | null;
  localidade?: string | null;
  ilha?: string | null;
  navios: Navio[];
};

type TabKey = "ficha" | "navios" | "acoes";

function normalizeNaviosResponse(payload: unknown): Navio[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Navio[];
  if (typeof payload === "object" && payload !== null && Array.isArray((payload as any).data)) {
    return (payload as any).data as Navio[];
  }
  return [];
}

export default function ClienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const clienteId = Number(params?.id);
  const [tab, setTab] = useState<TabKey>("ficha");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [allNavios, setAllNavios] = useState<Navio[]>([]);

  const [saving, setSaving] = useState(false);
  const [busyNavio, setBusyNavio] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingThirdPartySheet, setExportingThirdPartySheet] = useState(false);

  const [profileDraft, setProfileDraft] = useState({
    nome: "",
    numeroCliente: "",
    modoPagamento: "",
    ilha: "",
    morada: "",
    moradaNumero: "",
    codigoPostal: "",
    localidade: "",
    nif: "",
    email: "",
    telefone: "",
    telmovel: "",
  });

  const [profileErrors, setProfileErrors] = useState<{ nif?: string; email?: string; telefone?: string; telmovel?: string }>({});

  const [selectedNavioId, setSelectedNavioId] = useState<string>("");
  const [navioSearch, setNavioSearch] = useState<string>("");
  const [newNavio, setNewNavio] = useState({ nome: "", matricula: "", ilha: "", tipoPesca: "", tipoNavio: "" });

  const loadData = async () => {
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      setError("ID de cliente inválido.");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [clienteRes, naviosRes] = await Promise.all([
        fetch(`/api/clientes/${clienteId}`),
        fetch("/api/navios"),
      ]);

      if (!clienteRes.ok) {
        const payload = await clienteRes.json().catch(() => ({}));
        throw new Error(payload?.error || "Não foi possível carregar o cliente.");
      }
      if (!naviosRes.ok) {
        throw new Error("Não foi possível carregar navios.");
      }

      const clienteData = (await clienteRes.json()) as Cliente;
      const naviosData = await naviosRes.json();

      setCliente(clienteData);
      setAllNavios(sortNaviosAlphabetically(normalizeNaviosResponse(naviosData)));
      setProfileDraft({
        nome: clienteData.nome || "",
        numeroCliente: clienteData.numeroCliente || "",
        modoPagamento: clienteData.modoPagamento || "",
        ilha: clienteData.ilha || "",
        morada: clienteData.morada || "",
        moradaNumero: clienteData.moradaNumero || "",
        codigoPostal: clienteData.codigoPostal || "",
        localidade: clienteData.localidade || "",
        nif: clienteData.nif || "",
        email: clienteData.email || "",
        telefone: clienteData.telefone || "",
        telmovel: clienteData.telmovel || "",
      });
      setNewNavio((prev) => ({ ...prev, ilha: clienteData.ilha || prev.ilha || "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados do cliente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clienteId]);

  const formatNumeroCliente = (c: Cliente) => {
    const numero = (c.numeroCliente || "").trim();
    return numero || `CLI-${String(c.id).padStart(5, "0")}`;
  };

  const validateField = (field: "nif" | "email" | "telefone" | "telmovel", value: string) => {
    const trimmed = value.trim();
    if (field === "nif" && trimmed && !/^\d{9}$/.test(trimmed)) return "NIF deve conter 9 dígitos.";
    if (field === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Email inválido.";
    if ((field === "telefone" || field === "telmovel") && trimmed && !/^[0-9+\s()-]{6,20}$/.test(trimmed)) {
      return `${field === "telefone" ? "Telefone" : "Telemóvel"} inválido.`;
    }
    return "";
  };

  const updateProfileField = (field: keyof typeof profileDraft, value: string) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));

    if (field === "nif" || field === "email" || field === "telefone" || field === "telmovel") {
      const msg = validateField(field, value);
      setProfileErrors((prev) => ({ ...prev, [field]: msg || undefined }));
    }
  };

  const saveProfile = async () => {
    if (!cliente) return;
    if (!profileDraft.nome.trim()) {
      alert("Nome do cliente é obrigatório.");
      return;
    }

    if (Object.values(profileErrors).some(Boolean)) {
      alert("Corrija os campos inválidos antes de guardar.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileDraft),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Não foi possível guardar a ficha.");
      }

      await loadData();
      alert("Ficha do cliente atualizada com sucesso.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao guardar ficha.");
    } finally {
      setSaving(false);
    }
  };

  const filteredNavios = useMemo(() => {
    const q = navioSearch.trim().toLowerCase();
    const base = allNavios.filter((n) => n.id !== undefined && n.id !== null);
    if (!q) return base;
    return base.filter((n) => {
      const nome = (n.nome || "").toLowerCase();
      const matricula = (n.matricula || "").toLowerCase();
      const clienteNome = (n.cliente?.nome || "").toLowerCase();
      return nome.includes(q) || matricula.includes(q) || clienteNome.includes(q);
    });
  }, [allNavios, navioSearch]);

  const associateNavio = async () => {
    if (!cliente) return;
    const navioId = Number(selectedNavioId);
    if (!navioId) return;

    const navio = allNavios.find((n) => n.id === navioId);
    if (!navio) {
      alert("Navio não encontrado.");
      return;
    }

    if (navio.cliente?.id && navio.cliente.id !== cliente.id) {
      const ok = window.confirm(`O navio ${navio.nome} está associado a ${navio.cliente.nome}. Pretende reatribuir?`);
      if (!ok) return;
    }

    try {
      setBusyNavio(true);
      const res = await fetch(`/api/navios/${navioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: cliente.id }),
      });

      if (!res.ok) throw new Error("Falha ao associar navio.");

      setSelectedNavioId("");
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao associar navio.");
    } finally {
      setBusyNavio(false);
    }
  };

  const disassociateNavio = async (navioId: number) => {
    try {
      setBusyNavio(true);
      const res = await fetch(`/api/navios/${navioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: null }),
      });

      if (!res.ok) throw new Error("Falha ao desassociar navio.");
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao desassociar navio.");
    } finally {
      setBusyNavio(false);
    }
  };

  const createAndAssociateNavio = async () => {
    if (!cliente) return;
    const nome = newNavio.nome.trim();
    if (!nome) {
      alert("Nome do navio é obrigatório.");
      return;
    }

    try {
      setBusyNavio(true);
      const res = await fetch("/api/navios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          matricula: newNavio.matricula.trim() || "N/D",
          ilha: newNavio.ilha.trim() || undefined,
          tipoPesca: newNavio.tipoPesca.trim() || "N/D",
          tipoNavio: newNavio.tipoNavio.trim() || "N/D",
          clienteId: cliente.id,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Não foi possível criar o navio.");
      }

      setNewNavio({ nome: "", matricula: "", ilha: cliente.ilha || "", tipoPesca: "", tipoNavio: "" });
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao criar navio.");
    } finally {
      setBusyNavio(false);
    }
  };

  const deleteCliente = async () => {
    if (!cliente) return;
    const ok = window.confirm(`Tem a certeza que deseja excluir o cliente "${cliente.nome}"?`);
    if (!ok) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Não foi possível excluir o cliente.");
      }

      router.push("/clientes");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir cliente.");
    } finally {
      setDeleting(false);
    }
  };

  const generateClienteExcel = async () => {
    if (!cliente) return;

    try {
      setExportingThirdPartySheet(true);
      const response = await fetch(`/api/clientes/${cliente.id}/ficha-terceiro`);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Não foi possível gerar a ficha de cliente em Excel.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = response.headers.get('content-disposition') || '';
      const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
      anchor.href = url;
      anchor.download = fileNameMatch?.[1] || `criacao_terceiros_cliente_${cliente.id}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao gerar ficha de cliente em Excel.');
    } finally {
      setExportingThirdPartySheet(false);
    }
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-600">A carregar ficha do cliente...</div>;
  }

  if (error || !cliente) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error || "Cliente não encontrado."}
        </div>
        <div className="mt-4">
          <Link href="/clientes" className="text-sm font-medium text-blue-700 hover:underline">← Voltar a Clientes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <Link href="/clientes" className="text-xs text-blue-700 hover:underline">← Voltar a Clientes</Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{cliente.nome}</h1>
              <p className="text-sm text-gray-600">Nº Cliente: {formatNumeroCliente(cliente)} · Ilha: {cliente.ilha || "—"}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={generateClienteExcel}
                disabled={exportingThirdPartySheet}
                className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {exportingThirdPartySheet ? 'A gerar Excel...' : 'Gerar ficha de cliente'}
              </button>
              <div className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
                {cliente.navios.length} navio{cliente.navios.length !== 1 ? "s" : ""} associado{cliente.navios.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex gap-2">
            {([
              { key: "ficha", label: "Ficha" },
              { key: "navios", label: "Navios" },
              { key: "acoes", label: "Ações" },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${tab === item.key ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-700 border-gray-300"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "ficha" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Ficha do Cliente</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">Cliente
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.nome} onChange={(e) => updateProfileField("nome", e.target.value)} />
              </label>
              <label className="text-xs text-gray-600">Nº Cliente
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.numeroCliente} onChange={(e) => updateProfileField("numeroCliente", e.target.value)} placeholder="Ex: CLI-00021" />
              </label>
              <label className="text-xs text-gray-600">Modo de Pagamento
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.modoPagamento} onChange={(e) => updateProfileField("modoPagamento", e.target.value)} list="cliente-modo-pagamento-options" placeholder="Ex: Crédito 30 dias" />
              </label>
              <label className="text-xs text-gray-600">Ilha
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.ilha} onChange={(e) => updateProfileField("ilha", e.target.value)} />
              </label>
              <label className="text-xs text-gray-600 sm:col-span-2">Morada
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.morada} onChange={(e) => updateProfileField("morada", e.target.value)} />
              </label>
              <label className="text-xs text-gray-600">Nº Porta
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.moradaNumero} onChange={(e) => updateProfileField("moradaNumero", e.target.value)} />
              </label>
              <label className="text-xs text-gray-600">Código Postal
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.codigoPostal} onChange={(e) => updateProfileField("codigoPostal", e.target.value)} placeholder="0000-000" />
              </label>
              <label className="text-xs text-gray-600 sm:col-span-2">Localidade
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.localidade} onChange={(e) => updateProfileField("localidade", e.target.value)} placeholder="Localidade" />
              </label>
              <label className="text-xs text-gray-600">NIF
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.nif} onChange={(e) => updateProfileField("nif", e.target.value)} />
                {profileErrors.nif && <p className="mt-1 text-xs text-red-600">{profileErrors.nif}</p>}
              </label>
              <label className="text-xs text-gray-600">Email
                <input type="email" className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.email} onChange={(e) => updateProfileField("email", e.target.value)} />
                {profileErrors.email && <p className="mt-1 text-xs text-red-600">{profileErrors.email}</p>}
              </label>
              <label className="text-xs text-gray-600">Telefone
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.telefone} onChange={(e) => updateProfileField("telefone", e.target.value)} />
                {profileErrors.telefone && <p className="mt-1 text-xs text-red-600">{profileErrors.telefone}</p>}
              </label>
              <label className="text-xs text-gray-600">Telemóvel
                <input className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={profileDraft.telmovel} onChange={(e) => updateProfileField("telmovel", e.target.value)} />
                {profileErrors.telmovel && <p className="mt-1 text-xs text-red-600">{profileErrors.telmovel}</p>}
              </label>
            </div>

            <datalist id="cliente-modo-pagamento-options">
              {CLIENTE_PAYMENT_MODE_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>

            <div className="mt-4 flex justify-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateClienteExcel}
                  disabled={exportingThirdPartySheet}
                  className="px-4 py-2 rounded-md bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-50"
                >
                  {exportingThirdPartySheet ? 'A gerar Excel...' : 'Exportar Excel CRIAÇÃO DE TERCEIROS'}
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || Object.values(profileErrors).some(Boolean)}
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "navios" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Navios associados</h2>
              {cliente.navios.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum navio associado.</p>
              ) : (
                <ul className="space-y-2">
                  {cliente.navios.map((navio) => (
                    <li key={navio.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{navio.nome}</p>
                        <p className="text-xs text-gray-500">{navio.matricula} · {navio.ilha || "—"} · {navio.tipoPesca || "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => disassociateNavio(navio.id)}
                        disabled={busyNavio}
                        className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        Desassociar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Associar navio existente</h3>
              <input
                type="text"
                value={navioSearch}
                onChange={(e) => setNavioSearch(e.target.value)}
                placeholder="Procurar por nome, matrícula ou cliente"
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
              />
              <div className="flex gap-2">
                <select
                  value={selectedNavioId}
                  onChange={(e) => setSelectedNavioId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecionar navio...</option>
                  {filteredNavios.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nome} ({n.matricula}){n.cliente?.nome ? ` — Associado a: ${n.cliente.nome}` : " — Disponível"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={associateNavio}
                  disabled={!selectedNavioId || busyNavio}
                  className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  Associar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Criar e associar novo navio</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Nome do navio *"
                  value={newNavio.nome}
                  onChange={(e) => setNewNavio((prev) => ({ ...prev, nome: e.target.value }))}
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Matrícula"
                  value={newNavio.matricula}
                  onChange={(e) => setNewNavio((prev) => ({ ...prev, matricula: e.target.value }))}
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Ilha"
                  value={newNavio.ilha}
                  onChange={(e) => setNewNavio((prev) => ({ ...prev, ilha: e.target.value }))}
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Enquadramento legal"
                  value={newNavio.tipoPesca}
                  onChange={(e) => setNewNavio((prev) => ({ ...prev, tipoPesca: e.target.value }))}
                  list="cliente-detalhe-tipo-pesca-opcoes"
                />
                <input
                  className="border rounded-md px-3 py-2 text-sm"
                  placeholder="Tipo de embarcação"
                  value={newNavio.tipoNavio}
                  onChange={(e) => setNewNavio((prev) => ({ ...prev, tipoNavio: e.target.value }))}
                  list="cliente-detalhe-tipo-navio-opcoes"
                />
              </div>
              <datalist id="cliente-detalhe-tipo-pesca-opcoes">
                {NAVIO_TIPO_PESCA_OPTIONS.map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
              <datalist id="cliente-detalhe-tipo-navio-opcoes">
                {NAVIO_TIPO_NAVIO_OPTIONS.map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={createAndAssociateNavio}
                  disabled={busyNavio}
                  className="px-3 py-2 rounded-md bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
                >
                  {busyNavio ? "A processar..." : "Criar e associar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "acoes" && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ações do cliente</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use com cautela. A exclusão remove o cliente e pode impactar associações atuais.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/clientes"
                className="px-3 py-2 rounded-md bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-200"
              >
                Voltar à lista
              </Link>
              <button
                type="button"
                onClick={deleteCliente}
                disabled={deleting}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "A excluir..." : "Excluir cliente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
