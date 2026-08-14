"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appToast } from "@/lib/app-toast";
import { getLocalDateKey } from "@/lib/date-utils";
import { 
  FileText, 
  Search, 
  Filter, 
  Clock, 
  Wrench, 
  Calendar, 
  DollarSign, 
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  X,
  ChevronDown
} from "lucide-react";

type OrdemServico = {
  id: number;
  numeroOrdem: string;
  tipo: string;
  prioridade: string;
  status: string;
  descricao: string | null;
  tecnicoResponsavel: string | null;
  dataAbertura: Date | string;
  dataPrevista: Date | string | null;
  dataConclusao: Date | string | null;
  valorTotal: number;
  valorPecas: number;
  valorMaoObra: number;
  shipId: number | null;
  jangada?: {
    id: number;
    brand?: string | null;
    model?: string | null;
    serial?: string | null;
  } | null;
  metadados?: string | null;
  dataPlaneadaInicio?: Date | string | null;
};

type Navio = {
  id: number;
  nome: string;
  ilha?: string;
};

type ClientJangada = {
  id: number;
  brand: string;
  model: string;
  serial: string;
  shipId: number;
};

interface PortalOrdensListProps {
  ordens: OrdemServico[];
  navios: Navio[];
  jangadas: ClientJangada[];
  clientes?: Array<{ id: number; nome: string; numeroCliente?: string | null }>;
}

export default function PortalOrdensList({ ordens: ordensProp, navios: naviosProp, jangadas: jangadasProp, clientes = [] }: PortalOrdensListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openRequest = searchParams.get("openRequest");
  const urlShipId = searchParams.get("shipId");
  const urlJangadaId = searchParams.get("jangadaId");

  const [clientId, setClientId] = useState<number | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [items, setItems] = useState<{ ordens: OrdemServico[]; navios: Navio[]; jangadas: ClientJangada[] }>({
    ordens: ordensProp,
    navios: naviosProp,
    jangadas: jangadasProp,
  });
  const { ordens, navios, jangadas } = items;
  const activeClientId = clientId ?? clientes[0]?.id ?? null;

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);

  // State for request modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedShipId, setSelectedShipId] = useState("");
  const [shipSearch, setShipSearch] = useState("");
  const [shipDropdownOpen, setShipDropdownOpen] = useState(false);
  const shipComboboxRef = useRef<HTMLDivElement>(null);
  const [selectedJangadaId, setSelectedJangadaId] = useState("");
  const [porto, setPorto] = useState("Ponta Delgada");
  const [dataPretendida, setDataPretendida] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default to 7 days from now
    return getLocalDateKey(d);
  });
  const [horaPretendida, setHoraPretendida] = useState("09:00");
  const [necessitaHRU, setNecessitaHRU] = useState("no");
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // States for shipment details (only for vessels of other islands)
  const [transitario, setTransitario] = useState("");
  const [dataEntrega, setDataEntrega] = useState(() => {
    return getLocalDateKey();
  });
  const [trackingCode, setTrackingCode] = useState("");

  const selectedShipObject = useMemo(() => {
    return navios.find((n) => String(n.id) === selectedShipId) || null;
  }, [navios, selectedShipId]);

  const isOtherIsland = useMemo(() => {
    if (!selectedShipObject?.ilha) return false;
    const island = selectedShipObject.ilha.toLowerCase();
    return island !== "são miguel" && island !== "sao miguel";
  }, [selectedShipObject]);

  // Handle URL query parameters to auto-open request modal
  useEffect(() => {
    if (openRequest === "true") {
      setIsRequestModalOpen(true);
      if (urlShipId) {
        setSelectedShipId(urlShipId);
      }
    }
  }, [openRequest, urlShipId]);

  // Pre-select ship if client only has 1 ship
  useEffect(() => {
    if (navios.length === 1 && !selectedShipId) {
      setSelectedShipId(String(navios[0].id));
    }
  }, [navios, selectedShipId]);

  const shipNameMap = useMemo(() => {
    return new Map(navios.map((n) => [n.id, n.nome]));
  }, [navios]);

  const filteredOrdens = useMemo(() => {
    return ordens.filter((o) => {
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        o.numeroOrdem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.jangada?.serial && o.jangada.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.descricao && o.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [ordens, statusFilter, searchTerm]);

  // Filter jangadas by selected ship
  const filteredJangadas = useMemo(() => {
    if (!selectedShipId) return [];
    return jangadas.filter((j) => j.shipId === Number(selectedShipId));
  }, [jangadas, selectedShipId]);

  // Filter ships by search text
  const filteredShips = useMemo(() => {
    const term = shipSearch.trim().toLowerCase();
    if (!term) return navios;
    return navios.filter((n) =>
      n.nome.toLowerCase().includes(term) ||
      (n.ilha || "").toLowerCase().includes(term),
    );
  }, [navios, shipSearch]);

  // Close ship dropdown when clicking outside
  useEffect(() => {
    if (!shipDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (shipComboboxRef.current && !shipComboboxRef.current.contains(e.target as Node)) {
        setShipDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [shipDropdownOpen]);

  // Automatically select first available jangada when ship changes, preserving urlJangadaId if matches
  useEffect(() => {
    if (filteredJangadas.length > 0) {
      if (urlJangadaId && filteredJangadas.some((j) => String(j.id) === urlJangadaId)) {
        setSelectedJangadaId(urlJangadaId);
      } else {
        setSelectedJangadaId(String(filteredJangadas[0].id));
      }
    } else {
      setSelectedJangadaId("");
    }
  }, [filteredJangadas, urlJangadaId]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (dateVal: Date | string | null) => {
    if (!dateVal) return "—";
    return new Date(dateVal).toLocaleDateString("pt-PT");
  };

  const formatDateTime = (dateVal: Date | string | null) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    const dateStr = d.toLocaleDateString("pt-PT");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${dateStr} às ${hours}:${minutes}`;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipId || !porto || !dataPretendida) {
      setSubmitError("Por favor preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/portal/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clientes.length > 0 ? (activeClientId ?? undefined) : undefined,
          shipId: Number(selectedShipId),
          jangadaId: selectedJangadaId ? Number(selectedJangadaId) : null,
          porto,
          dataPretendida: `${dataPretendida}T${horaPretendida}`,
          necessitaHRU,
          observacoes,
          transitario: isOtherIsland ? transitario : undefined,
          dataEntrega: isOtherIsland ? dataEntrega : undefined,
          trackingCode: isOtherIsland ? trackingCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar pedido de assistência.");
      }

      appToast.success("Pedido de assistência enviado com sucesso!");
      setIsRequestModalOpen(false);

      // Reset fields
      setSelectedShipId("");
      setSelectedJangadaId("");
      setPorto("Ponta Delgada");
      setNecessitaHRU("no");
      setObservacoes("");
      setHoraPretendida("09:00");
      setTransitario("");
      setDataEntrega(getLocalDateKey());
      setTrackingCode("");

      // Refresh server components
      router.refresh();
    } catch (err: any) {
      setSubmitError(err?.message || "Ocorreu um erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Tem a certeza que deseja cancelar e eliminar este pedido de assistência?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/ordens-servico/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao cancelar o pedido.");
      }

      appToast.success("Pedido de assistência cancelado com sucesso.");
      setSelectedOrdem(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Ocorreu um erro ao cancelar o pedido.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSwitchClient = async (id: number) => {
    setClientId(id);
    setClientLoading(true);
    setSelectedOrdem(null);
    setSelectedShipId("");
    setSelectedJangadaId("");
    setStatusFilter("");
    setSearchTerm("");

    try {
      const res = await fetch(`/api/portal/clientes/${id}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao carregar o cliente.");
      }
      const data = await res.json();
      setItems({
        ordens: data.ordens || [],
        navios: data.navios || [],
        jangadas: data.jangadas || [],
      });
    } catch (err: any) {
      appToast.error(err?.message || "Não foi possível carregar os dados do cliente.");
    } finally {
      setClientLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    "em_curso": "Em Curso",
    "em_progresso": "Em Curso",
    concluido: "Concluído",
    faturado: "Faturado",
  };

  const statusColors: Record<string, string> = {
    pendente: "bg-gray-100 text-gray-700 border-gray-200",
    "em_curso": "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    "em_progresso": "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
    concluido: "bg-emerald-50 text-emerald-700 border-emerald-200",
    faturado: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const priorityColors: Record<string, string> = {
    baixa: "bg-slate-100 text-slate-700",
    normal: "bg-gray-100 text-gray-700",
    alta: "bg-orange-100 text-orange-800",
    urgente: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por Nº Ordem, S/N..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-700 shadow-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full sm:w-48">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 appearance-none"
            >
              <option value="">Todos os Estados</option>
              <option value="pendente">Pendentes</option>
              <option value="em_curso">Em Curso</option>
              <option value="concluido">Concluídas</option>
              <option value="faturado">Faturadas</option>
            </select>
          </div>

          {clientes.length > 0 && (
            <div className="relative w-full sm:w-56">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={activeClientId ?? ""}
                onChange={(e) => { const id = Number(e.target.value); if (id) void handleSwitchClient(id); }}
                disabled={clientLoading}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-700 shadow-sm focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="">Selecionar cliente...</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Request Service Button */}
        <button
          type="button"
          onClick={() => setIsRequestModalOpen(true)}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Pedir Assistência / Inspeção
        </button>
      </div>

      {/* Orders Grid */}
      {filteredOrdens.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Info className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma ordem encontrada</h3>
          <p className="text-sm text-slate-500 mt-1">Experimente remover ou alterar os filtros ativos.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrdens.map((ordem) => {
            const shipName = shipNameMap.get(ordem.shipId || 0) || "Não associado";
            const orderStatusColor = statusColors[ordem.status] || "bg-gray-100 text-gray-700";

            let shipmentInfo = null;
            try {
              if (ordem.metadados) {
                const meta = JSON.parse(ordem.metadados);
                if (meta.transitario) {
                  shipmentInfo = {
                    transitario: meta.transitario,
                    dataEntrega: meta.dataEntrega,
                    trackingCode: meta.trackingCode,
                  };
                }
              }
            } catch (e) {}

            return (
              <div
                key={ordem.id}
                onClick={() => setSelectedOrdem(ordem)}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between hover:border-slate-300"
              >
                <div className="space-y-3.5">
                  {/* Title info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                        {ordem.tipo === "inspecao" ? "Inspeção Periódica" : "Manutenção"}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight uppercase mt-0.5">
                        Nº {ordem.numeroOrdem}
                      </h3>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${orderStatusColor}`}>
                      {statusLabels[ordem.status] || ordem.status}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 py-1" />

                  {/* Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Equipamento:</span>
                      <span className="font-semibold text-slate-800">
                        {ordem.jangada
                          ? `${ordem.jangada.brand || ""} ${ordem.jangada.model || ""} (S/N: ${ordem.jangada.serial || ""})`
                          : "Sem jangada associada"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Embarcação:</span>
                      <span className="font-semibold text-slate-800">{shipName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Abertura:</span>
                      <span className="font-semibold text-slate-800">{formatDate(ordem.dataAbertura)}</span>
                    </div>
                    {ordem.dataPlaneadaInicio && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-rose-700 font-semibold">Agendamento:</span>
                        <span className="font-bold text-rose-700">{formatDateTime(ordem.dataPlaneadaInicio)}</span>
                      </div>
                    )}
                    {ordem.dataConclusao ? (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Conclusão:</span>
                        <span className="font-semibold text-slate-800">{formatDate(ordem.dataConclusao)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Previsão:</span>
                        <span className="font-semibold text-slate-800">{formatDate(ordem.dataPrevista)}</span>
                      </div>
                    )}
                  </div>

                  {shipmentInfo && (
                    <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-2.5 mt-3 space-y-1 text-[11px] text-blue-700">
                      <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wide">
                        <span>📦</span> Envio Transitário
                      </div>
                      <div><strong>Transitário:</strong> {shipmentInfo.transitario}</div>
                      <div><strong>Data Envio:</strong> {formatDate(shipmentInfo.dataEntrega)}</div>
                      {shipmentInfo.trackingCode && <div><strong>Rastreio:</strong> <code className="bg-white/60 px-1 rounded">{shipmentInfo.trackingCode}</code></div>}
                    </div>
                  )}
                </div>

                {/* Card footer details */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`inline-flex rounded px-1.5 py-0.5 font-semibold text-[10px] uppercase ${priorityColors[ordem.prioridade] || "bg-slate-100"}`}>
                    Prio: {ordem.prioridade}
                  </span>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-medium">Valor Estimado</span>
                    <span className="block text-sm font-bold text-slate-800">
                      {ordem.valorTotal > 0 ? formatPrice(ordem.valorTotal) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrdem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider">
                  Detalhes da Ordem de Serviço
                </span>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mt-0.5 uppercase">
                  Ordem nº {selectedOrdem.numeroOrdem}
                </h2>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase border ${statusColors[selectedOrdem.status] || "bg-gray-100"}`}>
                {statusLabels[selectedOrdem.status] || selectedOrdem.status}
              </span>
            </div>

            {/* Description */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Descrição do Serviço:</span>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedOrdem.descricao || "Nenhuma descrição fornecida."}
              </p>
            </div>

            {selectedOrdem.dataPlaneadaInicio && (
              <div className="rounded-2xl bg-rose-50/50 border border-rose-100/80 p-3.5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-rose-800 block">Data/Hora Pretendida:</span>
                  <span className="text-rose-700 font-bold text-sm mt-0.5 block">
                    {formatDateTime(selectedOrdem.dataPlaneadaInicio)}
                  </span>
                </div>
                <span className="text-rose-500 text-lg">📅</span>
              </div>
            )}

            {/* Technical details block */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">Embarcação</span>
                <span className="block text-slate-800 font-bold">
                  {shipNameMap.get(selectedOrdem.shipId || 0) || "Não associada"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">Técnico Responsável</span>
                <span className="block text-slate-800 font-bold">
                  {selectedOrdem.tecnicoResponsavel || "Equipa de Turno"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">Jangada</span>
                <span className="block text-slate-800 font-bold">
                  {selectedOrdem.jangada ? `${selectedOrdem.jangada.brand || ""} ${selectedOrdem.jangada.model || ""}` : "Sem jangada"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">Nº de Série da Jangada</span>
                <span className="block text-slate-800 font-bold font-mono uppercase">
                  {selectedOrdem.jangada?.serial || "—"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">Data de Abertura</span>
                <span className="block text-slate-800 font-bold">
                  {formatDate(selectedOrdem.dataAbertura)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-slate-400 font-semibold">
                  {selectedOrdem.dataConclusao ? "Data de Conclusão" : "Previsão de Conclusão"}
                </span>
                <span className="block text-slate-800 font-bold">
                  {selectedOrdem.dataConclusao ? formatDate(selectedOrdem.dataConclusao) : formatDate(selectedOrdem.dataPrevista)}
                </span>
              </div>
            </div>

            {/* Financial Details */}
            {selectedOrdem.valorTotal > 0 && (
              <div className="border-t border-slate-100 pt-4 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Orçamento & Faturação:</span>
                <div className="grid grid-cols-3 gap-2 border border-slate-100 rounded-xl bg-slate-50/50 p-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Peças/Materiais</span>
                    <span className="block font-semibold text-slate-700">{formatPrice(selectedOrdem.valorPecas)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-medium">Mão de Obra</span>
                    <span className="block font-semibold text-slate-700">{formatPrice(selectedOrdem.valorMaoObra)}</span>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <span className="block text-[10px] text-slate-400 font-bold">Valor Total</span>
                    <span className="block font-black text-blue-700 text-sm">{formatPrice(selectedOrdem.valorTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipment details if present */}
            {(() => {
              let shipmentInfo = null;
              try {
                if (selectedOrdem.metadados) {
                  const meta = JSON.parse(selectedOrdem.metadados);
                  if (meta.transitario) {
                    shipmentInfo = {
                      transitario: meta.transitario,
                      dataEntrega: meta.dataEntrega,
                      trackingCode: meta.trackingCode,
                    };
                  }
                }
              } catch (e) {}

              if (!shipmentInfo) return null;

              return (
                <div className="border-t border-slate-100 pt-4 text-xs space-y-2">
                  <span className="font-bold text-slate-700 block">Informações do Envio:</span>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-3 space-y-1.5 text-blue-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Transitário</span>
                        <span className="font-bold">{shipmentInfo.transitario}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Data do Envio</span>
                        <span className="font-bold">{formatDate(shipmentInfo.dataEntrega)}</span>
                      </div>
                    </div>
                    {shipmentInfo.trackingCode && (
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Código de Rastreio</span>
                        <code className="bg-white/80 border border-blue-100 px-1.5 py-0.5 rounded font-mono font-bold text-xs inline-block mt-0.5">
                          {shipmentInfo.trackingCode}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Close / Cancel Actions */}
            <div className="pt-2 flex justify-between items-center">
              <div>
                {selectedOrdem.status === "pendente" && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(selectedOrdem.id)}
                    disabled={isCancelling}
                    className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isCancelling ? "A cancelar..." : "Cancelar Pedido"}
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                {selectedOrdem.jangada?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/jangadas/${selectedOrdem.jangada?.id}/aprovar-orcamento`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ acao: "aprovar" }),
                        });
                        const j = await res.json();
                        if (!res.ok) throw new Error(j.error || "Erro ao aprovar");
                        appToast.success("Orçamento aprovado com sucesso!");
                        setSelectedOrdem(null);
                        window.location.reload();
                      } catch (err: unknown) {
                        appToast.error(err instanceof Error ? err.message : "Erro ao aprovar orçamento");
                      }
                    }}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    ✅ Aprovar Orçamento
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrdem(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Inspection Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-black text-blue-600 tracking-wider">
                Solicitar Serviço
              </span>
              <h2 className="text-xl font-black text-slate-800 tracking-tight mt-0.5">
                Pedir Assistência / Inspeção
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Submeta um pedido de inspeção obrigatória ou manutenção. A nossa equipa entrará em contacto para agendar.
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                  {submitError}
                </div>
              )}

              {/* Vessel Select */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">
                  Embarcação / Navio <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={shipComboboxRef}>
                <input
                  type="text"
                  value={shipSearch}
                  onFocus={() => setShipDropdownOpen(true)}
                  onChange={(e) => {
                    setShipSearch(e.target.value);
                    setShipDropdownOpen(true);
                  }}
                  placeholder={selectedShipId ? (navios.find((n) => String(n.id) === selectedShipId)?.nome || "Pesquisar navio...") : "Pesquisar navio..."}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 pr-9 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                />
                {selectedShipId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShipId("");
                      setShipSearch("");
                      setShipDropdownOpen(true);
                    }}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Limpar seleção"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  />
                )}
                {shipDropdownOpen && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredShips.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-slate-500">Nenhum navio encontrado.</div>
                    ) : (
                      filteredShips.map((n) => (
                        <button
                          type="button"
                          key={n.id}
                          onClick={() => {
                            setSelectedShipId(String(n.id));
                            setShipSearch("");
                            setShipDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition hover:bg-blue-50 ${
                            String(n.id) === selectedShipId ? "bg-blue-50 text-blue-700" : "text-slate-700"
                          }`}
                        >
                          <span>{n.nome}</span>
                          {n.ilha ? <span className="text-[10px] text-slate-400">{n.ilha}</span> : null}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Liferaft Select (Conditional on ship select) */}
              {selectedShipId && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Jangada Salva-vidas <span className="text-rose-500">*</span>
                  </label>
                  {filteredJangadas.length === 0 ? (
                    <div className="text-xs text-rose-600 font-semibold p-1">
                      Este navio não tem jangadas registadas. Por favor contacte o suporte.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedJangadaId}
                      onChange={(e) => setSelectedJangadaId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      {filteredJangadas.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.brand} {j.model} (S/N: {j.serial})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Port Select */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Porto de Assistência (S. Miguel) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={porto}
                    onChange={(e) => setPorto(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Ponta Delgada">Ponta Delgada</option>
                    <option value="Rabo de Peixe">Rabo de Peixe</option>
                    <option value="Lagoa">Lagoa</option>
                    <option value="Vila Franca do Campo">Vila Franca do Campo</option>
                    <option value="Ribeira Grande">Ribeira Grande</option>
                    <option value="Nordeste">Nordeste</option>
                    <option value="Povoação">Povoação</option>
                    <option value="Outro (S. Miguel)">Outro (S. Miguel)</option>
                  </select>
                  <p className="text-[10px] text-amber-600 font-semibold mt-0.5 leading-tight">
                    A assistência está disponível exclusivamente na ilha de São Miguel.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Preferred Date */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Data Pretendida <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dataPretendida}
                      onChange={(e) => setDataPretendida(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Preferred Time */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-600">
                      Hora Pretendida <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={horaPretendida}
                      onChange={(e) => setHoraPretendida(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shipment Info for other islands */}
              {isOtherIsland && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 uppercase tracking-wider">
                    <span>📦</span> Detalhes do Envio (Transitário)
                  </div>
                  <p className="text-[10px] text-blue-600 leading-normal">
                    Como a sua embarcação pertence à ilha de <strong>{selectedShipObject?.ilha}</strong>, a assistência requer o envio do equipamento para a nossa estação em São Miguel. Por favor, preencha os dados do envio.
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Transitário / Transportadora <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Transitário Açoreano, Bensaude, etc."
                      value={transitario}
                      onChange={(e) => setTransitario(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Data de Entrega / Envio <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dataEntrega}
                        onChange={(e) => setDataEntrega(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Código de Rastreio <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nº Guia / Rastreio"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* New HRU Checkbox */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hru_checkbox"
                  checked={necessitaHRU === "yes"}
                  onChange={(e) => setNecessitaHRU(e.target.checked ? "yes" : "no")}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hru_checkbox" className="text-xs text-slate-600 cursor-pointer select-none">
                  <span className="font-bold text-slate-700 block">Necessita de Novo HRU?</span>
                  Assinale se necessita de fornecimento e instalação de um novo Dispositivo de Libertação Hidrostática (HRU) para a jangada.
                </label>
              </div>

              {/* Observations */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600">
                  Observações / Instruções Adicionais
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Porto alternativo, detalhes da urgência ou outros equipamentos a verificar..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!(isSubmitting || !selectedShipId || (selectedShipId && filteredJangadas.length === 0))}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "A enviar..." : "Submeter Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
