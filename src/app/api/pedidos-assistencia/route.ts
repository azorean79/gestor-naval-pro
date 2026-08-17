import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth";
import { getAccessContext } from "@/lib/access-control";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const ESTADOS_PEDIDO_ASSISTENCIA = [
  "novo",
  "em_atendimento",
  "concluido",
  "arquivado",
] as const;

function authWebhook(req: NextRequest): { ok: boolean; error?: NextResponse } {
  const envSecret = (process.env.ZAPIER_ASSISTENCIA_TOKEN || "").trim();
  if (!envSecret) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "ZAPIER_ASSISTENCIA_TOKEN não está configurado no ambiente." },
        { status: 503 },
      ),
    };
  }
  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get("token") || "";
  const authHeader = req.headers.get("authorization") || "";
  const ok = querySecret === envSecret || authHeader === `Bearer ${envSecret}`;
  if (!ok) {
    return { ok: false, error: NextResponse.json({ error: "Token inválido." }, { status: 403 }) };
  }
  return { ok: true };
}

function cleanString(value: unknown): string | undefined {
  const str = String(value ?? "").trim();
  return str ? str : undefined;
}

function cleanOptionalString(value: unknown): string | undefined {
  const str = String(value ?? "").trim();
  return str ? str.slice(0, 500) : undefined;
}

// POST /api/pedidos-assistencia
// Webhook para receber pedidos de assistência vindos do Zapier Forms.
// Autenticação: ?token=<ZAPIER_ASSISTENCIA_TOKEN> ou Authorization: Bearer <token>.
export async function POST(req: NextRequest) {
  const guard = authWebhook(req);
  if (!guard.ok) return guard.error;

  let payload: Record<string, unknown>;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const raw = await req.text();
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    } else {
      payload = (await req.json()) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const descricao = cleanString(payload.descricao ?? payload.mensagem ?? payload.message);
  if (!descricao) {
    return NextResponse.json(
      { error: "Campo obrigatório em falta: descricao." },
      { status: 400 },
    );
  }

  const nome = cleanOptionalString(payload.nome ?? payload.name);
  const email = cleanOptionalString(payload.email);
  const telefone = cleanOptionalString(payload.telefone ?? payload.phone ?? payload.telemovel);
  const navio = cleanOptionalString(payload.navio ?? payload.ship ?? payload.embarcacao);
  const jangadaSerial = cleanOptionalString(
    payload.jangadaSerial ?? payload.jangada ?? payload.serial ?? payload.raftSerial,
  );
  const tipoAssistencia = cleanOptionalString(
    payload.tipoAssistencia ?? payload.tipo ?? payload.tipoAssistencia,
  );
  const dataPreferida = cleanOptionalString(payload.dataPreferida ?? payload.data);
  const origem = cleanOptionalString(payload.origem) || "zapier";
  const serviceStationIdRaw = Number(payload.serviceStationId);
  const serviceStationId = Number.isFinite(serviceStationIdRaw) && serviceStationIdRaw > 0
    ? serviceStationIdRaw
    : null;

  const knownKeys = new Set([
    "nome", "name", "email", "telefone", "phone", "telemovel", "navio", "ship",
    "embarcacao", "jangadaSerial", "jangada", "serial", "raftSerial", "tipoAssistencia",
    "tipo", "descricao", "mensagem", "message", "dataPreferida", "data", "origem",
    "serviceStationId", "submit", "Submit",
  ]);
  const metadados: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!knownKeys.has(key) && value !== undefined && value !== null && value !== "") {
      metadados[key] = value;
    }
  }

  try {
    const created = await prisma.pedidoAssistencia.create({
      data: {
        nome,
        email,
        telefone,
        navio,
        jangadaSerial,
        tipoAssistencia,
        descricao,
        dataPreferida,
        origem,
        serviceStationId,
        metadados: Object.keys(metadados).length > 0 ? JSON.stringify(metadados) : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: created.id,
        pedido: {
          id: created.id,
          nome: created.nome,
          email: created.email,
          jangadaSerial: created.jangadaSerial,
          tipoAssistencia: created.tipoAssistencia,
          estado: created.estado,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/pedidos-assistencia]", error);
    return NextResponse.json({ error: "Não foi possível guardar o pedido." }, { status: 500 });
  }
}

// GET /api/pedidos-assistencia (admin) — lista pedidos, ?estado=novo&limite=50
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: getAuthSecret() });
  if (!token?.sub && !token?.email) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }
  const tokenRole = String(token?.role || "USER");
  const role = tokenRole === "ADMIN" ? "ADMIN" : tokenRole === "CLIENTE" ? "CLIENTE" : "USER";
  if (role === "CLIENTE") {
    return NextResponse.json({ error: "Apenas utilizadores internos." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado")?.trim() || undefined;
  const limiteRaw = Number(searchParams.get("limite"));
  const limite = Number.isFinite(limiteRaw) && limiteRaw > 0 ? Math.min(500, Math.round(limiteRaw)) : 50;

  try {
    const where = estado ? { estado } : undefined;
    const pedidos = await prisma.pedidoAssistencia.findMany({
      where,
      include: {
        ordensServico: {
          select: { id: true, numeroOrdem: true, status: true },
          orderBy: { id: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limite,
    });
    const count = await prisma.pedidoAssistencia.count({ where });
    return NextResponse.json({ total: pedidos.length, count, pedidos });
  } catch (error) {
    console.error("[GET /api/pedidos-assistencia]", error);
    return NextResponse.json({ error: "Erro ao listar pedidos." }, { status: 500 });
  }
}

// PATCH /api/pedidos-assistencia (admin) — atualizar estado/dados de um pedido.
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: getAuthSecret() });
  if (!token?.sub && !token?.email) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
  }
  const tokenRole = String(token?.role || "USER");
  const role = tokenRole === "ADMIN" ? "ADMIN" : tokenRole === "CLIENTE" ? "CLIENTE" : "USER";
  if (role === "CLIENTE") {
    return NextResponse.json({ error: "Apenas utilizadores internos." }, { status: 403 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const id = Number(payload.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Campo obrigatório em falta: id." }, { status: 400 });
  }

  const data: Prisma.PedidoAssistenciaUpdateInput = {};

  if (payload.estado !== undefined) {
    const estado = String(payload.estado).trim();
    if (!(ESTADOS_PEDIDO_ASSISTENCIA as readonly string[]).includes(estado)) {
      return NextResponse.json(
        { error: `Estado inválido. Válidos: ${ESTADOS_PEDIDO_ASSISTENCIA.join(", ")}.` },
        { status: 400 },
      );
    }
    data.estado = estado;
  }

  for (const field of [
    "nome",
    "email",
    "telefone",
    "navio",
    "jangadaSerial",
    "tipoAssistencia",
    "dataPreferida",
  ] as const) {
    if (payload[field] !== undefined && payload[field] !== null) {
      const value = cleanOptionalString(payload[field]);
      if (value !== undefined) data[field] = value;
    }
  }

  if (payload.descricao !== undefined && payload.descricao !== null) {
    const descricao = cleanString(payload.descricao);
    if (!descricao) {
      return NextResponse.json({ error: "Descrição não pode ficar vazia." }, { status: 400 });
    }
    data.descricao = descricao;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Sem alterações para guardar." }, { status: 400 });
  }

  try {
    const updated = await prisma.pedidoAssistencia.update({ where: { id }, data });
    return NextResponse.json({ success: true, pedido: updated });
  } catch (error) {
    console.error("[PATCH /api/pedidos-assistencia]", error);
    return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
}
