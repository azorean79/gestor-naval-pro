export type StatsPayload = {
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
  inspecoesPorMes: { label: string; total: number }[];
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

export type NeedsPayload = {
  stockNeeds?: Array<{
    stockId?: number;
    saldoProjetado12m?: number;
    necessidade12m?: number;
    referencia?: string;
    nome?: string;
  }>;
  needs?: Array<{
    referencia?: string;
    nome?: string;
    reorderQty?: number;
    hasValidity?: boolean;
    saldoProjetado12m?: number;
    necessidade12m?: number;
    fornecedor?: string;
    orderLimitDate?: string;
  }>;
  summary?: {
    itemsInAlert?: number;
    totalReorderCost?: number;
    coveragePercent?: number;
    expiringRafts30d?: number;
    expiringRafts90d?: number;
    quantidadeTotalNecessaria12m?: number;
    artigosComValidadeAte12Meses?: number;
    artigosVencidos?: number;
    necessidadesMensaisTotais?: Array<{ month: string; quantidade?: number; qty?: number }>;
  };
};

export type AuditoriaPlaneamentoPayload = {
  ultimaAuditoria?: string | null;
  proximaAuditoria?: string | null;
};

export type OrdensKpisPayload = {
  total: number;
  delayed: number;
  leadTimeMedioMinutos: number | null;
  byStatus: Array<{ status: string; total: number }>;
  byTecnico: Array<{ tecnico: string; total: number }>;
};

export type OtOperationalAlert = {
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

export type OtOperationalAlertsPayload = {
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

export type JangadaAlertPayload = {
  dataProxInspecao?: string | null;
  cylinderDataProxTeste?: string | null;
  hruValidade?: string | null;
};

export type AlertItem = {
  tipo: "inspecao" | "certificado" | "assistencia" | string;
  id: number;
  referencia: string;
  data?: string | null;
  jangadaId?: number | null;
  jangadaSerial?: string | null;
  status?: string | null;
  sourceYear?: number | null;
  ordemId?: number | null;
};

export type AlertsPayload = {
  total: number;
  inspecoes: number;
  certificados: number;
  pedidosAssistencia?: number;
  alertas: AlertItem[];
};

export type AgendaMetricsPayload = {
  total: number;
  completionRate: number;
  averageDuration: number;
  upcomingNext7Days: number;
  overdueCount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  topResponsavel: { name: string; count: number }[];
};

export type DataQualityIssue = {
  key: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  count: number;
  href: string;
};

export type DataQualityPayload = {
  summary: {
    totalOpen: number;
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
  };
  issues: DataQualityIssue[];
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};
