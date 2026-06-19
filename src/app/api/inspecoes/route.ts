import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { generateInspectionCertificateNumber, saveInspection } from "@/app/inspecoes/actions";
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability';

export async function GET(request: NextRequest) {
  const context = beginApiRequest(request, 'inspecoes');
  try {
    const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
      const response = NextResponse.json(body, init);
      finishApiRequest(context, response.status, extra);
      return withRequestId(response, context);
    };

    const { searchParams } = new URL(request.url);
    if (searchParams.get('nextCertificate') === '1') {
      const referenceDate = searchParams.get('referenceDate');
      const certificadoNumero = await generateInspectionCertificateNumber(referenceDate);
      return respond({ certificadoNumero }, undefined, { nextCertificate: true, referenceDate: referenceDate || null });
    }

    const jangadaIdParam = searchParams.get('jangadaId');
    const jangadaId = jangadaIdParam ? parseInt(jangadaIdParam, 10) : null;

    const coleteIdParam = searchParams.get('coleteId');
    const coleteId = coleteIdParam ? parseInt(coleteIdParam, 10) : null;

    const whereClause: any = {};
    if (jangadaId && !Number.isNaN(jangadaId)) {
      whereClause.jangadaId = jangadaId;
    } else if (coleteId && !Number.isNaN(coleteId)) {
      whereClause.coleteId = coleteId;
    }

    const inspecoes = await prisma.inspecao.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: [{ dataInspecao: 'desc' }, { id: 'desc' }],
      take: 5000,
      include: { artigos: true, jangada: true, colete: true },
    });

    if ((jangadaId && !Number.isNaN(jangadaId)) || (coleteId && !Number.isNaN(coleteId))) {
      return respond(inspecoes, undefined, { filtered: true, count: inspecoes.length });
    }

    // Remove repeated ship names, keep only the first inspection for each ship
    const seen = new Set<string>();
    const filtered = inspecoes.filter((insp) => {
      const ship = String(insp.navioNome || '').toLowerCase();
      if (!ship || seen.has(ship)) return false;
      seen.add(ship);
      return true;
    });
    return respond(filtered, undefined, { count: filtered.length, sourceCount: inspecoes.length });
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao buscar inspecoes');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}

export async function POST(req: NextRequest) {
  const context = beginApiRequest(req, 'inspecoes');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await prisma.inspecao.createMany({ data: body });
      return respond({ count: created.count }, undefined, { batch: true });
    } else {
      const payload = {
        ...body,
        date: body?.date ?? body?.dataInspecao ?? null,
        dataProxInspecao: body?.dataProxInspecao ?? body?.nextInspectionDate ?? null,
        shipId: body?.shipId ?? body?.navioId ?? null,
        raftId: body?.raftId ?? body?.jangadaId ?? null,
        applyStockMovements: body?.applyStockMovements ?? true,
      };

      const saved = await saveInspection(payload as any);
      const created = await prisma.inspecao.findUnique({
        where: { id: saved.id },
        include: { artigos: true },
      });

      return respond(created, undefined, { batch: false, inspecaoId: created?.id ?? null });
    }
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao criar inspecao');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}

export async function PUT(req: NextRequest) {
  const context = beginApiRequest(req, 'inspecoes');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    if (!idParam) return respond({ error: 'Missing id' }, { status: 400 });
    const id = parseInt(idParam, 10);
    const body = await req.json();
    const payload = {
      ...body,
      id,
      date: body?.date ?? body?.dataInspecao ?? null,
      dataProxInspecao: body?.dataProxInspecao ?? body?.nextInspectionDate ?? null,
      shipId: body?.shipId ?? body?.navioId ?? null,
      raftId: body?.raftId ?? body?.jangadaId ?? null,
      applyStockMovements: body?.applyStockMovements ?? false,
    };

    const saved = await saveInspection(payload as any);
    const updated = await prisma.inspecao.findUnique({
      where: { id: saved.id },
      include: { artigos: true },
    });
    return respond(updated, undefined, { inspecaoId: id });
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao atualizar inspecao');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}

export async function DELETE(req: NextRequest) {
  const context = beginApiRequest(req, 'inspecoes');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isFinite(value) && value > 0)
      : [];

    if (ids.length > 0) {
      const deleted = await prisma.inspecao.deleteMany({ where: { id: { in: ids } } });
      return respond({ success: true, count: deleted.count, ids }, undefined, { batch: true });
    }

    if (!idParam) return respond({ error: 'Missing id' }, { status: 400 });
    const id = parseInt(idParam, 10);
    const deleted = await prisma.inspecao.delete({ where: { id } });
    return respond(deleted, undefined, { batch: false, inspecaoId: id });
  } catch (error) {
    captureApiError(context, error);
    const response = buildDatabaseErrorResponse(error, 'Erro ao deletar inspecao');
    finishApiRequest(context, response.status);
    return withRequestId(response, context);
  }
}
