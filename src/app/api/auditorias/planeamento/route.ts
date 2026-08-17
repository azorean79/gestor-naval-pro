import { NextRequest, NextResponse } from "next/server";
import { logAuditoria } from "@/lib/auditoria";
import { readAuditoriaJson, writeAuditoriaJson } from "@/lib/auditorias-storage";

type PlaneamentoAuditoria = {
  ultimaAuditoria: string | null;
  updatedAt: string;
};

const STORE_FILE = "_meta/planeamento.json";

function addOneYearIso(value?: string | null): string | null {
  if (!value) return null;
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return null;
  const next = new Date(base);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

function normalizeDateInput(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`).toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function ensureStore() {
  return readAuditoriaJson<PlaneamentoAuditoria>(STORE_FILE, {
    ultimaAuditoria: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function GET() {
  try {
    const current = await ensureStore();
    return NextResponse.json({
      ultimaAuditoria: current.ultimaAuditoria,
      proximaAuditoria: addOneYearIso(current.ultimaAuditoria),
      updatedAt: current.updatedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao obter planeamento da auditoria" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const ultimaAuditoria = normalizeDateInput(payload?.ultimaAuditoria);

    const current = await ensureStore();
    const nextValue: PlaneamentoAuditoria = {
      ultimaAuditoria,
      updatedAt: new Date().toISOString(),
    };

    await writeAuditoriaJson(STORE_FILE, nextValue);

    await logAuditoria({
      tabela: "AuditoriaPlaneamento",
      tipoOperacao: "UPDATE",
      idRegisto: 1,
      descricao: "Atualização manual da data da última auditoria.",
      usuario: "sistema",
      dadosAntes: current,
      dadosDepois: nextValue,
    });

    return NextResponse.json({
      ultimaAuditoria: nextValue.ultimaAuditoria,
      proximaAuditoria: addOneYearIso(nextValue.ultimaAuditoria),
      updatedAt: nextValue.updatedAt,
      message: "Data da última auditoria atualizada com sucesso.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar planeamento da auditoria" },
      { status: 500 }
    );
  }
}
