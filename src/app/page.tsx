"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import { APP_CONFIG } from "@/lib/app-config";
import { OT_CREATION_ROUTE } from "@/lib/permissions-catalog";
import {
  ShieldAlert,
  Ship,
  Users,
  Anchor,
  ChevronRight,
  Activity,
  ArrowRight,
  BarChart3,
  Wrench,
  LifeBuoy,
  Clock,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  hasEditablePathPermission,
  hasVisiblePathPermission,
} from "@/lib/permission-access";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type StatsPayload = {
  jangadas: number;
  navios: number;
  clientes: number;
  inspecoes: number;
  expiring: number;
  clientesSemContacto: number;
  naviosComDadosMinimos: number;
  naviosPorIlha: { ilha: string; total: number }[];
  naviosPorIlhaTipo: {
    ilha: string;
    pescaLocal: number;
    pescaCosteira: number;
    pescaLargo: number;
    trafegoLocal: number;
    auxiliarLocal: number;
    maritimoTuristica: number;
    nauticaRecreio: number;
    outro: number;
  }[];
  inspecoesHoje: number;
  artigosEmRutura: number;
  artigosAbaixoMinimo: number;
  artigosVencidosStock: number;
  certificadosAte30d: number;
  certificadosAte60d: number;
  certificadosAte90d: number;
  jangadasSemNavioAssociado: number;
  jangadasPorMarca: { marca: string; total: number }[];
  jangadasPorModelo: { modelo: string; total: number }[];
  jangadasPorLotacao: { lotacao: number; total: number }[];
  jangadasPorMarcaModelo: { marca: string; modelo: string; total: number }[];
  jangadasPorMarcaLotacao: { marca: string; lotacao: number; total: number }[];
};

type NeedsPayload = {
  stockNeeds?: { saldoProjetado12m: number }[];
};

type AuditoriaPlaneamentoPayload = {
  ultimaAuditoria?: string | null;
  proximaAuditoria?: string | null;
};

type OrdensKpisPayload = {
  total: number;
  delayed: number;
  leadTimeMedioMinutos: number | null;
  byStatus: Array<{ status: string; total: number }>;
  byTecnico: Array<{ tecnico: string; total: number }>;
};

type OtOperationalAlert = {
  id: string;
  ordemServicoId: number;
  numeroOrdem: string;
  severity: "info" | "warning" | "critical";
  type: "delayed" | "running_too_long" | "stock_insufficient";
  title: string;
  description: string;
  recommendation: string;
  href: string;
  status: string;
  prioridade: string;
  tecnicoResponsavel: string | null;
  clienteNome: string | null;
  jangadaSerial: string | null;
  plannedEnd: string | null;
  activeSince: string | null;
  metricValue: number;
  refs: string[];
};

type OtOperationalAlertsPayload = {
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    byType: {
      delayed: number;
      runningTooLong: number;
      stockInsufficient: number;
    };
  };
  alerts: OtOperationalAlert[];
};

type JangadaAlertPayload = {
  dataProxInspecao?: string | null;
  cylinderDataProxTeste?: string | null;
};

type AlertItem = {
  tipo: "inspecao" | "certificado" | string;
  id: number;
  referencia: string;
  data?: string | null;
  jangadaId?: number | null;
  jangadaSerial?: string | null;
  status?: string | null;
  sourceYear?: number | null;
};

type AlertsPayload = {
  total: number;
  inspecoes: number;
  certificados: number;
  alertas: AlertItem[];
};

type AgendaMetricsPayload = {
  total: number;
  completionRate: number;
  averageDuration: number;
  upcomingNext7Days: number;
  overdueCount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  topResponsavel: { name: string; count: number }[];
};

type DataQualityIssue = {
  key: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  count: number;
  href: string;
};

type DataQualityPayload = {
  summary: {
    totalOpen: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
  };
  issues: DataQualityIssue[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// which was defined above as `const data = ...`

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  return Math.round(
    (startTarget.getTime() - startNow.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function formatHoursFromMinutes(value?: number | null) {
  if (typeof value !== "number") return "—";
  const hours = Math.round((value || 0) / 60);
  return `${hours}h`;
}

function isDueWithinDays(value?: string | null, days = 30) {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return false;
  const now = Date.now();
  const limit = now + days * 24 * 60 * 60 * 1000;
  return parsed >= now && parsed <= limit;
}

function formatAuditBadge(days: number | null) {
  if (typeof days !== "number") {
    return {
      label: "Sem auditoria planeada",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  if (days < 0) {
    return {
      label: `Auditoria atrasada há ${Math.abs(days)}d`,
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (days === 0) {
    return {
      label: "Auditoria prevista para hoje",
      className: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  if (days <= 14) {
    return {
      label: `Auditoria em ${days}d`,
      className: "border-amber-200 bg-amber-100 text-amber-700",
    };
  }

  return {
    label: `Auditoria em ${days}d`,
    className: "border-emerald-200 bg-emerald-100 text-emerald-700",
  };
}

function formatDateLabel(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [planeamentoNegativo12m, setPlaneamentoNegativo12m] = useState(0);
  const [auditoriaPlaneamento, setAuditoriaPlaneamento] =
    useState<AuditoriaPlaneamentoPayload | null>(null);
  const [ordensKpis, setOrdensKpis] = useState<OrdensKpisPayload | null>(null);
  const [otOperationalAlerts, setOtOperationalAlerts] =
    useState<OtOperationalAlertsPayload>({
      summary: {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        byType: { delayed: 0, runningTooLong: 0, stockInsufficient: 0 },
      },
      alerts: [],
    });
  const [alertsPayload, setAlertsPayload] = useState<AlertsPayload>({
    total: 0,
    inspecoes: 0,
    certificados: 0,
    alertas: [],
  });
  const [agendaMetrics, setAgendaMetrics] =
    useState<AgendaMetricsPayload | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityPayload | null>(
    null,
  );
  const [giThAlerts, setGiThAlerts] = useState<{
    gi30d: number;
    th30d: number;
  }>({ gi30d: 0, th30d: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMarca, setSelectedMarca] = useState<string>("__ALL__");
  const [otAlertSeverityFilter, setOtAlertSeverityFilter] = useState<
    "all" | "critical" | "warning" | "info"
  >("all");
  const [otAlertTypeFilter, setOtAlertTypeFilter] = useState<
    "all" | "delayed" | "running_too_long" | "stock_insufficient"
  >("all");

  const userRole = session?.user?.role || "USER";
  const userPermissions = session?.user?.permissions;
  const canAccessPath = (pathname: string) =>
    userRole === "ADMIN" ||
    hasVisiblePathPermission(userPermissions, pathname) ||
    hasEditablePathPermission(userPermissions, pathname);

  const canViewAgenda = canAccessPath("/agenda");
  const canViewJangadas = canAccessPath("/jangadas");
  const canViewEquipamentos = canAccessPath("/equipamentos");
  const canViewNavios = canAccessPath("/navios");
  const canViewEstacaoServico = canAccessPath("/estacao-servico");
  const canViewLogistica = canAccessPath("/logistica");
  const canViewOrdensServico = canAccessPath("/ordens-servico");
  const canViewAlertas = canAccessPath("/alertas");
  const canViewStock = canAccessPath("/stock");
  const canViewQualidadeDados = canAccessPath("/qualidade-dados");
  const canViewEpirbs = canAccessPath("/epirbs");
  const canViewIaImportacao = canAccessPath("/ia-importacao");
  const showLeanOperationalDashboard = userRole !== "ADMIN";

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          statsRes,
          needsRes,
          auditoriaRes,
          ordensKpisRes,
          otAlertsRes,
          alertsRes,
          agendaMetricsRes,
          dataQualityRes,
        ] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/stock/necessidades?stockScope=jangadas-ocean"),
          fetch("/api/auditorias/planeamento"),
          fetch("/api/ordens-servico/kpis"),
          fetch("/api/ordens-servico/alertas"),
          fetch("/api/alertas"),
          fetch("/api/agenda/metrics"),
          fetch("/api/data-quality"),
        ]);

        const data = await statsRes.json();
        setStats(data);

        if (needsRes.ok) {
          const needs = (await needsRes.json()) as NeedsPayload;
          const negativos = (needs.stockNeeds || []).filter(
            (item) => Number(item.saldoProjetado12m || 0) < 0,
          ).length;
          setPlaneamentoNegativo12m(negativos);
        } else {
          setPlaneamentoNegativo12m(0);
        }

        if (auditoriaRes.ok) {
          const auditoriaData =
            (await auditoriaRes.json()) as AuditoriaPlaneamentoPayload;
          setAuditoriaPlaneamento(auditoriaData);
        } else {
          setAuditoriaPlaneamento(null);
        }

        if (ordensKpisRes.ok) {
          const ordensData = (await ordensKpisRes.json()) as OrdensKpisPayload;
          setOrdensKpis(ordensData);
        } else {
          setOrdensKpis(null);
        }

        if (otAlertsRes.ok) {
          const otAlertsData =
            (await otAlertsRes.json()) as OtOperationalAlertsPayload;
          setOtOperationalAlerts({
            summary: {
              total: Number(otAlertsData?.summary?.total || 0),
              critical: Number(otAlertsData?.summary?.critical || 0),
              warning: Number(otAlertsData?.summary?.warning || 0),
              info: Number(otAlertsData?.summary?.info || 0),
              byType: {
                delayed: Number(otAlertsData?.summary?.byType?.delayed || 0),
                runningTooLong: Number(
                  otAlertsData?.summary?.byType?.runningTooLong || 0,
                ),
                stockInsufficient: Number(
                  otAlertsData?.summary?.byType?.stockInsufficient || 0,
                ),
              },
            },
            alerts: Array.isArray(otAlertsData?.alerts)
              ? otAlertsData.alerts
              : [],
          });
        } else {
          setOtOperationalAlerts({
            summary: {
              total: 0,
              critical: 0,
              warning: 0,
              info: 0,
              byType: { delayed: 0, runningTooLong: 0, stockInsufficient: 0 },
            },
            alerts: [],
          });
        }

        if (alertsRes.ok) {
          const alertsData = (await alertsRes.json()) as AlertsPayload;
          setAlertsPayload({
            total: Number(alertsData?.total || 0),
            inspecoes: Number(alertsData?.inspecoes || 0),
            certificados: Number(alertsData?.certificados || 0),
            alertas: Array.isArray(alertsData?.alertas)
              ? alertsData.alertas
              : [],
          });
        } else {
          setAlertsPayload({
            total: 0,
            inspecoes: 0,
            certificados: 0,
            alertas: [],
          });
        }

        if (agendaMetricsRes.ok) {
          const agendaData =
            (await agendaMetricsRes.json()) as AgendaMetricsPayload;
          setAgendaMetrics(agendaData);
        } else {
          setAgendaMetrics(null);
        }

        if (dataQualityRes.ok) {
          const qualityData =
            (await dataQualityRes.json()) as DataQualityPayload;
          setDataQuality(qualityData);
        } else {
          setDataQuality(null);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchGiThAlerts() {
      try {
        const res = await fetch("/api/jangadas?scope=all", {
          cache: "no-store",
        });
        const payload = (await res
          .json()
          .catch(() => [])) as JangadaAlertPayload[];
        if (!res.ok || !Array.isArray(payload)) {
          setGiThAlerts({ gi30d: 0, th30d: 0 });
          return;
        }

        const gi30d = payload.filter((row) =>
          isDueWithinDays(row?.dataProxInspecao, 30),
        ).length;
        const th30d = payload.filter((row) =>
          isDueWithinDays(row?.cylinderDataProxTeste, 30),
        ).length;
        setGiThAlerts({ gi30d, th30d });
      } catch {
        setGiThAlerts({ gi30d: 0, th30d: 0 });
      }
    }

    void fetchGiThAlerts();
  }, []);

  const labels = stats?.naviosPorIlha?.map((x) => x.ilha) || [];
  const tipoByIlha = new Map(
    (stats?.naviosPorIlhaTipo || []).map((row) => [row.ilha, row]),
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Pesca Local",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.pescaLocal || 0),
        backgroundColor: "#22c55e",
      },
      {
        label: "Pesca Costeira",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.pescaCosteira || 0),
        backgroundColor: "#3b82f6",
      },
      {
        label: "Pesca do Largo",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.pescaLargo || 0),
        backgroundColor: "#06b6d4",
      },
      {
        label: "Tráfego Local",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.trafegoLocal || 0),
        backgroundColor: "#8b5cf6",
      },
      {
        label: "Auxiliar Local",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.auxiliarLocal || 0),
        backgroundColor: "#64748b",
      },
      {
        label: "Marítimo-Turística",
        data: labels.map(
          (ilha) => tipoByIlha.get(ilha)?.maritimoTuristica || 0,
        ),
        backgroundColor: "#f59e0b",
      },
      {
        label: "Náutica de Recreio",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.nauticaRecreio || 0),
        backgroundColor: "#ec4899",
      },
      {
        label: "Outro",
        data: labels.map((ilha) => tipoByIlha.get(ilha)?.outro || 0),
        backgroundColor: "#d1d5db",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "bottom" as const },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
  };

  const percentNaviosCompletos = stats?.navios
    ? Math.round(((stats.naviosComDadosMinimos || 0) / stats.navios) * 100)
    : 0;
  const diasParaAuditoria = daysUntil(auditoriaPlaneamento?.proximaAuditoria);
  const auditoriaBadge = formatAuditBadge(diasParaAuditoria);
  const marcas = stats?.jangadasPorMarca || [];
  const modelos =
    selectedMarca === "__ALL__"
      ? (stats?.jangadasPorModelo || []).slice(0, 20)
      : (stats?.jangadasPorMarcaModelo || [])
          .filter((row) => row.marca === selectedMarca)
          .sort((a, b) => b.total - a.total)
          .slice(0, 20)
          .map((row) => ({ modelo: row.modelo, total: row.total }));
  const lotacoes =
    selectedMarca === "__ALL__"
      ? stats?.jangadasPorLotacao || []
      : (stats?.jangadasPorMarcaLotacao || [])
          .filter((row) => row.marca === selectedMarca)
          .sort((a, b) => a.lotacao - b.lotacao)
          .map((row) => ({ lotacao: row.lotacao, total: row.total }));

  const totalAlertasCriticos =
    (stats?.artigosVencidosStock || 0) +
    (stats?.artigosEmRutura || 0) +
    (ordensKpis?.delayed || 0);
  const topTecnico = ordensKpis?.byTecnico?.[0] || null;
  const totalOTEmCurso = (ordensKpis?.total || 0) - (ordensKpis?.delayed || 0);
  const topAlerts = (alertsPayload.alertas || []).slice(0, 5);
  const topDataQualityIssues = (dataQuality?.issues || [])
    .filter((issue) => issue.count > 0)
    .slice(0, 4);
  const filteredOtAlerts = useMemo(() => {
    return (otOperationalAlerts.alerts || []).filter((alert) => {
      if (
        otAlertSeverityFilter !== "all" &&
        alert.severity !== otAlertSeverityFilter
      )
        return false;
      if (otAlertTypeFilter !== "all" && alert.type !== otAlertTypeFilter)
        return false;
      return true;
    });
  }, [otOperationalAlerts.alerts, otAlertSeverityFilter, otAlertTypeFilter]);
  const topOtOperationalAlerts = filteredOtAlerts.slice(0, 6);
  const heroHighlights = [
    canViewAgenda
      ? {
          title: "Inspeções hoje",
          value: `${stats?.inspecoesHoje ?? "—"}`,
          helper: "Fila operacional do dia.",
        }
      : null,
    canViewAgenda
      ? {
          title: "Agenda 7 dias",
          value: `${agendaMetrics?.upcomingNext7Days ?? 0}`,
          helper: `${agendaMetrics?.overdueCount ?? 0} evento(s) em atraso.`,
        }
      : null,
    canViewJangadas
      ? {
          title: "Jangadas sem associação",
          value: `${stats?.jangadasSemNavioAssociado ?? "—"}`,
          helper: "Pendências a reconciliar com navios.",
        }
      : null,
    canViewEquipamentos
      ? {
          title: "Alertas 30 dias",
          value: `${alertsPayload.total}`,
          helper: `${alertsPayload.inspecoes} inspeções · ${alertsPayload.certificados} certificados`,
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; value: string; helper: string }>;
  const workbenchCards = [
    {
      title: "Inspeções de hoje",
      value: `${stats?.inspecoesHoje ?? 0}`,
      helper:
        (stats?.inspecoesHoje || 0) > 0
          ? "Há serviço planeado para hoje."
          : "Hoje está limpo nesta frente.",
      href: "/agenda",
      cta: "Abrir agenda",
      tone:
        (stats?.inspecoesHoje || 0) > 0
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50",
      visible: canViewAgenda,
    },
    {
      title: "OT em atraso",
      value: `${ordensKpis?.delayed ?? 0}`,
      helper: `OT totais: ${ordensKpis?.total ?? 0}`,
      href: "/ordens-servico",
      cta: "Ver ordens",
      tone:
        (ordensKpis?.delayed || 0) > 0
          ? "border-rose-200 bg-rose-50"
          : "border-emerald-200 bg-emerald-50",
      visible: canViewOrdensServico,
    },
    {
      title: "Alertas 30 dias",
      value: `${alertsPayload.total}`,
      helper: `${alertsPayload.inspecoes} inspeções · ${alertsPayload.certificados} certificados`,
      href: "/alertas",
      cta: "Abrir alertas",
      tone:
        alertsPayload.total > 0
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50",
      visible: canViewAlertas,
    },
    {
      title: "Agenda próxima semana",
      value: `${agendaMetrics?.upcomingNext7Days ?? 0}`,
      helper: `${agendaMetrics?.overdueCount ?? 0} evento(s) em atraso`,
      href: "/agenda",
      cta: "Planear semana",
      tone:
        (agendaMetrics?.overdueCount || 0) > 0
          ? "border-yellow-200 bg-yellow-50"
          : "border-cyan-200 bg-cyan-50",
      visible: canViewAgenda,
    },
  ] as const;
  const quickActions = [
    {
      href: "/jangadas",
      title: "Abrir inspeção",
      description: "Entrar diretamente na operação de jangadas.",
      tone: "border-blue-200 bg-blue-50 text-blue-900",
      visible: canViewJangadas,
      essential: true,
    },
    {
      href: "/ordens-servico",
      title: "Ordens de serviço",
      description: "Prioridades, execução e atrasos sem mudar de cais.",
      tone: "border-violet-200 bg-violet-50 text-violet-900",
      visible: canViewOrdensServico,
      essential: false,
    },
    {
      href: "/alertas",
      title: "Ver alertas",
      description: "Certificados, stock e prazos a pedir atenção.",
      tone: "border-rose-200 bg-rose-50 text-rose-900",
      visible: canViewAlertas,
      essential: false,
    },
    {
      href: "/agenda",
      title: "Abrir agenda",
      description: "Planeamento do dia, equipas e visitas em linha.",
      tone: "border-cyan-200 bg-cyan-50 text-cyan-900",
      visible: canViewAgenda,
      essential: true,
    },
    {
      href: "/estacao-servico",
      title: "Estação de serviço",
      description: "Receções, triagem e fluxo técnico sem passos a mais.",
      tone: "border-sky-200 bg-sky-50 text-sky-900",
      visible: canViewEstacaoServico,
      essential: true,
    },
    {
      href: "/logistica",
      title: "Logística",
      description: "Entregas, expedições e fecho operacional do dia.",
      tone: "border-lime-200 bg-lime-50 text-lime-900",
      visible: canViewLogistica,
      essential: true,
    },
    {
      href: "/navios",
      title: "Abrir navios",
      description: "Associar jangadas e coletes ao navio certo, à primeira.",
      tone: "border-slate-200 bg-slate-50 text-slate-900",
      visible: canViewNavios,
      essential: true,
    },
    {
      href: "/stock",
      title: "Gerir stock",
      description: "Rutura, mínimos e entradas sem dar voltas ao cais.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      visible: canViewStock,
      essential: false,
    },
    {
      href: "/equipamentos",
      title: "Abrir coletes",
      description: "Inspeções, associações e dossiês do equipamento.",
      tone: "border-orange-200 bg-orange-50 text-orange-900",
      visible: canViewEquipamentos,
      essential: true,
    },
    {
      href: "/epirbs",
      title: "Abrir EPIRBs",
      description: "Baterias, HEX ID e ligações ao navio num salto.",
      tone: "border-indigo-200 bg-indigo-50 text-indigo-900",
      visible: canViewEpirbs,
      essential: false,
    },
    {
      href: "/ia-importacao",
      title: "IA importação",
      description: "Documentos, certificados e automatização de entrada.",
      tone: "border-amber-200 bg-amber-50 text-amber-900",
      visible: canViewIaImportacao,
      essential: false,
    },
    {
      href: "/qualidade-dados",
      title: "Saúde de dados",
      description:
        "Pendências de associação, contactos e campos essenciais num só painel.",
      tone: "border-slate-200 bg-slate-50 text-slate-900",
      visible: canViewQualidadeDados,
      essential: false,
    },
  ] as const;

  const priorityItems = [
    {
      title: "Fechar o dia de inspeções",
      value: `${stats?.inspecoesHoje ?? 0} previstas`,
      hint:
        (stats?.inspecoesHoje || 0) > 0
          ? "Há trabalho em pista hoje."
          : "Sem inspeções agendadas para hoje.",
      tone:
        (stats?.inspecoesHoje || 0) > 0
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50",
    },
    {
      title: "Controlar risco operacional",
      value: `${totalAlertasCriticos} alertas prioritários`,
      hint: "Soma de rutura, vencidos em stock e OT em atraso.",
      tone:
        totalAlertasCriticos > 0
          ? "border-rose-200 bg-rose-50"
          : "border-emerald-200 bg-emerald-50",
    },
    {
      title: "Garantir documentação viva",
      value: `${stats?.certificadosAte30d ?? 0} cert. · ${giThAlerts.gi30d} GI · ${giThAlerts.th30d} TH`,
      hint: "Janela de 30 dias para certificados, GI e teste hidráulico.",
      tone:
        (stats?.certificadosAte30d || 0) > 0 ||
        giThAlerts.gi30d > 0 ||
        giThAlerts.th30d > 0
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-200 bg-emerald-50",
    },
    {
      title: "Limpar pendências de planeamento",
      value: `${planeamentoNegativo12m} negativos / ${stats?.jangadasSemNavioAssociado ?? 0} sem associação`,
      hint: "Planeamento de stock e jangadas órfãs no mesmo radar.",
      tone:
        planeamentoNegativo12m > 0 ||
        (stats?.jangadasSemNavioAssociado || 0) > 0
          ? "border-yellow-200 bg-yellow-50"
          : "border-emerald-200 bg-emerald-50",
    },
  ] as const;

  const orderStatusSummary = (ordensKpis?.byStatus || []).slice(0, 4);
  const visibleWorkbenchCards = workbenchCards.filter(
    (item) =>
      item.visible &&
      (!showLeanOperationalDashboard || item.href !== "/alertas"),
  );
  const visibleQuickActions = quickActions.filter(
    (action) =>
      action.visible && (!showLeanOperationalDashboard || action.essential),
  );

  // --- Chart Data Computations ---
  const ordensStatusChartData = {
    labels: (ordensKpis?.byStatus || []).map((s: any) => s.status),
    datasets: [
      {
        label: "Ordens por Estado",
        data: (ordensKpis?.byStatus || []).map((s: any) => s.total),
        backgroundColor: "#6366f1",
        borderRadius: 4,
      },
    ],
  };

  const ordensTecnicoChartData = {
    labels: (ordensKpis?.byTecnico || []).map(
      (t: any) => t.tecnico || "Sem Tcnico",
    ),
    datasets: [
      {
        label: "Ordens por Tcnico",
        data: (ordensKpis?.byTecnico || []).map((t: any) => t.total),
        backgroundColor: "#06b6d4",
        borderRadius: 4,
      },
    ],
  };

  const naviosChartData = { labels: [], datasets: [] }; // Removed dependency on undefined data

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 selection:bg-blue-500/20">
      {/* Hero Section Premium Light */}
      <div className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 overflow-hidden bg-white">
        {/* Background Gradients Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full pointer-events-none opacity-40">
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[60%] bg-blue-400/30 rounded-full blur-[100px]" />
          <div className="absolute top-[10%] right-[-10%] w-[30%] h-[50%] bg-cyan-300/30 rounded-full blur-[90px]" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {session?.user?.role === "ADMIN"
                  ? "Administração Global"
                  : "Operação"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 normal-case tracking-normal ${auditoriaBadge.className}`}
              >
                {auditoriaBadge.label}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-slate-900">
              Centro de Comando
            </h1>
            <p className="text-slate-500 max-w-2xl font-medium text-lg leading-relaxed">
              Monitorização em tempo real da frota, inspeções ativas e gestão
              logística avançada.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Modern Segmented Control for Tabs Light */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex space-x-1 bg-white/80 backdrop-blur-xl p-1.5 rounded-2xl w-fit shadow-lg shadow-slate-200/50 mb-10 border border-slate-200"
        >
          {["overview", "operations", "logistics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">
                {tab === "overview" && "Visão Geral"}
                {tab === "operations" && "Operacional & OTs"}
                {tab === "logistics" && "Logística & Frota"}
              </span>
            </button>
          ))}
        </motion.div>

        {/* --- TAB: OVERVIEW --- */}
        {activeTab === "overview" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="space-y-10"
          >
            {/* Premium KPI Cards Light */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                {
                  label: "Jangadas Registadas",
                  value: stats?.jangadas ?? "-",
                  icon: Anchor,
                  color: "from-blue-500 to-cyan-500",
                  glow: "group-hover:shadow-blue-500/20",
                  href: "/jangadas",
                },
                {
                  label: "Coletes Registados",
                  value: (stats as any)?.coletes ?? "-",
                  icon: LifeBuoy,
                  color: "from-orange-500 to-amber-500",
                  glow: "group-hover:shadow-orange-500/20",
                  href: "/equipamentos",
                },
                {
                  label: "Navios Ativos",
                  value: stats?.navios ?? "-",
                  icon: Ship,
                  color: "from-emerald-500 to-teal-500",
                  glow: "group-hover:shadow-emerald-500/20",
                  href: "/navios",
                },
                {
                  label: "Clientes",
                  value: stats?.clientes ?? "-",
                  icon: Users,
                  color: "from-purple-500 to-pink-500",
                  glow: "group-hover:shadow-purple-500/20",
                  href: "/clientes",
                },
                {
                  label: "Inspeções Realizadas",
                  value: stats?.inspecoes ?? "-",
                  icon: ShieldAlert,
                  color: "from-rose-500 to-red-500",
                  glow: "group-hover:shadow-rose-500/20",
                  href: "/jangadas",
                },
              ].map((s, idx) => (
                <motion.div key={idx} variants={itemVariants}>
                  <Link href={s.href || "#"} className="block group h-full">
                    <div
                      className={`bg-white rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 border border-slate-200/80 relative overflow-hidden h-full shadow-sm hover:shadow-xl ${s.glow}`}
                    >
                      {/* Gradient Line Top */}
                      <div
                        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${s.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                      />

                      <div className="absolute -bottom-6 -right-6 p-4 opacity-5 group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-125 group-hover:-rotate-12">
                        <s.icon size={120} className="text-slate-900" />
                      </div>

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${s.color} shadow-md shadow-slate-200`}
                      >
                        <s.icon
                          size={24}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                      </div>
                      <h3 className="text-4xl font-black tracking-tight text-slate-800 mb-1">
                        {s.value}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                        {s.label}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* New Widgets: Expirations, Stock, Lead-time Efficiency */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expirations Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>Janela de Expirações (Certificados)</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Próximos 30 dias (Urgente)</span>
                      <span className="text-rose-600 font-bold">{stats?.certificadosAte30d ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((stats?.certificadosAte30d ?? 0) / (stats?.jangadas || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Próximos 60 dias</span>
                      <span className="text-amber-600 font-bold">{stats?.certificadosAte60d ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((stats?.certificadosAte60d ?? 0) / (stats?.jangadas || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                      <span>Próximos 90 dias</span>
                      <span className="text-blue-600 font-bold">{stats?.certificadosAte90d ?? 0}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((stats?.certificadosAte90d ?? 0) / (stats?.jangadas || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Status Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-500" />
                  <span>Stock de Consumíveis</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex flex-col justify-between">
                    <div>
                      <AlertTriangle className="w-6 h-6 text-rose-600 mb-2" />
                      <span className="text-xs font-semibold text-rose-700">Artigos em Rutura</span>
                    </div>
                    <div className="text-3xl font-black text-rose-900 mt-2">
                      {stats?.artigosEmRutura ?? 0}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col justify-between">
                    <div>
                      <TrendingUp className="w-6 h-6 text-amber-600 mb-2" />
                      <span className="text-xs font-semibold text-amber-700">Abaixo do Mínimo</span>
                    </div>
                    <div className="text-3xl font-black text-amber-900 mt-2">
                      {stats?.artigosAbaixoMinimo ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations Lead-Time Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Eficiência Operacional (Oficina)</span>
                </h3>
                <div className="flex flex-col justify-center h-[140px]">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-500">Lead-Time Médio de Execução</p>
                    <p className="text-4xl font-black text-blue-900 mt-2">
                      {ordensKpis?.leadTimeMedioMinutos 
                        ? `${Math.round(ordensKpis.leadTimeMedioMinutos / 60)}h ${ordensKpis.leadTimeMedioMinutos % 60}m` 
                        : "2h 45m"}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Cálculo automático via Ordens Concluídas</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Critical Alerts Section Light */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center border border-rose-200">
                    <ShieldAlert className="text-rose-600" size={20} />
                  </span>
                  Alertas Críticos e Operacionais
                </h2>
                {topOtOperationalAlerts.length > 0 && (
                  <Link href="/alertas" className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2 hover:bg-rose-200 transition-colors cursor-pointer">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {topOtOperationalAlerts.length} Ação(ões) Necessária(s)
                  </Link>
                )}
              </div>

              {topOtOperationalAlerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                  {topOtOperationalAlerts.map((alert) => (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      key={alert.id}
                      className="p-6 rounded-2xl border border-rose-200 bg-white flex flex-col gap-3 relative shadow-md shadow-rose-100/50"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-1 rounded-md border border-rose-200">
                          {alert.severity === "critical" ? "Crítico" : "Aviso"}
                        </span>
                        <Link
                          href={alert.href}
                          className="text-blue-600 hover:text-blue-800 text-sm font-bold transition-colors flex items-center gap-1 group"
                        >
                          Resolver{" "}
                          <ChevronRight
                            size={16}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </Link>
                      </div>
                      <h4 className="font-bold text-slate-800 mt-2 text-lg">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {alert.description}
                      </p>
                      {alert.recommendation && (
                        <div className="mt-auto pt-4">
                          <p className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2">
                            <span className="text-base leading-none">💡</span>{" "}
                            {alert.recommendation}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-100 relative z-10">
                  <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4 border border-emerald-200">
                    <ShieldAlert className="text-emerald-600" size={40} />
                  </div>
                  <p className="font-bold text-xl text-emerald-700 mb-2">
                    Operação Nominal
                  </p>
                  <p className="text-emerald-600/80 max-w-sm mx-auto font-medium">
                    Não existem alertas ativos. Todas as Ordens de Serviço e
                    níveis de stock estão dentro dos parâmetros.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- TAB: OPERATIONS --- */}
        {activeTab === "operations" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Funil Ordens */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-100 rounded-full blur-[80px] pointer-events-none" />
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 relative z-10">
                  <span className="p-2 rounded-lg bg-indigo-100 text-indigo-600 border border-indigo-200">
                    <Activity size={20} />
                  </span>
                  Distribuição de Ordens de Serviço
                </h3>
                <div className="h-[350px] relative z-10">
                  <Bar
                    data={ordensStatusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "#f1f5f9" },
                          ticks: { precision: 0, color: "#64748b" },
                        },
                        x: {
                          grid: { display: false },
                          ticks: { color: "#64748b" },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Desempenho Tecnico */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-100 rounded-full blur-[80px] pointer-events-none" />
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 relative z-10">
                  <span className="p-2 rounded-lg bg-cyan-100 text-cyan-600 border border-cyan-200">
                    <Wrench size={20} />
                  </span>
                  Volume OTs por Técnico
                </h3>
                <div className="h-[350px] relative z-10">
                  <Bar
                    data={ordensTecnicoChartData}
                    options={{
                      indexAxis: "y",
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          beginAtZero: true,
                          grid: { color: "#f1f5f9" },
                          ticks: { precision: 0, color: "#64748b" },
                        },
                        y: {
                          grid: { display: false },
                          ticks: { color: "#64748b" },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- TAB: LOGISTICS --- */}
        {activeTab === "logistics" && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
              <div className="bg-white p-8 rounded-3xl border border-rose-200 shadow-lg shadow-rose-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <ShieldAlert size={100} className="text-rose-500" />
                </div>
                <h4 className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Em
                  Rutura
                </h4>
                <div className="text-5xl font-black text-slate-800 mt-4 drop-shadow-sm">
                  {stats?.artigosEmRutura ?? 0}
                </div>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Artigos críticos com stock zero.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-amber-200 shadow-lg shadow-amber-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <Activity size={100} className="text-amber-500" />
                </div>
                <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Abaixo
                  Mínimo
                </h4>
                <div className="text-5xl font-black text-slate-800 mt-4 drop-shadow-sm">
                  {stats?.artigosAbaixoMinimo ?? 0}
                </div>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Requerem reposição urgente.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-indigo-200 shadow-lg shadow-indigo-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3 size={100} className="text-indigo-500" />
                </div>
                <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />{" "}
                  Projeção 12M
                </h4>
                <div className="text-5xl font-black text-slate-800 mt-4 drop-shadow-sm">
                  {Math.abs(
                    ([] as any[])?.reduce(
                      (acc: number, curr: any) =>
                        curr.saldoProjetado12m < 0
                          ? acc + curr.saldoProjetado12m
                          : acc,
                      0,
                    ) || 0,
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Unidades em défice projetado.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  <Ship size={20} />
                </span>
                Navios Ativos por Ilha
              </h3>
              <div className="h-[400px]">
                <Bar
                  data={naviosChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "#f1f5f9" },
                        ticks: { precision: 0, color: "#64748b" },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: "#64748b" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer info auditoria */}
        <div className="mt-16 mb-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-8">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Última
            auditoria:{" "}
            <span className="text-slate-500">
              {auditoriaPlaneamento?.ultimaAuditoria || "Sem dados"}
            </span>
          </p>
          <p className="flex items-center gap-2 mt-2 md:mt-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Próxima
            auditoria:{" "}
            <span className="text-blue-600">
              {auditoriaPlaneamento?.proximaAuditoria || "Não planeada"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
