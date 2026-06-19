"use server";

import prisma from "@/lib/prisma";
import { logAuditoria } from "@/lib/auditoria";
import { parseOrdemServicoMeta, toOrdemServicoMetaJson } from "@/lib/ordens-servico";

type SaveInspectionReplacementItem = {
  stockId?: number | null;
  referencia?: string | null;
  descricao?: string | null;
  quantidade?: number | null;
  motivo?: string | null;
  precoUnitario?: number | null;
  validade?: string | null;
  codigoFabricante?: string | null;
};

type SaveInspectionPayload = {
  id?: string | number;
  shipId?: string | number | null;
  raftId?: string | number | null;
  coleteId?: string | number | null;
  navioNome?: string | null;
  jangadaSerial?: string | null;
  coleteSerial?: string | null;
  date?: string | null;
  dataProxInspecao?: string | null;
  status?: string | null;
  responsavel?: string | null;
  certificadoNumero?: string | null;
  sourceFile?: string | null;
  checklistSnapshot?: Record<string, string | number | boolean>;
  artigosSubstituidos?: SaveInspectionReplacementItem[];
  applyStockMovements?: boolean | null;
};

function buildInspectionCertificatePrefix(referenceDate?: string | Date | null) {
  const fallbackYear = new Date().getFullYear();
  const parsed = referenceDate instanceof Date
    ? referenceDate
    : (referenceDate ? new Date(referenceDate) : new Date());

  const resolvedYear = Number.isNaN(parsed.getTime()) ? fallbackYear : parsed.getFullYear();
  return `AZ${String(resolvedYear).slice(-2)}`.toUpperCase();
}

function parseInspectionCertificateSequence(value: unknown, prefix: string) {
  const normalizedValue = String(value || "").trim().toUpperCase();
  const match = normalizedValue.match(/^([A-Z]{2}\d{2})-(\d{3})$/);
  if (!match) return null;
  if (match[1] !== prefix) return null;
  return Number(match[2]);
}

export async function generateInspectionCertificateNumber(referenceDate?: string | Date | null) {
  const prefix = buildInspectionCertificatePrefix(referenceDate);

  const [existingInspections, existingRafts] = await Promise.all([
    prisma.inspecao.findMany({
      where: { certificadoNumero: { startsWith: `${prefix}-` } },
      select: { certificadoNumero: true },
    }),
    prisma.jangada.findMany({
      where: { ultimoCertificadoNumero: { startsWith: `${prefix}-` } },
      select: { ultimoCertificadoNumero: true },
    }),
  ]);

  const maxSequence = [...existingInspections, ...existingRafts].reduce((max, row) => {
    const candidate = 'certificadoNumero' in row ? row.certificadoNumero : row.ultimoCertificadoNumero;
    const parsed = parseInspectionCertificateSequence(candidate, prefix);
    if (!Number.isFinite(parsed)) return max;
    return Math.max(max, Number(parsed));
  }, 0);

  return `${prefix}-${String(maxSequence + 1).padStart(3, "0")}`;
}

function normalizeMonthYearToDate(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const mmYyyy = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    const year = Number(mmYyyy[2]);
    if (month >= 1 && month <= 12) return new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  }

  return null;
}

function normalizeReplacements(input: unknown) {
  if (!Array.isArray(input)) return [] as Array<{
    stockId: number | null;
    referencia: string | null;
    codigoFabricante: string | null;
    name: string;
    quantidade: number;
    validade: Date | null;
    motivo: string | null;
  }>;

  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as SaveInspectionReplacementItem;
      const name = String(row.descricao || "").trim();
      const referencia = String(row.referencia || "").trim() || null;
      const codigoFabricante = String(row.codigoFabricante || "").trim() || null;
      const quantidade = Math.max(1, Number(row.quantidade || 1));
      if (!name) return null;
      return {
        stockId: Number.isFinite(Number(row.stockId)) && Number(row.stockId) > 0 ? Number(row.stockId) : null,
        referencia,
        codigoFabricante,
        name,
        quantidade,
        validade: normalizeMonthYearToDate(row.validade),
        motivo: String(row.motivo || "").trim() || null,
      };
    })
    .filter((row): row is {
      stockId: number | null;
      referencia: string | null;
      codigoFabricante: string | null;
      name: string;
      quantidade: number;
      validade: Date | null;
      motivo: string | null;
    } => Boolean(row));
}

async function normalizeCertificadoNumero(payload: SaveInspectionPayload) {
  const explicit = String(payload.certificadoNumero || "").trim();
  if (explicit) return explicit;
  return generateInspectionCertificateNumber(payload.date || null);
}

export async function saveInspection(payload: SaveInspectionPayload) {
  const navioNome = String(payload.navioNome || "").trim();
  const jangadaSerial = String(payload.jangadaSerial || "").trim();
  const coleteSerial = String(payload.coleteSerial || "").trim();
  const dataInspecao = String(payload.date || "").trim();
  const dataProxInspecao = String(payload.dataProxInspecao || "").trim() || null;
  const applyStockMovements = payload.applyStockMovements === true;

  if (!dataInspecao) {
    throw new Error("Data da inspeção é obrigatória.");
  }

  const inspectionId = Number(payload.id);
  const navioId = Number(payload.shipId);
  const jangadaId = Number(payload.raftId);
  const coleteId = Number(payload.coleteId);

  const replacements = normalizeReplacements(payload.artigosSubstituidos);

  const resolvedJangadaId = (() => {
    if (Number.isFinite(jangadaId) && jangadaId > 0) return Number(jangadaId);
    return null;
  })();
  
  const resolvedColeteId = (() => {
    if (Number.isFinite(coleteId) && coleteId > 0) return Number(coleteId);
    return null;
  })();

  const jangadaBySerial = !resolvedJangadaId && jangadaSerial
    ? await prisma.jangada.findFirst({ where: { serial: { equals: jangadaSerial, mode: "insensitive" } }, select: { id: true } })
    : null;
    
  const coleteBySerial = !resolvedColeteId && coleteSerial
    ? await prisma.colete.findFirst({ where: { serial: { equals: coleteSerial, mode: "insensitive" } }, select: { id: true } })
    : null;

  const finalJangadaId = resolvedJangadaId || jangadaBySerial?.id || null;
  const finalColeteId = resolvedColeteId || coleteBySerial?.id || null;
  const existingInspection = Number.isFinite(inspectionId) && inspectionId > 0
    ? await prisma.inspecao.findUnique({ where: { id: inspectionId }, select: { id: true, certificadoNumero: true } })
    : null;
  const certificadoNumero = await normalizeCertificadoNumero({
    ...payload,
    certificadoNumero: payload.certificadoNumero ?? existingInspection?.certificadoNumero,
  });

  const saved = await prisma.$transaction(async (tx) => {
    let resolvedStrapRef: string | null = null;
    let strapQuantity = 0;
    let strapDescription = "";

    if (finalJangadaId) {
      const jangada = await tx.jangada.findUnique({
        where: { id: finalJangadaId },
        select: {
          brand: true,
          model: true,
          containerModel: true,
          capacity: true,
          launchType: true,
          packType: true,
          maxStowageHeight: true
        }
      });

      if (jangada) {
        const isValise = (
          String(jangada.containerModel || '').toLowerCase().includes('valise') ||
          String(jangada.containerModel || '').toLowerCase().includes('bag') ||
          String(jangada.containerModel || '').toLowerCase().includes('saco')
        );

        if (!isValise) {
          const { getContainerClosureMatchBundle } = require("@/modules/rafts/containerClosureStraps");
          const bundle = getContainerClosureMatchBundle({
            brand: jangada.brand,
            model: jangada.model,
            containerModel: jangada.containerModel,
            capacity: jangada.capacity,
            launchType: jangada.launchType,
            packType: jangada.packType,
            maxStowageHeight: jangada.maxStowageHeight,
          });

          if (bundle.exactMatches && bundle.exactMatches.length > 0) {
            const match = bundle.exactMatches[0];
            resolvedStrapRef = String(match.stockReference || '').split('/')[0].trim();
            strapQuantity = match.strapQuantity || 1;
            strapDescription = match.description || "Cinta de Fecho";
          }
        }
      }
    }

    if (resolvedStrapRef) {
      const exists = replacements.some(r => r.referencia === resolvedStrapRef);
      if (!exists) {
        const strapStock = await tx.stock.findUnique({
          where: { referencia: resolvedStrapRef },
          select: { id: true, descricao: true }
        });

        replacements.push({
          stockId: strapStock?.id || null,
          referencia: resolvedStrapRef,
          name: strapStock?.descricao || strapDescription,
          quantidade: strapQuantity,
          motivo: `Cinta de fecho substituída automaticamente`
        });
      }
    }

    const inspectionData = {
      certificadoNumero,
      navioNome,
      navioId: Number.isFinite(navioId) && navioId > 0 ? navioId : null,
      jangadaId: finalJangadaId,
      jangadaSerial,
      coleteId: finalColeteId,
      coleteSerial,
      dataInspecao,
      dataProxInspecao,
      status: String(payload.status || "Concluída").trim() || "Concluída",
      sourceFile: String(payload.sourceFile || "checklist_quadro").trim() || "checklist_quadro",
      signatureBase64: payload.signatureBase64 || null,
    };

    const inspecao = existingInspection
      ? await tx.inspecao.update({
          where: { id: existingInspection.id },
          data: {
            ...inspectionData,
            updatedAt: new Date(),
          },
        })
      : await tx.inspecao.upsert({
          where: { certificadoNumero },
          create: inspectionData,
          update: {
            ...inspectionData,
            updatedAt: new Date(),
          },
        });

    if (finalJangadaId) {
      const { saveInspectionSnapshot } = require("@/lib/inspection-snapshots");
      await saveInspectionSnapshot(certificadoNumero, finalJangadaId);
    }

    await tx.artigoJangada.deleteMany({ where: { inspecaoId: inspecao.id } });

    if (applyStockMovements) {
      for (const item of replacements) {
        if (!item.stockId) continue;

        const stock = await tx.stock.findUnique({
          where: { id: item.stockId },
          select: { id: true, quantidade: true, referencia: true },
        });

        if (!stock) {
          throw new Error(`Artigo de stock não encontrado para ${item.referencia || item.name}.`);
        }

        const isStrap = item.referencia === 'D508' || item.referencia === 'D509' || item.referencia === 'MK20-FLAT';
        if (stock.quantidade < item.quantidade && !isStrap) {
          throw new Error(`Stock insuficiente para ${stock.referencia || item.referencia || item.name}.`);
        }

        const quantidadeDepois = stock.quantidade - item.quantidade;

        await tx.stock.update({
          where: { id: item.stockId },
          data: { quantidade: quantidadeDepois },
        });

        await tx.movimentacaoStock.create({
          data: {
            stockId: item.stockId,
            tipo: "saida",
            quantidade: item.quantidade,
            quantidadeAntes: stock.quantidade,
            quantidadeDepois,
            motivo: item.motivo || `Consumo checklist ${certificadoNumero}`,
            usuario: String(payload.responsavel || "operador"),
          },
        });
      }
    }

    if (replacements.length > 0 && finalJangadaId) {
      await tx.artigoJangada.createMany({
        data: replacements.map((item) => ({
          inspecaoId: inspecao.id,
          jangadaId: finalJangadaId,
          name: item.name,
          quantidade: item.quantidade,
          validade: item.validade,
          referencia: item.referencia,
          codigoFabricante: item.codigoFabricante,
        })),
      });
    }

    // 4. FATURAÇÃO AUTOMÁTICA (Consumíveis, Testes e Serviços)
    if (finalJangadaId) {
      const activeOrdem = await tx.ordemServico.findFirst({
        where: {
          jangadaId: finalJangadaId,
          status: { in: ["pendente", "em_progresso"] }
        },
        select: {
          id: true,
          metadados: true,
          valorMaoObra: true,
          valorDesconto: true,
          isIsentoIva: true
        }
      });

      if (activeOrdem) {
        const refsToFetch = ["L-JD"];
        if (payload.testeFS === 'APROVOU' || payload.testeFS === 'REPROVOU') refsToFetch.push("L-FS");
        if (payload.testeNAP === 'APROVOU' || payload.testeNAP === 'REPROVOU') refsToFetch.push("L-NAP");
        if (payload.testeGI === 'APROVOU' || payload.testeGI === 'REPROVOU') refsToFetch.push("L-GI");
        if (payload.testeDL === 'APROVOU' || payload.testeDL === 'REPROVOU' || payload.cylinderDataTeste) {
          refsToFetch.push("L-TH");
        }
        if (payload.cylinderSerial) {
          refsToFetch.push("L-CO2");
        }

        for (const r of replacements) {
          if (r.referencia) {
            refsToFetch.push(r.referencia);
          }
        }

        const stockItems = await tx.stock.findMany({
          where: { referencia: { in: refsToFetch } },
          select: { id: true, referencia: true, descricao: true, precoVenda: true, quantidade: true }
        });
        const stockMap = new Map(stockItems.map(item => [item.referencia, item]));

        const inspectionMaterials: any[] = [];

        const services = ["L-JD", "L-FS", "L-NAP", "L-GI", "L-TH", "L-CO2"].filter(r => refsToFetch.includes(r));
        for (const ref of services) {
          const stock = stockMap.get(ref);
          inspectionMaterials.push({
            id: `service-${ref}`,
            stockId: stock?.id || null,
            referencia: ref,
            descricao: stock?.descricao || (
              ref === "L-JD" ? "Inspeção de Jangada" :
              ref === "L-FS" ? "Teste FS" :
              ref === "L-NAP" ? "Teste NAP" :
              ref === "L-GI" ? "Teste GI" :
              ref === "L-TH" ? "Teste Hidrostático" : "Carga de CO2"
            ),
            quantidadePrevista: 1,
            quantidadeUsada: 1,
            precoUnitario: stock?.precoVenda ?? 0,
            disponibilidade: stock?.quantidade ?? 0,
            reservado: false,
            consumido: true
          });
        }

        for (const r of replacements) {
          const stock = r.referencia ? stockMap.get(r.referencia) : null;
          inspectionMaterials.push({
            id: `replacement-${r.referencia || r.name}`,
            stockId: r.stockId || stock?.id || null,
            referencia: r.referencia || "SEM-REF",
            descricao: r.name || stock?.descricao || "Consumível",
            quantidadePrevista: r.quantidade,
            quantidadeUsada: r.quantidade,
            precoUnitario: stock?.precoVenda ?? 0,
            disponibilidade: stock?.quantidade ?? 0,
            reservado: false,
            consumido: true
          });
        }

        const orderMeta = parseOrdemServicoMeta(activeOrdem.metadados);
        const currentMaterials = Array.isArray(orderMeta.materials) ? orderMeta.materials : [];

        const newRefs = new Set(inspectionMaterials.map(m => m.referencia));
        const filteredCurrent = currentMaterials.filter((m: any) => 
          m && m.id &&
          !m.id.startsWith("service-") && 
          !m.id.startsWith("strap-") && 
          !m.id.startsWith("replacement-") && 
          !newRefs.has(m.referencia)
        );

        const nextMaterials = [...filteredCurrent, ...inspectionMaterials];

        const valorPecas = nextMaterials.reduce((acc, item) => 
          acc + Math.max(0, Number(item.quantidadeUsada ?? item.quantidadePrevista ?? 0)) * Math.max(0, Number(item.precoUnitario || 0)),
          0
        );

        const subtotal = valorPecas + (activeOrdem.valorMaoObra || 0) - (activeOrdem.valorDesconto || 0);
        const iva = activeOrdem.isIsentoIva ? 0 : subtotal * 0.16;
        const valorTotal = subtotal + iva;

        await tx.ordemServico.update({
          where: { id: activeOrdem.id },
          data: {
            inspecaoId: inspecao.id,
            metadados: toOrdemServicoMetaJson({
              ...orderMeta,
              materials: nextMaterials
            }),
            valorPecas,
            valorTotal
          }
        });
      }
    }

    return inspecao;
  });

  await logAuditoria({
    tabela: "InspecaoChecklist",
    tipoOperacao: "UPDATE",
    idRegisto: saved.id,
    descricao: `Checklist guardada para ${certificadoNumero} (${replacements.length} artigo(s) substituído(s)).`,
    usuario: String(payload.responsavel || "sistema"),
    dadosDepois: {
      certificadoNumero,
      navioNome,
      jangadaSerial,
      dataInspecao,
      dataProxInspecao,
      status: payload.status || "Concluída",
      responsavel: payload.responsavel || null,
      applyStockMovements,
      checklistSnapshot: payload.checklistSnapshot || {},
      artigosSubstituidos: replacements,
    },
  });

  return {
    id: saved.id,
    certificadoNumero,
    artigosSubstituidosCount: replacements.length,
  };
}
