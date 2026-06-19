import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { resolveActiveServiceStationId } from "@/lib/station-selection";
import { logAuditoria } from "@/lib/auditoria";
import { syncNextInspectionAgenda } from "@/lib/agenda-sync";
import {
  appendWorkflowTransition,
  ensureOrderForServiceStation,
  canTransitionQueueWorkflowStatus,
  mapWorkflowStatusToOrderStatus,
  mapWorkflowStatusToQueueStatus,
  mapQueueStatusToWorkflowStatus,
  parseOrdemServicoMeta,
  resolveWorkflowStatus,
  toOrdemServicoMetaJson,
  type OrdemWorkflowStatus,
} from "@/lib/ordens-servico";

type QueueStatus = "aguardar" | "agendada" | "progresso" | "a_secar" | "finalizada";
type DeliveryMethod = "cliente" | "transitario" | "navio";
type SaoMiguelPortCall =
  | "Rabo de Peixe"
  | "Ponta Delgada"
  | "Porto Formoso"
  | "Vila Franca do Campo"
  | "Ribeira Quente"
  | "Lagoa";

const DELIVERY_METHODS = new Set<DeliveryMethod>(["cliente", "transitario", "navio"]);
const SAO_MIGUEL_PORT_CALLS = new Set<SaoMiguelPortCall>([
  "Rabo de Peixe",
  "Ponta Delgada",
  "Porto Formoso",
  "Vila Franca do Campo",
  "Ribeira Quente",
  "Lagoa",
]);

type QueueMeta = {
  tecnico?: string;
  observacao?: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  workflowStatus?: OrdemWorkflowStatus;
  workflowTransitions?: Array<{
    id?: string;
    at?: string;
    from?: OrdemWorkflowStatus | null;
    to?: OrdemWorkflowStatus;
    origin?: string;
    message?: string;
    user?: string;
  }>;
  arrivedViaForwarder?: boolean;
  arrivalDate?: string;
  readyForDelivery?: boolean;
  deliveryMethod?: DeliveryMethod;
  saoMiguelPortCall?: SaoMiguelPortCall;
  deliveredAt?: string;
};

function normalizeStatus(value: unknown): QueueStatus {
  const v = String(value || "").trim().toLowerCase();
  if (v === "agendada") return "agendada";
  if (v === "progresso") return "progresso";
  if (v === "a_secar") return "a_secar";
  if (v === "finalizada") return "finalizada";
  return "aguardar";
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "sim", "yes", "y"].includes(raw)) return true;
  if (["0", "false", "nao", "não", "no", "n"].includes(raw)) return false;
  return fallback;
}

function normalizeDeliveryMethod(value: unknown): DeliveryMethod | undefined {
  const normalized = String(value || "").trim().toLowerCase() as DeliveryMethod;
  if (!normalized || !DELIVERY_METHODS.has(normalized)) return undefined;
  return normalized;
}

function normalizeSaoMiguelPortCall(value: unknown): SaoMiguelPortCall | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;

  const exactMatch = Array.from(SAO_MIGUEL_PORT_CALLS).find((item) => item.toLowerCase() === raw.toLowerCase());
  return exactMatch;
}

function parseQueueMeta(raw?: string | null): QueueMeta {
  const text = String(raw || "").trim();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return {
        tecnico: typeof (parsed as any).tecnico === "string" ? (parsed as any).tecnico : undefined,
        observacao: typeof (parsed as any).observacao === "string" ? (parsed as any).observacao : undefined,
        scheduledAt: typeof (parsed as any).scheduledAt === "string" ? (parsed as any).scheduledAt : undefined,
        startedAt: typeof (parsed as any).startedAt === "string" ? (parsed as any).startedAt : undefined,
        finishedAt: typeof (parsed as any).finishedAt === "string" ? (parsed as any).finishedAt : undefined,
        workflowStatus: (parsed as any).workflowStatus,
        workflowTransitions: Array.isArray((parsed as any).workflowTransitions) ? (parsed as any).workflowTransitions : undefined,
        arrivedViaForwarder: parseBoolean((parsed as any).arrivedViaForwarder, false),
        arrivalDate: typeof (parsed as any).arrivalDate === "string" ? (parsed as any).arrivalDate : undefined,
        readyForDelivery: parseBoolean((parsed as any).readyForDelivery, false),
        deliveryMethod: normalizeDeliveryMethod((parsed as any).deliveryMethod),
        saoMiguelPortCall: normalizeSaoMiguelPortCall((parsed as any).saoMiguelPortCall),
        deliveredAt: typeof (parsed as any).deliveredAt === "string" ? (parsed as any).deliveredAt : undefined,
      };
    }
  } catch {
    // legado: string simples de observação
  }

  return { observacao: text };
}

function toMetaJson(meta: QueueMeta) {
  return JSON.stringify({
    tecnico: meta.tecnico || "",
    observacao: meta.observacao || "",
    scheduledAt: meta.scheduledAt || "",
    startedAt: meta.startedAt || "",
    finishedAt: meta.finishedAt || "",
    workflowStatus: meta.workflowStatus || "",
    workflowTransitions: Array.isArray(meta.workflowTransitions) ? meta.workflowTransitions : [],
    arrivedViaForwarder: Boolean(meta.arrivedViaForwarder),
    arrivalDate: meta.arrivalDate || "",
    readyForDelivery: Boolean(meta.readyForDelivery),
    deliveryMethod: meta.deliveryMethod || "",
    saoMiguelPortCall: meta.saoMiguelPortCall || "",
    deliveredAt: meta.deliveredAt || "",
  });
}

function parseServiceStationId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function normalizeStationText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function isAcoresServiceStation(serviceStationId: number | null) {
  if (!serviceStationId || serviceStationId <= 0) return false;

  const station = await prisma.serviceStation.findUnique({
    where: { id: serviceStationId },
    select: { codigo: true, nome: true },
  });

  if (!station) return false;

  const code = normalizeStationText(station.codigo);
  const name = normalizeStationText(station.nome);
  return code === "acores" || name === "acores";
}

async function resolveJangadaIdFromBody(body: Record<string, unknown>) {
  const directRaftId = Number(body?.raftId);
  if (Number.isFinite(directRaftId) && directRaftId > 0) return directRaftId;

  const serial = String(body?.serial || "").trim();
  if (!serial) return null;

  const raft = await prisma.jangada.findFirst({
    where: { serial: { equals: serial, mode: "insensitive" } },
    select: { id: true },
  });

  return raft?.id ?? null;
}

async function resolveQueueTarget(body: Record<string, unknown>) {
  const directId = Number(body?.id);
  if (Number.isFinite(directId) && directId > 0) {
    return prisma.serviceStationQueue.findUnique({ where: { id: directId } });
  }

  const jangadaId = await resolveJangadaIdFromBody(body);
  if (!jangadaId) return null;

  const active = await prisma.serviceStationQueue.findFirst({
    where: {
      jangadaId,
      OR: [
        { status: { not: "finalizada" } },
        { observacoes: { contains: '"deliveredAt":""' } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  if (active) return active;

  return prisma.serviceStationQueue.findFirst({
    where: { jangadaId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

async function listQueue(
  access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>,
  activeStationId: number | null,
) {
  const rows = await prisma.serviceStationQueue.findMany({
    where: activeStationId
      ? { serviceStationId: activeStationId }
      : !access.isAdmin
        ? { serviceStationId: { in: access.allowedStationIds.length ? access.allowedStationIds : [-1] } }
        : undefined,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      serviceStation: {
        select: {
          id: true,
          codigo: true,
          nome: true,
        },
      },
      ordemServico: {
        select: {
          id: true,
          numeroOrdem: true,
          status: true,
          metadados: true,
        },
      },
    },
  });

  const raftIds = Array.from(new Set(rows.map((r) => r.jangadaId).filter(Boolean)));
  const rafts = raftIds.length
    ? await prisma.jangada.findMany({
        where: { id: { in: raftIds } },
        select: {
          id: true,
          serial: true,
          brand: true,
          model: true,
          shipNameManual: true,
          owner: true,
        },
      })
    : [];

  const raftById = new Map(rafts.map((r) => [r.id, r]));

  return rows.map((row) => {
    const raft = raftById.get(row.jangadaId);
    const meta = parseQueueMeta(row.observacoes);
    const orderMeta = parseOrdemServicoMeta(row.ordemServico?.metadados);
    const workflowStatus = resolveWorkflowStatus({
      meta: {
        ...orderMeta,
        workflowStatus: meta.workflowStatus || orderMeta.workflowStatus,
      },
      queueStatus: row.status,
      orderStatus: row.ordemServico?.status,
    });

    return {
      queueId: row.id,
      raftId: row.jangadaId,
      serviceStationId: row.serviceStationId,
      serviceStation: row.serviceStation
        ? {
            id: row.serviceStation.id,
            codigo: row.serviceStation.codigo,
            nome: row.serviceStation.nome,
          }
        : null,
      serial: raft?.serial || "",
      model: `${raft?.brand || ""} ${raft?.model || ""}`.trim() || raft?.model || "Modelo não definido",
      shipName: String(raft?.shipNameManual || raft?.owner || "Sem navio"),
      tecnico: meta.tecnico || "",
      observacao: meta.observacao || "",
      arrivedViaForwarder: Boolean(meta.arrivedViaForwarder),
      arrivalDate: meta.arrivalDate || (row.dataChegada?.toISOString().slice(0, 10) || ""),
      readyForDelivery: Boolean(meta.readyForDelivery),
      deliveryMethod: meta.deliveryMethod || null,
      saoMiguelPortCall: meta.saoMiguelPortCall || null,
      delivered: Boolean(meta.deliveredAt),
      deliveredAt: meta.deliveredAt || null,
      receivedAt: row.dataChegada?.toISOString() || row.createdAt.toISOString(),
      status: normalizeStatus(row.status),
      workflowStatus,
      scheduledAt: meta.scheduledAt || undefined,
      startedAt: meta.startedAt || undefined,
      finishedAt: meta.finishedAt || undefined,
      expectedDeliveryDate: row.dataPrevistaEntrega ? row.dataPrevistaEntrega.toISOString().slice(0, 10) : null,
      ordemServicoId: row.ordemServico?.id || row.ordemServicoId || null,
      numeroOrdem: row.ordemServico?.numeroOrdem || "",
      ordemStatus: row.ordemServico?.status || null,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const activeStationId = resolveActiveServiceStationId(req, access);
    const items = await listQueue(access, activeStationId);
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao listar estação de serviço." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const activeStationId = resolveActiveServiceStationId(req, access);
    const jangadaId = await resolveJangadaIdFromBody(body);
    if (!jangadaId) {
      return NextResponse.json({ error: "raftId inválido." }, { status: 400 });
    }

    const requestedWorkflowStatus = resolveWorkflowStatus({
      meta: { workflowStatus: body?.workflowStatus as OrdemWorkflowStatus | undefined },
      queueStatus: body?.status,
    }) || "entrada_estacao";
    const status = normalizeStatus(mapWorkflowStatusToQueueStatus(requestedWorkflowStatus));
    const nowIso = new Date().toISOString();
    const arrivalDate = String(body?.arrivalDate || "").trim() || nowIso.slice(0, 10);
    const meta = appendWorkflowTransition({
      tecnico: String(body?.tecnico || "").trim() || undefined,
      observacao: String(body?.observacao || "").trim() || undefined,
      scheduledAt: status === "agendada" ? String(body?.scheduledAt || nowIso) : undefined,
      startedAt: status === "progresso" ? String(body?.startedAt || nowIso) : undefined,
      finishedAt: status === "finalizada" ? String(body?.finishedAt || nowIso) : undefined,
      arrivedViaForwarder: parseBoolean(body?.arrivedViaForwarder, false),
      arrivalDate,
      readyForDelivery: status === "finalizada" ? true : parseBoolean(body?.readyForDelivery, false),
      deliveryMethod: normalizeDeliveryMethod(body?.deliveryMethod),
      saoMiguelPortCall: normalizeSaoMiguelPortCall(body?.saoMiguelPortCall),
    }, requestedWorkflowStatus, {
      origin: "queue",
      message: `Entrada criada na estação com workflow ${requestedWorkflowStatus}.`,
      user: String(body?.tecnico || "").trim() || "sistema",
    }) satisfies QueueMeta;

    const expectedDeliveryDateRaw = String(body?.expectedDeliveryDate || "").trim();
    const expectedDeliveryDate = expectedDeliveryDateRaw ? new Date(expectedDeliveryDateRaw) : null;
    const hasServiceStationId = Object.prototype.hasOwnProperty.call(body, "serviceStationId");
    const parsedServiceStationId = parseServiceStationId(body?.serviceStationId);
    const fallbackAllowedStationId = activeStationId || access.stationId || access.allowedStationIds[0] || null;
    const enforcedServiceStationId = fallbackAllowedStationId;

    if (!enforcedServiceStationId) {
      return NextResponse.json({ error: "Conta sem estação de serviço associada." }, { status: 403 });
    }

    if (status === "aguardar") {
      const acoresAllowed = await isAcoresServiceStation(enforcedServiceStationId);
      if (!acoresAllowed) {
        return NextResponse.json(
          { error: "Só é permitido colocar jangadas em 'aguardar inspeção' na estação dos Açores." },
          { status: 403 },
        );
      }
    }

    const created = await prisma.serviceStationQueue.create({
      data: {
        jangadaId,
        status,
        serviceStationId: enforcedServiceStationId,
        dataPrevistaEntrega: expectedDeliveryDate,
        observacoes: toMetaJson(meta),
      },
    });

    const ordemServico = await ensureOrderForServiceStation({
      jangadaId,
      queueId: created.id,
      status,
      workflowStatus: requestedWorkflowStatus,
      tecnicoResponsavel: meta.tecnico,
      observacao: meta.observacao,
      expectedDeliveryDate,
    });

    if (ordemServico && created.ordemServicoId !== ordemServico.id) {
      await prisma.serviceStationQueue.update({
        where: { id: created.id },
        data: { ordemServicoId: ordemServico.id },
      });
    }

    if (enforcedServiceStationId) {
      const stationIdToApply = enforcedServiceStationId;
      await prisma.jangada.update({
        where: { id: jangadaId },
        data: { serviceStationId: stationIdToApply },
      });

      const orderId = ordemServico?.id || created.ordemServicoId;
      if (orderId) {
        await prisma.ordemServico.update({
          where: { id: orderId },
          data: { serviceStationId: stationIdToApply },
        });
      }
    }

    await logAuditoria({
      tabela: "ServiceStationQueue",
      tipoOperacao: "CREATE",
      idRegisto: created.id,
      descricao: `Entrada na estação de serviço (jangadaId=${jangadaId})`,
      dadosDepois: created,
    });

    const all = await listQueue(access, activeStationId);
    const item = all.find((q) => q.queueId === created.id);
    return NextResponse.json(item || null, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao criar entrada na estação." }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const activeStationId = resolveActiveServiceStationId(req, access);
    const before = await resolveQueueTarget(body);
    if (!before) {
      return NextResponse.json({ error: "Entrada não encontrada." }, { status: 404 });
    }

    if (activeStationId && Number(before.serviceStationId || 0) !== Number(activeStationId)) {
      return NextResponse.json({ error: "Sem permissão para atualizar esta estação." }, { status: 403 });
    }

    if (!activeStationId && !access.isAdmin && !access.allowedStationIds.includes(Number(before.serviceStationId || 0))) {
      return NextResponse.json({ error: "Sem permissão para atualizar esta estação." }, { status: 403 });
    }

    const id = before.id;

    const previousMeta = parseQueueMeta(before.observacoes);
    const hasServiceStationId = Object.prototype.hasOwnProperty.call(body, "serviceStationId");
    const parsedServiceStationId = parseServiceStationId(body?.serviceStationId);
    const fallbackAllowedStationId = activeStationId || access.stationId || access.allowedStationIds[0] || null;
    const enforcedServiceStationId = fallbackAllowedStationId;
    const requestedWorkflowStatus = resolveWorkflowStatus({
      meta: {
        workflowStatus: Object.prototype.hasOwnProperty.call(body, "workflowStatus") ? (body?.workflowStatus as OrdemWorkflowStatus | undefined) : previousMeta.workflowStatus,
      },
      queueStatus: Object.prototype.hasOwnProperty.call(body, "status") ? body?.status : before.status,
      orderStatus: before.ordemServicoId ? undefined : null,
    }) || previousMeta.workflowStatus || mapQueueStatusToWorkflowStatus(before.status) || "entrada_estacao";
    const status = normalizeStatus(mapWorkflowStatusToQueueStatus(requestedWorkflowStatus));

    if (!canTransitionQueueWorkflowStatus(before.status, status)) {
      return NextResponse.json(
        {
          error:
            "Transição de estado inválida. Use o fluxo simples: Receção/Aguardar → Agendada → Em inspeção → A secar → Pronta para entrega.",
        },
        { status: 400 },
      );
    }

    const wasFinalizedBefore = normalizeStatus(before.status) === "finalizada";
    const autoReadyForDelivery = status === "finalizada"
      ? true
      : wasFinalizedBefore
        ? false
        : undefined;

    const nextMeta = appendWorkflowTransition({
      tecnico: Object.prototype.hasOwnProperty.call(body, "tecnico") ? String(body?.tecnico || "").trim() || undefined : previousMeta.tecnico,
      observacao: Object.prototype.hasOwnProperty.call(body, "observacao") ? String(body?.observacao || "").trim() || undefined : previousMeta.observacao,
      scheduledAt: Object.prototype.hasOwnProperty.call(body, "scheduledAt") ? String(body?.scheduledAt || "").trim() || undefined : previousMeta.scheduledAt,
      startedAt: Object.prototype.hasOwnProperty.call(body, "startedAt") ? String(body?.startedAt || "").trim() || undefined : previousMeta.startedAt,
      finishedAt: Object.prototype.hasOwnProperty.call(body, "finishedAt") ? String(body?.finishedAt || "").trim() || undefined : previousMeta.finishedAt,
      arrivedViaForwarder: Object.prototype.hasOwnProperty.call(body, "arrivedViaForwarder")
        ? parseBoolean(body?.arrivedViaForwarder, false)
        : Boolean(previousMeta.arrivedViaForwarder),
      arrivalDate: Object.prototype.hasOwnProperty.call(body, "arrivalDate")
        ? String(body?.arrivalDate || "").trim() || undefined
        : previousMeta.arrivalDate,
      readyForDelivery: Object.prototype.hasOwnProperty.call(body, "readyForDelivery")
        ? parseBoolean(body?.readyForDelivery, false)
        : autoReadyForDelivery ?? Boolean(previousMeta.readyForDelivery),
      deliveryMethod: Object.prototype.hasOwnProperty.call(body, "deliveryMethod")
        ? normalizeDeliveryMethod(body?.deliveryMethod)
        : previousMeta.deliveryMethod,
      saoMiguelPortCall: Object.prototype.hasOwnProperty.call(body, "saoMiguelPortCall")
        ? normalizeSaoMiguelPortCall(body?.saoMiguelPortCall)
        : previousMeta.saoMiguelPortCall,
      workflowTransitions: previousMeta.workflowTransitions,
      workflowStatus: previousMeta.workflowStatus,
    }, requestedWorkflowStatus, {
      origin: "queue",
      message: `Workflow da estação atualizado para ${requestedWorkflowStatus}.`,
      user: (Object.prototype.hasOwnProperty.call(body, "tecnico") ? String(body?.tecnico || "").trim() : previousMeta.tecnico) || "sistema",
    }) satisfies QueueMeta;

    const expectedDeliveryDate = Object.prototype.hasOwnProperty.call(body, "expectedDeliveryDate")
      ? (String(body?.expectedDeliveryDate || "").trim() ? new Date(String(body?.expectedDeliveryDate)) : null)
      : before.dataPrevistaEntrega;

    if (status === "aguardar") {
      const stationIdForRuleCheck = enforcedServiceStationId || Number(before.serviceStationId || 0) || null;
      const acoresAllowed = await isAcoresServiceStation(stationIdForRuleCheck);
      if (!acoresAllowed) {
        return NextResponse.json(
          { error: "Só é permitido manter/colocar estado 'aguardar inspeção' na estação dos Açores." },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.serviceStationQueue.update({
      where: { id },
      data: {
        status,
        observacoes: toMetaJson(nextMeta),
        dataPrevistaEntrega: expectedDeliveryDate,
        ...(enforcedServiceStationId
          ? { serviceStationId: enforcedServiceStationId }
          : {}),
      },
    });

    const linkedOrderId = updated.ordemServicoId || before.ordemServicoId || null;
    if (linkedOrderId) {
      const beforeOrder = await prisma.ordemServico.findUnique({ where: { id: linkedOrderId } });
      if (beforeOrder) {
        const orderMeta = parseOrdemServicoMeta(beforeOrder.metadados);
        const nextOrderMeta = appendWorkflowTransition({
          ...orderMeta,
          origem: orderMeta.origem || "service_station",
          queueId: updated.id,
          observacao: nextMeta.observacao || orderMeta.observacao,
        }, requestedWorkflowStatus, {
          origin: "queue",
          message: `Workflow sincronizado a partir da estação para ${requestedWorkflowStatus}.`,
          user: nextMeta.tecnico || "sistema",
        });
        await prisma.ordemServico.update({
          where: { id: linkedOrderId },
          data: {
            status: mapWorkflowStatusToOrderStatus(requestedWorkflowStatus),
            ...(enforcedServiceStationId
              ? { serviceStationId: enforcedServiceStationId }
              : {}),
            tecnicoResponsavel: nextMeta.tecnico || beforeOrder.tecnicoResponsavel,
            descricao: nextMeta.observacao || beforeOrder.descricao,
            dataPrevista: expectedDeliveryDate,
            dataInicio: status === "progresso" ? beforeOrder.dataInicio || new Date() : beforeOrder.dataInicio,
            dataConclusao: status === "finalizada" ? beforeOrder.dataConclusao || new Date() : beforeOrder.dataConclusao,
            metadados: toOrdemServicoMetaJson(nextOrderMeta),
          },
        });
      }
    } else {
      const ensuredOrder = await ensureOrderForServiceStation({
        jangadaId: before.jangadaId,
        queueId: updated.id,
        status,
        workflowStatus: requestedWorkflowStatus,
        tecnicoResponsavel: nextMeta.tecnico,
        observacao: nextMeta.observacao,
        expectedDeliveryDate,
      });

      if (ensuredOrder) {
        await prisma.serviceStationQueue.update({
          where: { id: updated.id },
          data: { ordemServicoId: ensuredOrder.id },
        });

        if (enforcedServiceStationId) {
          await prisma.ordemServico.update({
            where: { id: ensuredOrder.id },
            data: { serviceStationId: enforcedServiceStationId },
          });
        }
      }
    }

    if (enforcedServiceStationId) {
      await prisma.jangada.update({
        where: { id: before.jangadaId },
        data: { serviceStationId: enforcedServiceStationId },
      });
    }

    if (status === "finalizada" && !wasFinalizedBefore) {
      try {
        await syncNextInspectionAgenda({
          jangadaId: before.jangadaId,
          tecnico: nextMeta.tecnico,
        });
      } catch (agendaError) {
        console.error("Falha ao sincronizar próxima inspeção na agenda:", agendaError);
      }
    }

    await logAuditoria({
      tabela: "ServiceStationQueue",
      tipoOperacao: "UPDATE",
      idRegisto: id,
      descricao: `Atualização da estação de serviço (status=${status})`,
      dadosAntes: before,
      dadosDepois: updated,
    });

    const all = await listQueue(access, activeStationId);
    const item = all.find((q) => q.queueId === id);
    return NextResponse.json(item || null);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao atualizar estação." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const url = new URL(req.url);
    const activeStationId = resolveActiveServiceStationId(req, access);
    const id = Number(url.searchParams.get("id"));
    const raftId = url.searchParams.get("raftId");
    const serial = url.searchParams.get("serial");
    const before = Number.isFinite(id) && id > 0
      ? await prisma.serviceStationQueue.findUnique({ where: { id } })
      : await resolveQueueTarget({ raftId, serial });
    if (!before) {
      return NextResponse.json({ error: "Entrada não encontrada." }, { status: 404 });
    }

    if (activeStationId && Number(before.serviceStationId || 0) !== Number(activeStationId)) {
      return NextResponse.json({ error: "Sem permissão para remover esta entrada." }, { status: 403 });
    }

    if (!activeStationId && !access.isAdmin && !access.allowedStationIds.includes(Number(before.serviceStationId || 0))) {
      return NextResponse.json({ error: "Sem permissão para remover esta entrada." }, { status: 403 });
    }

    const targetId = before.id;

    await prisma.serviceStationQueue.delete({ where: { id: targetId } });

    await logAuditoria({
      tabela: "ServiceStationQueue",
      tipoOperacao: "DELETE",
      idRegisto: targetId,
      descricao: "Remoção da entrada da estação de serviço",
      dadosAntes: before,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao remover entrada da estação." }, { status: 400 });
  }
}
