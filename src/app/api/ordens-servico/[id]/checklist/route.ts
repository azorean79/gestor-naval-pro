import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendOrdemServicoLog, parseOrdemServicoMeta, toOrdemServicoMetaJson } from "@/lib/ordens-servico";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function parseIdFromRequest(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const rawId = segments[segments.length - 2];
  const id = Number(rawId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

type ChecklistPhase = "pre" | "intervencao" | "validacao";

function normalizeChecklistPhase(value: unknown): ChecklistPhase {
  const phase = String(value || "").trim().toLowerCase();
  if (phase === "intervencao" || phase === "validacao") return phase;
  return "pre";
}

function parseChecklistItemId(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

async function fetchChecklistRows(ordemServicoId: number) {
  return (prisma as any).ordemServicoChecklistItem.findMany({
    where: { ordemServicoId },
    orderBy: [{ id: "asc" }],
    select: {
      id: true,
      phase: true,
      category: true,
      label: true,
      done: true,
      barcode: true,
      scannedAt: true,
      photoUrl: true,
      notes: true,
      isDefect: true,
      originalDiagramRef: true,
      updatedAt: true,
      updatedBy: true,
      updatedById: true,
      updatedByTecnico: {
        select: { nome: true },
      },
    },
  });
}

function serializeChecklistRows(rows: Array<any>) {
  return rows.map((item) => ({
    id: String(item.id),
    phase: item.phase,
    category: item.category || null,
    label: item.label,
    done: Boolean(item.done),
    barcode: item.barcode || null,
    scannedAt: item.scannedAt?.toISOString?.() || null,
    photoUrl: item.photoUrl || null,
    notes: item.notes || null,
    isDefect: Boolean(item.isDefect),
    originalDiagramRef: item.originalDiagramRef || null,
    updatedAt: item.updatedAt?.toISOString?.() || null,
    updatedBy: item.updatedBy || item.updatedByTecnico?.nome || null,
    updatedById: item.updatedById ?? null,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const rows = await fetchChecklistRows(id);
    return NextResponse.json({ items: serializeChecklistRows(rows) });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao obter checklist da OT.");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = parseIdFromRequest(req);
    if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const itemId = parseChecklistItemId(body.itemId);
    const phase = normalizeChecklistPhase(body.phase);
    const label = String(body.label || "").trim();
    const done = Object.prototype.hasOwnProperty.call(body, "done") ? Boolean(body.done) : undefined;
    
    // Novas colunas da checklist digital
    const category = Object.prototype.hasOwnProperty.call(body, "category") ? (String(body.category || "").trim() || null) : undefined;
    const barcode = Object.prototype.hasOwnProperty.call(body, "barcode") ? (String(body.barcode || "").trim() || null) : undefined;
    const photoUrl = Object.prototype.hasOwnProperty.call(body, "photoUrl") ? (String(body.photoUrl || "").trim() || null) : undefined;
    const notes = Object.prototype.hasOwnProperty.call(body, "notes") ? (String(body.notes || "").trim() || null) : undefined;
    const isDefect = Object.prototype.hasOwnProperty.call(body, "isDefect") ? Boolean(body.isDefect) : undefined;
    
    const updatedBy = String(body.updatedBy || "").trim() || "operador";
    const updatedById = parseChecklistItemId(body.updatedById);

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      select: { id: true, metadados: true },
    });
    if (!order) return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });

    const updatedAt = new Date();

    const updatedItem = await prisma.$transaction(async (tx) => {
      let target: any = null;

      if (itemId) {
        target = await (tx as any).ordemServicoChecklistItem.findFirst({
          where: { id: itemId, ordemServicoId: id },
          select: { id: true, label: true, phase: true },
        });
      }

      if (!target && label) {
        target = await (tx as any).ordemServicoChecklistItem.findFirst({
          where: { ordemServicoId: id, label },
          select: { id: true, label: true, phase: true },
          orderBy: [{ id: "asc" }],
        });
      }

      if (!target && !label) {
        throw new Error("Item de checklist inválido.");
      }

      if (target) {
        await (tx as any).ordemServicoChecklistItem.update({
          where: { id: target.id },
          data: {
            ...(done !== undefined && { done }),
            ...(category !== undefined && { category }),
            ...(barcode !== undefined && { barcode, scannedAt: barcode ? new Date() : null }),
            ...(photoUrl !== undefined && { photoUrl }),
            ...(notes !== undefined && { notes }),
            ...(isDefect !== undefined && { isDefect }),
            updatedAt,
            updatedBy,
            updatedById,
          },
        });
      } else {
        target = await (tx as any).ordemServicoChecklistItem.create({
          data: {
            ordemServicoId: id,
            phase,
            category: category ?? null,
            label,
            done: done ?? false,
            barcode: barcode ?? null,
            scannedAt: barcode ? new Date() : null,
            photoUrl: photoUrl ?? null,
            notes: notes ?? null,
            isDefect: isDefect ?? false,
            updatedAt,
            updatedBy,
            updatedById,
          },
          select: { id: true, label: true, phase: true },
        });
      }

      if (done !== undefined) {
        const meta = parseOrdemServicoMeta(order.metadados);
        const nextMeta = appendOrdemServicoLog(meta, {
          type: "CHECKLIST_UPDATE",
          message: `Checklist ${done ? "concluído" : "reaberto"}: ${target.label}.`,
          user: updatedBy,
          at: updatedAt.toISOString(),
        });
  
        await tx.ordemServico.update({
          where: { id },
          data: {
            metadados: toOrdemServicoMetaJson(nextMeta),
          },
        });
  
        await (tx as any).ordemServicoLog.create({
          data: {
            ordemServicoId: id,
            at: updatedAt,
            type: "CHECKLIST_UPDATE",
            message: `Checklist ${done ? "concluído" : "reaberto"}: ${target.label}.`,
            user: updatedBy,
            tecnicoId: updatedById,
          },
        });
      }

      return target;
    });

    const rows = await fetchChecklistRows(id);
    return NextResponse.json({
      updatedItemId: String(updatedItem.id),
      items: serializeChecklistRows(rows),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar checklist da OT.";
    if (message.includes("inválido")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return buildDatabaseErrorResponse(error, "Erro ao atualizar checklist da OT.");
  }
}
