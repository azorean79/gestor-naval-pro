import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logAuditoria } from '@/lib/auditoria';
import { readAuditoriaJson, writeAuditoriaJson } from '@/lib/auditorias-storage';
import { DRINKING_WATER_STOCK_REFERENCE, FOOD_RATIONS_STOCK_REFERENCE } from '@/lib/stock-reference-rules';
import { getAccessContext } from '@/lib/access-control';
import { resolveActiveServiceStationId } from '@/lib/station-selection';
import { analyzeImportRow } from '@/lib/ia-import-analysis';
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability';
import criticalItemCatalog from '@/config/criticalItemCatalog.json';
import {
  certificateItemHasManagedValidity,
} from '@/lib/certificate-validity';

type DataRow = Record<string, string | number | null>;
type InspectionChecklistValues = Record<string, string | number | boolean>;
type InspectionChecklistStore = Record<string, InspectionChecklistValues>;

type ApplyPayload = {
  fileName?: string;
  fileType?: 'pdf' | 'excel';
  extractedColumns?: string[];
  extractedHeader?: Record<string, string | number | null>;
  correctedHeader?: Record<string, string | number | null>;
  correctedRows?: DataRow[];
  inspectionChecklistValues?: InspectionChecklistValues | string;
};

const INSPECTION_CHECKLIST_STORE_FILE = '_meta/jangadas-inspection-checklist-values.json';

type CatalogItem = {
  canonical: string;
  referencia?: string;
  keywords: string[];
};

function getCatalog(): CatalogItem[] {
  return criticalItemCatalog as CatalogItem[];
}

type JangadaArtigoPayload = {
  name: string;
  quantidade: number;
  validade: Date | null;
  referencia: string;
};

function normalizeKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function asString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function asDateString(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const ptMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ptMatch) {
    const [, dd, mm, yyyy] = ptMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dashMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, dd, mm, yyyy] = dashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const dotMatch = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    const [, dd, mm, yyyy] = dotMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function findDateInRow(row: DataRow): string | null {
  for (const value of Object.values(row)) {
    const parsed = asDateString(value);
    if (parsed) return parsed;
  }
  return null;
}

function detectCatalogItem(rawText: string): CatalogItem | null {
  const normalized = normalizeKey(rawText);
  if (!normalized) return null;
  const catalog = getCatalog();
  for (const item of catalog) {
    if (item.keywords.some((keyword) => normalized.includes(normalizeKey(keyword)))) {
      return item;
    }
  }
  return null;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(asString(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function normalizeInspectionChecklistValues(raw: unknown): InspectionChecklistValues {
  if (!raw) return {};

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const value = raw.trim();
    if (!value) return {};
    try {
      parsed = JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

  return Object.entries(parsed as Record<string, unknown>).reduce<InspectionChecklistValues>((acc, [key, value]) => {
    if (!key) return acc;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function readInspectionChecklistStore() {
  return readAuditoriaJson<InspectionChecklistStore>(INSPECTION_CHECKLIST_STORE_FILE, {});
}

async function writeInspectionChecklistValues(jangadaId: number, value: unknown) {
  const currentStore = await readInspectionChecklistStore();
  const normalized = normalizeInspectionChecklistValues(value);
  const key = String(jangadaId);
  const previous = normalizeInspectionChecklistValues(currentStore[key]);

  const nextStore: InspectionChecklistStore = {
    ...currentStore,
    [key]: normalized,
  };

  await writeAuditoriaJson(INSPECTION_CHECKLIST_STORE_FILE, nextStore);

  await logAuditoria({
    tabela: 'JangadaInspectionChecklist',
    tipoOperacao: 'UPDATE',
    idRegisto: jangadaId,
    descricao: 'Atualização do checklist de inspeção da jangada via IA importação.',
    usuario: 'sistema',
    dadosAntes: previous,
    dadosDepois: normalized,
  });

  return normalized;
}

function findValue(row: DataRow, terms: string[]): string {
  const entries = Object.entries(row);
  for (const [key, value] of entries) {
    const normalized = normalizeKey(key);
    if (terms.some((term) => normalized.includes(term))) {
      const text = asString(value);
      if (text) return text;
    }
  }
  return '';
}

function extractHeaderData(rows: DataRow[], correctedHeader?: Record<string, string | number | null>) {
  const firstNonEmpty = rows.find((row) => Object.values(row).some((value) => asString(value)));
  const source = firstNonEmpty || {};
  const header = correctedHeader || {};

  const certificadoNumero =
    asString(header.certificadoNumero) ||
    findValue(source, ['certificado', 'certificate']) ||
    `AUTO-${Date.now()}`;

  const shipName =
    asString(header.shipName) ||
    findValue(source, ['navio', 'embarcacao', 'ship', 'vessel']);
  const raftSerial =
    asString(header.raftSerial) ||
    findValue(source, ['serial', 'serie', 'raft']);
  const dataInspecao =
    asDateString(header.dataInspecao) ||
    asDateString(findValue(source, ['data inspecao', 'inspecao', 'inspection date']));
  const dataProxInspecao =
    asDateString(header.dataProxInspecao) ||
    asDateString(findValue(source, ['proxima inspecao', 'prox inspecao', 'validade', 'expiry']));
  const emergencyPackType =
    asString(header.emergencyPackType) ||
    findValue(source, ['pack', 'solas', 'iso', 'orc']);

  const ownerName =
    asString(header.ownerName) ||
    findValue(source, ['armador', 'proprietario', 'owner', 'cliente']);
  const brand =
    asString(header.brand) ||
    findValue(source, ['marca', 'brand']);
  const model =
    asString(header.model) ||
    findValue(source, ['modelo', 'model']);
  const capacityRaw =
    asString(header.capacity) ||
    findValue(source, ['lotacao', 'capacidade', 'capacity']);
  const capacity = Math.max(0, Math.floor(asNumber(capacityRaw, 0)));

  const cylinderSerial =
    asString(header.cylinderSerial) ||
    findValue(source, ['serial cilindro', 'cilindro serial', 'cylinder serial']);
  const cylinderCo2 =
    asString(header.cylinderCo2) ||
    findValue(source, ['co2']);
  const cylinderN2 =
    asString(header.cylinderN2) ||
    findValue(source, ['n2']);
  const cylinderTara =
    asString(header.cylinderTara) ||
    findValue(source, ['tara']);
  const cylinderPesoBruto =
    asString(header.cylinderPesoBruto) ||
    findValue(source, ['peso bruto']);
  const cylinderSistema =
    asString(header.cylinderSistema) ||
    findValue(source, ['sistema insuflacao', 'inflation system', 'sistema']);

  return {
    certificadoNumero,
    shipName: shipName || 'Não identificado',
    raftSerial: raftSerial || null,
    dataInspecao: dataInspecao || new Date().toISOString().slice(0, 10),
    dataProxInspecao,
    emergencyPackType: emergencyPackType || null,
    ownerName: ownerName || null,
    brand: brand || null,
    model: model || null,
    capacity,
    cylinderSerial: cylinderSerial || null,
    cylinderCo2: cylinderCo2 || null,
    cylinderN2: cylinderN2 || null,
    cylinderTara: cylinderTara || null,
    cylinderPesoBruto: cylinderPesoBruto || null,
    cylinderSistema: cylinderSistema || null,
  };
}

function extractValidityRows(rows: DataRow[]) {
  const validities: {
    item: string;
    validade: string;
    referencia?: string;
    quantidade?: number;
    observacoes?: string;
  }[] = [];

  for (const row of rows) {
    const rowAnalysis = analyzeImportRow(row);
    const rowText = rowAnalysis.rowText;
    if (rowAnalysis.shouldSkipValidity) continue;

    const detectedCatalog = detectCatalogItem(rowText);

    const item =
      findValue(row, ['item', 'artigo', 'descricao', 'material', 'conteudo', 'content']) ||
      findValue(row, ['conteudo']) ||
      rowAnalysis.itemCandidate ||
      detectedCatalog?.canonical ||
      '';

    const validade =
      asDateString(findValue(row, ['validade', 'expiry', 'vencimento', 'data'])) ||
      findDateInRow(row) ||
      '';

    if (!item || !validade) continue;
    if (!certificateItemHasManagedValidity(detectedCatalog?.canonical || item)) continue;

    const referencia = findValue(row, ['referencia', 'ref', 'codigo']) || detectedCatalog?.referencia || '';
    const quantidadeText = findValue(row, ['quantidade', 'qty', 'qtd']);
    const quantidade = Number(quantidadeText);
    const observacoes = findValue(row, ['obs', 'observacao', 'notas', 'notes']);

    validities.push({
      item: detectedCatalog?.canonical || item,
      validade,
      referencia: referencia || undefined,
      quantidade: Number.isFinite(quantidade) && quantidade > 0 ? Math.floor(quantidade) : 1,
      observacoes: observacoes || undefined,
    });
  }

  const unique = new Map<string, (typeof validities)[number]>();
  for (const entry of validities) {
    const key = `${entry.item}__${entry.validade}__${entry.referencia || ''}`.toLowerCase();
    if (!unique.has(key)) unique.set(key, entry);
  }

  return Array.from(unique.values());
}

function toJangadaArtigos(entries: ReturnType<typeof extractValidityRows>): JangadaArtigoPayload[] {
  return entries.map((entry) => ({
    name: entry.item,
    quantidade: Math.max(1, Math.floor(Number(entry.quantidade || 1))),
    validade: entry.validade ? new Date(`${entry.validade}T00:00:00.000Z`) : null,
    referencia: entry.referencia || '',
  }));
}

export async function POST(request: NextRequest) {
  const context = beginApiRequest(request, 'ia-importacao');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const access = await getAccessContext();
    if (!access) {
      return respond({ error: 'Sessão obrigatória.' }, { status: 401 });
    }
    context.userId = access.userId ? String(access.userId) : null;

    const activeStationId = resolveActiveServiceStationId(request, access);
    const effectiveStationId = activeStationId
      ?? (!access.isAdmin ? (access.stationId ?? access.allowedStationIds?.[0] ?? null) : null);

    const payload = (await request.json()) as ApplyPayload;
    const rows = Array.isArray(payload.correctedRows) ? payload.correctedRows : [];

    if (!payload.fileName || rows.length === 0) {
      return respond({ error: 'Dados insuficientes para importação.' }, { status: 400 });
    }

    const header = extractHeaderData(rows, payload.correctedHeader);
    const validityRows = extractValidityRows(rows);
    const jangadaArtigos = toJangadaArtigos(validityRows);

    return await (prisma as any).$transaction(async (tx: any) => {
      let cliente: any = null;
      if (header.ownerName) {
        cliente = await tx.cliente.findFirst({
          where: {
            nome: header.ownerName,
            ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
          },
        });
        if (!cliente) {
          cliente = await tx.cliente.create({
            data: {
              nome: header.ownerName,
              numeroCliente: `AUTO-${Date.now().toString().slice(-8)}`,
              ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
            },
          });
        }
      }

      let navio: any = null;
      if (header.shipName && header.shipName !== 'Não identificado') {
        navio = await tx.navio.findFirst({
          where: {
            nome: header.shipName,
            ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
          },
        });
        if (!navio) {
          navio = await tx.navio.create({
            data: {
              nome: header.shipName,
              matricula: 'N/D',
              ilha: 'N/D',
              tipoPesca: 'N/D',
              clienteId: cliente?.id ?? null,
              ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
            },
          });
        }
      }

      let jangada = header.raftSerial
        ? await tx.jangada.findFirst({ where: { serial: header.raftSerial } })
        : null;

      if (header.raftSerial && !jangada) {
        jangada = await tx.jangada.create({
          data: {
            brand: header.brand || 'RFD',
            model: header.model || 'N/D',
            serial: header.raftSerial,
            dataFabrico: 'N/D',
            packType: header.emergencyPackType || 'Solas A',
            capacity: header.capacity > 0 ? header.capacity : 1,
            owner: header.ownerName || header.shipName || 'N/D',
            shipId: navio?.id ?? null,
            shipNameManual: header.shipName || null,
            dataInspecao: header.dataInspecao,
            dataProxInspecao: header.dataProxInspecao,
            cylinderSerial: header.cylinderSerial,
            cylinderTara: header.cylinderTara,
            cylinderPesoBruto: header.cylinderPesoBruto,
            cylinderCo2: header.cylinderCo2,
            cylinderN2: header.cylinderN2,
            cylinderSistema: header.cylinderSistema,
            ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
          },
        });
      }

      const certificado = await tx.certificadoExtraido.upsert({
        where: { fileName: payload.fileName },
        create: {
          fileName: payload.fileName,
          certificadoNumero: header.certificadoNumero,
          raftSerial: header.raftSerial,
          shipName: header.shipName,
          dataInspecao: header.dataInspecao,
          dataProxInspecao: header.dataProxInspecao,
          emergencyPackType: header.emergencyPackType,
          sourceYear: 2026,
          hasQuadro: validityRows.length > 0,
          validitiesCount: validityRows.length,
          isMaisRecente: true,
        },
        update: {
          certificadoNumero: header.certificadoNumero,
          raftSerial: header.raftSerial,
          shipName: header.shipName,
          dataInspecao: header.dataInspecao,
          dataProxInspecao: header.dataProxInspecao,
          emergencyPackType: header.emergencyPackType,
          hasQuadro: validityRows.length > 0,
          validitiesCount: validityRows.length,
          isMaisRecente: true,
        },
      });

      await tx.certificadoValidade.deleteMany({ where: { certificadoId: certificado.id } });

      if (validityRows.length > 0) {
        await tx.certificadoValidade.createMany({
          data: validityRows.map((entry, index) => ({
            certificadoId: certificado.id,
            item: entry.item,
            validade: entry.validade,
            rowNumber: index + 1,
          })),
          skipDuplicates: true,
        });
      }

      const inspecao = await tx.inspecao.upsert({
        where: { certificadoNumero: header.certificadoNumero },
        create: {
          certificadoNumero: header.certificadoNumero,
          navioNome: header.shipName,
          navioId: navio?.id ?? null,
          jangadaId: jangada?.id ?? null,
          jangadaSerial: header.raftSerial,
          dataInspecao: header.dataInspecao,
          dataProxInspecao: header.dataProxInspecao,
          status: 'Concluída',
          sourceFile: payload.fileName,
        },
        update: {
          navioNome: header.shipName,
          navioId: navio?.id ?? null,
          jangadaId: jangada?.id ?? null,
          jangadaSerial: header.raftSerial,
          dataInspecao: header.dataInspecao,
          dataProxInspecao: header.dataProxInspecao,
          status: 'Concluída',
          sourceFile: payload.fileName,
        },
      });

      const stockList = await tx.stock.findMany({
        select: { id: true, referencia: true, descricao: true },
      });

      let inspecaoArtigosApplied = 0;
      for (const entry of validityRows) {
        const refUpper = asString(entry.referencia).toUpperCase();
        const stockMatch =
          stockList.find((item: any) => refUpper && String(item.referencia || '').toUpperCase() === refUpper) ||
          stockList.find((item: any) => String(item.descricao || '').toLowerCase().includes(entry.item.toLowerCase()));

        if (!stockMatch) continue;

        await tx.inspecaoArtigo.upsert({
          where: {
            inspecaoId_stockId: {
              inspecaoId: inspecao.id,
              stockId: stockMatch.id,
            },
          },
          create: {
            inspecaoId: inspecao.id,
            stockId: stockMatch.id,
            referencia: stockMatch.referencia,
            descricao: stockMatch.descricao,
            quantidadePlaneada: entry.quantidade || 1,
            quantidadeUsada: 0,
            estado: 'Pendente',
            observacoes: entry.observacoes || null,
          },
          update: {
            quantidadePlaneada: entry.quantidade || 1,
            observacoes: entry.observacoes || null,
          },
        });

        inspecaoArtigosApplied += 1;
      }

      let jangadaUpdated = false;
      if (jangada) {
        await tx.jangada.update({
          where: { id: jangada.id },
          data: {
            ...(header.brand ? { brand: header.brand } : {}),
            ...(header.model ? { model: header.model } : {}),
            ...(header.capacity > 0 ? { capacity: header.capacity } : {}),
            ...(header.ownerName ? { owner: header.ownerName } : {}),
            shipId: navio?.id ?? jangada.shipId,
            shipNameManual: header.shipName || jangada.shipNameManual,
            dataInspecao: header.dataInspecao,
            dataProxInspecao: header.dataProxInspecao,
            ...(header.emergencyPackType ? { packType: header.emergencyPackType } : {}),
            ...(header.cylinderSerial ? { cylinderSerial: header.cylinderSerial } : {}),
            ...(header.cylinderTara ? { cylinderTara: header.cylinderTara } : {}),
            ...(header.cylinderPesoBruto ? { cylinderPesoBruto: header.cylinderPesoBruto } : {}),
            ...(header.cylinderCo2 ? { cylinderCo2: header.cylinderCo2 } : {}),
            ...(header.cylinderN2 ? { cylinderN2: header.cylinderN2 } : {}),
            ...(header.cylinderSistema ? { cylinderSistema: header.cylinderSistema } : {}),
            ...(effectiveStationId ? { serviceStationId: effectiveStationId } : {}),
            certificadoAtivoId: certificado.id,
          },
        });

        await tx.artigoJangada.deleteMany({ where: { jangadaId: jangada.id } });
        if (jangadaArtigos.length > 0) {
          await tx.artigoJangada.createMany({
            data: jangadaArtigos.map((entry) => ({
              jangadaId: jangada.id,
              name: entry.name,
              quantidade: entry.quantidade,
              validade: entry.validade,
              referencia: entry.referencia || null,
            })),
          });
        }
        jangadaUpdated = true;
      }

      const normalizedChecklist = normalizeInspectionChecklistValues(payload.inspectionChecklistValues);
      let inspectionChecklistSaved = false;
      if (jangada && Object.keys(normalizedChecklist).length > 0) {
        await writeInspectionChecklistValues(jangada.id, normalizedChecklist);
        inspectionChecklistSaved = true;
      }

      return {
        certificado,
        inspecao,
        inspecaoArtigosApplied,
        clienteId: cliente?.id ?? null,
        navioId: navio?.id ?? null,
        jangadaId: jangada?.id ?? null,
        jangadaUpdated,
        inspectionChecklistSaved,
      };
    }).then((result) => respond({
      ok: true,
      message: 'Dados aplicados nas tabelas do sistema.',
      summary: {
        certificadoExtraidoId: result.certificado.id,
        certificadoValidades: validityRows.length,
        inspecaoId: result.inspecao.id,
        inspecaoArtigosApplied: result.inspecaoArtigosApplied,
        clienteId: result.clienteId,
        navioId: result.navioId,
        jangadaId: result.jangadaId,
        jangadaUpdated: result.jangadaUpdated,
        inspectionChecklistSaved: result.inspectionChecklistSaved,
      },
    }, undefined, {
      fileName: payload.fileName,
      fileType: payload.fileType || null,
      validitiesCount: validityRows.length,
      inspecaoArtigosApplied: result.inspecaoArtigosApplied,
      stationId: effectiveStationId,
    }));
  } catch (error) {
    captureApiError(context, error);
    const message = error instanceof Error ? error.message : 'Erro ao aplicar importação.';
    return respond({ error: message }, { status: 500 });
  }
}
