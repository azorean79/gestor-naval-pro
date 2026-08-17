import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateNumeroOrdem,
  parseOrdemServicoMeta,
  toOrdemServicoMetaJson,
  appendOrdemServicoLog,
} from "@/lib/ordens-servico";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const sourceId = Number(body?.sourceId);

    if (!Number.isFinite(sourceId) || sourceId <= 0) {
      return NextResponse.json(
        { error: "sourceId inválido." },
        { status: 400 },
      );
    }

    // 1. Load the source order with all relations
    const source = await prisma.ordemServico.findUnique({
      where: { id: sourceId },
      include: {
        checklistItems: true,
        ordemJangadas: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Ordem de serviço de origem não encontrada." },
        { status: 404 },
      );
    }

    // 2. Generate a new numero de ordem
    const numeroOrdem = await generateNumeroOrdem(new Date());

    // 3. Parse and clean metadados — keep structure but clear transient data
    const sourceMeta = parseOrdemServicoMeta(source.metadados);
    const clonedMeta = {
      ...sourceMeta,
      // Clear runtime/transient data
      materials: [],
      timeEntries: [],
      workflowStatus: undefined,
      workflowTransitions: [],
      logs: [],
      closureSnapshot: undefined,
      totais: undefined,
      linhas: undefined,
      queueId: undefined,
      // Keep structural data
      origem: "clone",
      observacao: sourceMeta.observacao
        ? `[Duplicado de ${source.numeroOrdem}] ${sourceMeta.observacao}`
        : `Duplicado da OT ${source.numeroOrdem}`,
      // Keep checklist items as unchecked
      checklistItems: Array.isArray(sourceMeta.checklistItems)
        ? sourceMeta.checklistItems.map((item) => ({
            ...item,
            done: false,
            updatedAt: undefined,
            updatedBy: undefined,
          }))
        : [],
    };

    // Add a log entry about the clone
    const metaWithLog = appendOrdemServicoLog(clonedMeta, {
      type: "CLONE",
      message: `OT duplicada a partir de ${source.numeroOrdem} (ID: ${source.id}).`,
      user: "sistema",
    });

    // 4. Create the new order in a transaction
    const created = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.ordemServico.create({
        data: {
          numeroOrdem,
          serviceStationId: source.serviceStationId,
          jangadaId: source.jangadaId,
          shipId: source.shipId,
          clienteId: source.clienteId,
          tecnicoId: source.tecnicoId,
          inspecaoId: null, // Reset — new order, no inspection linked
          tipo: source.tipo,
          prioridade: source.prioridade,
          status: "pendente", // Reset status
          descricao: source.descricao,
          tecnicoResponsavel: source.tecnicoResponsavel,
          slaHoras: source.slaHoras,
          durationMinutes: source.durationMinutes,
          dataAbertura: new Date(), // Fresh timestamp
          dataPlaneadaInicio: null,
          dataPlaneadaFim: null,
          dataPrevista: null,
          dataInicio: null,
          dataConclusao: null, // Reset
          orcamentoStatus: "Rascunho",
          isPesca: source.isPesca,
          isIsentoIva: source.isIsentoIva,
          codigoIsencaoIva: source.codigoIsencaoIva ?? null,
          valorPecas: 0,
          valorMaoObra: 0,
          valorDesconto: 0,
          valorTotal: 0,
          metadados: toOrdemServicoMetaJson(metaWithLog),
        },
      });

      // 5. Copy checklist items from source (as unchecked)
      if (source.checklistItems.length > 0) {
        await tx.ordemServicoChecklistItem.createMany({
          data: source.checklistItems.map((item) => ({
            ordemServicoId: newOrder.id,
            phase: item.phase,
            category: item.category,
            label: item.label,
            done: false, // Reset — unchecked
            barcode: item.barcode,
            notes: null,
            isDefect: false,
            originalDiagramRef: item.originalDiagramRef,
          })),
        });
      }

      // 6. Link the same jangadas
      const jangadaLinks = source.ordemJangadas;
      if (jangadaLinks.length > 0) {
        await tx.ordemServicoJangada.createMany({
          data: jangadaLinks.map((link) => ({
            ordemServicoId: newOrder.id,
            jangadaId: link.jangadaId,
          })),
        });
      }

      return newOrder;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[ordens-servico/clone] Error:", err);
    return NextResponse.json(
      { error: "Erro interno ao duplicar a ordem de serviço." },
      { status: 500 },
    );
  }
}
