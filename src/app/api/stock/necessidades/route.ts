import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canEditPath, canViewPath } from "@/lib/user-permissions";
import { certificateItemHasManagedValidity } from "@/lib/certificate-validity";
import {
  DRINKING_WATER_STOCK_REFERENCE,
  FOOD_RATIONS_STOCK_REFERENCE,
  PYRO_HANDFLARE_STOCK_REFERENCE,
  PYRO_PARACHUTE_STOCK_REFERENCE,
  PYRO_SMOKE_STOCK_REFERENCE,
  TABLETS_STOCK_REFERENCE,
} from "@/lib/stock-reference-rules";

const FIRST_AID_KIT_STOCK_REFERENCE = "30202050";

type StockRecord = {
  id: number;
  descricao: string;
  referencia: string;
  quantidade: number;
  categoria?: string | null;
  testeHidraulico?: string | null;
  estadoCargaCilindro?: string | null;
};

type MonthlyNeed = {
  month: string;
  quantidade: number;
  jangadas?: Array<{
    id: number;
    serial: string;
    brand?: string | null;
    model?: string | null;
    owner?: string | null;
  }>;
};

type UpcomingInspectionRaft = {
  id: number;
  serial: string;
  brand: string;
  model: string;
  owner: string;
  dataProxInspecao: string | null;
};

type NeedMeta = {
  item: string;
  referencia: string | null;
};

type Gi30NeedRow = {
  canonicalKey: string;
  item: string;
  stockAtual: number;
  necessidade30d: number;
  saldoProjetado30d: number;
  suficiente: boolean;
};

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseFlexibleDate(input: string | Date | null | undefined) {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;

  const raw = String(input || "").trim();
  if (!raw) return null;

  // Intercept MM/YY, MM/YYYY, YYYY-MM
  const parts = raw.split(/[\/-]/);
  if (parts.length === 2) {
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    if (/^\d{1,2}$/.test(p1) && /^\d{2,4}$/.test(p2)) {
      const month = parseInt(p1, 10);
      let year = parseInt(p2, 10);
      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12) {
        const parsed = new Date(year, month - 1, 1);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    } else if (/^\d{4}$/.test(p1) && /^\d{1,2}$/.test(p2)) {
      const year = parseInt(p1, 10);
      const month = parseInt(p2, 10);
      if (month >= 1 && month <= 12) {
        const parsed = new Date(year, month - 1, 1);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    }
  }

  const iso = new Date(raw);
  if (!Number.isNaN(iso.getTime())) return iso;

  const ddMmYyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1]);
    const month = Number(ddMmYyyy[2]);
    const year = Number(ddMmYyyy[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function isWithinDays(dateText: string | Date | null | undefined, days: number) {
  const parsed = parseFlexibleDate(dateText);
  if (!parsed) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);

  return parsed >= now && parsed <= limit;
}

function isCylinderLike(record: Pick<StockRecord, "descricao" | "referencia" | "categoria">) {
  const haystack = normalizeText([record.descricao, record.referencia, record.categoria].filter(Boolean).join(" "));
  return /(cilindr|co2|n2|bottle|garrafa)/.test(haystack);
}

function isHydraulicTestValidForWindow(dateText: string | null | undefined, days: number) {
  const parsed = parseFlexibleDate(dateText);
  if (!parsed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);

  return parsed >= today && parsed >= limit;
}

// Mapeamento de aliases comuns (PT<->EN e variações)
const itemAliases: { [key: string]: string[] } = {
  "red hand flares": ["fachos de mão", "facho de mao", "facho", "handflare", "handflares", "red hand flares", PYRO_HANDFLARE_STOCK_REFERENCE],
  "parachute rockets": ["paraquedas", "foguetes paraquedas", "rocket", PYRO_PARACHUTE_STOCK_REFERENCE],
  "first aid kit": ["farmacia solas", "farmacia", "first aid", "kit primeiros socorros", "ambulancia", "ambulância", "ambulancia solas", "ambulância solas", FIRST_AID_KIT_STOCK_REFERENCE, "30202207", "med-kit-iso", "med-kit-solas", "jng-88bca754"],
  "30205060": ["jng-16e2da2f", "30205060"],
  "paddles": ["remos", "paddle", "remo"],
  "seasickness tables": ["comprimidos enjoo", "seasickness", "comprimidos", "seasickness tablets", TABLETS_STOCK_REFERENCE],
  "drinking water": ["agua potavel", "agua", "water", "sachet", "drinking water", "water sachets", DRINKING_WATER_STOCK_REFERENCE],
  "food rations": ["racoes alimentares", "racoes", "racao", "rations", FOOD_RATIONS_STOCK_REFERENCE],
  "floating smoke signals": ["pote de fumo", "sinais fumigeno", "smoke", "smoke signals", "floating smoke signals", PYRO_SMOKE_STOCK_REFERENCE],
  "top light": ["luz topo", "top light and battery", "30203190"],
  "inside light": ["luz interior", "inside light and battery", "30202206"],
  "bellows": ["fole", "bomba", "bellows"],
  "lithium battery": ["bateria litio", "bateria", "battery"],
};

const canonicalReferenceByItem: Record<string, string> = {
  "red hand flares": PYRO_HANDFLARE_STOCK_REFERENCE,
  "parachute rockets": PYRO_PARACHUTE_STOCK_REFERENCE,
  "floating smoke signals": PYRO_SMOKE_STOCK_REFERENCE,
  "first aid kit": FIRST_AID_KIT_STOCK_REFERENCE,
  "30205060": "30205060",
  "seasickness tables": TABLETS_STOCK_REFERENCE,
  "food rations": FOOD_RATIONS_STOCK_REFERENCE,
  "drinking water": DRINKING_WATER_STOCK_REFERENCE,
  "top light": "30203190",
  "inside light": "30202206",
};

const canonicalDisplayNameByItem: Record<string, string> = {
  "red hand flares": "Fachos de Mão",
  "parachute rockets": "Parachute Rockets",
  "floating smoke signals": "Smoke Signals",
  "first aid kit": "First Aid Kit",
  "30205060": "Artigo 30205060",
  "seasickness tables": "Seasickness Tables",
  "food rations": "Food Rations",
  "drinking water": "Water Sachets",
  "top light": "Top Light and Battery",
  "inside light": "Inside Light and Battery",
};

const quantityPerRaftByCanonicalItem: Record<string, number> = {
  "red hand flares": 2,
  "parachute rockets": 2,
  "floating smoke signals": 1,
  "first aid kit": 1,
  "seasickness tables": 1,
  "food rations": 1,
  "drinking water": 1,
};

function getPerRaftQuantityForItem(canonicalItem: string) {
  return quantityPerRaftByCanonicalItem[canonicalItem] || 1;
}

function getBestItemLabel(rawItem: string | null | undefined, canonicalItem: string) {
  const cleanedRaw = String(rawItem || "").trim();
  if (cleanedRaw) return cleanedRaw;
  return canonicalDisplayNameByItem[canonicalItem] || canonicalItem;
}

// Creates a map from all variations to a normalized key
function createAliasMap(): Map<string, string> {
  const aliasMap = new Map<string, string>();
  
  for (const [mainKey, aliases] of Object.entries(itemAliases)) {
    const normalizedMain = normalizeText(mainKey);
    aliasMap.set(normalizedMain, normalizedMain);
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeText(alias);
      aliasMap.set(normalizedAlias, normalizedMain);
    }
  }
  
  return aliasMap;
}

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
  return d;
}

function parseDate(input: Date | string | null | undefined) {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseValidadeString(validadeStr: string): Date | null {
  if (!validadeStr) return null;

  const raw = String(validadeStr).trim();

  // Formats like M/YYYY or MM/YYYY
  const mmYyyy = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) {
    const month = parseInt(mmYyyy[1], 10);
    const year = parseInt(mmYyyy[2], 10);
    if (month >= 1 && month <= 12) {
      return new Date(year, month, 0);
    }
  }

  // Formats like M/YY or MM/YY (assume 20YY)
  const mmYy = raw.match(/^(\d{1,2})\/(\d{2})$/);
  if (mmYy) {
    const month = parseInt(mmYy[1], 10);
    const yy = parseInt(mmYy[2], 10);
    const year = 2000 + yy;
    if (month >= 1 && month <= 12) {
      return new Date(year, month, 0);
    }
  }

  // Full date variants (dd/mm/yyyy or ISO)
  const flexible = parseFlexibleDate(raw);
  if (flexible) return flexible;

  return null;
}

function ensureStockDelegate() {
  if ('stock' in prisma) return (prisma as any).stock;
  if ('Stock' in prisma) return (prisma as any).Stock;
  return null;
}

async function fetchValidadesComJangada() {
  try {
    // Get all validity records with their certificate and jangada info
    const validades = await prisma.certificadoValidade.findMany({
      include: {
        certificado: {
          include: {
            jangadasAtivas: {
              select: {
                id: true,
                serial: true,
                brand: true,
                model: true,
                owner: true,
              },
            },
          },
        },
      },
    });
    
    return validades.map((v: any) => ({
      id: v.id,
      item: v.item,
      validade: v.validade,
      certificadoId: v.certificadoId,
      jangadas: v.certificado.jangadasAtivas || [],
    }));
  } catch (error) {
    console.error('Error fetching validades:', error);
    return [];
  }
}

async function fetchStockRaw(stockScope: string): Promise<StockRecord[]> {
  const stockDelegate = ensureStockDelegate();
  if (!stockDelegate) {
    console.error('[fetchStockRaw] Stock delegate not found');
    return [];
  }
  try {
    console.log('[fetchStockRaw] Fetching stock items...');
    const where: any = {};

    if (stockScope === "jangadas-ocean") {
      where.OR = [
        { associavelJangada: true },
        {
          AND: [
            { aplicavelMarcaJangada: { contains: "ocean safety", mode: "insensitive" } },
            { codigoFabricante: { not: null } },
            { codigoFabricante: { not: "" } },
          ],
        },
      ];
    }

    const stocks = await stockDelegate.findMany({
      where,
      select: {
        id: true,
        descricao: true,
        referencia: true,
        quantidade: true,
        categoria: true,
        testeHidraulico: true,
        estadoCargaCilindro: true,
      }
    });
    console.log(`[fetchStockRaw] Found ${stocks.length} stock items`);
    return stocks.map((s: any) => ({
      id: s.id,
      descricao: s.descricao || '',
      referencia: s.referencia || '',
      quantidade: s.quantidade || 0,
      categoria: s.categoria || null,
      testeHidraulico: s.testeHidraulico || null,
      estadoCargaCilindro: s.estadoCargaCilindro || null,
    }));
  } catch (error) {
    console.error('[fetchStockRaw] Error fetching stock:', error);
    return [];
  }
}

async function fetchUpcomingInspectionRafts30d(): Promise<UpcomingInspectionRaft[]> {
  try {
    const jangadas = await prisma.jangada.findMany({
      select: {
        id: true,
        serial: true,
        brand: true,
        model: true,
        owner: true,
        dataProxInspecao: true,
      },
    });

    return jangadas.filter((j) => isWithinDays(j.dataProxInspecao, 30));
  } catch (error) {
    console.error('Error fetching upcoming inspection rafts:', error);
    return [];
  }
}

function canViewStock(access: NonNullable<Awaited<ReturnType<typeof getAccessContext>>>) {
  return access.isAdmin || canViewPath(access.permissions, "/stock") || canEditPath(access.permissions, "/stock");
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (!canViewStock(access)) {
      return NextResponse.json({ error: "Sem permissão para consultar stock." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const stockScope = String(searchParams.get("stockScope") || "").trim().toLowerCase();

    const [validades, stock, upcomingRafts30d] = await Promise.all([
      fetchValidadesComJangada(),
      fetchStockRaw(stockScope),
      fetchUpcomingInspectionRafts30d(),
    ]);
    
    console.log(`[GET] Fetched ${validades.length} validades, ${stock.length} stock items and ${upcomingRafts30d.length} upcoming rafts`);

    const aliasMap = createAliasMap();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in12Months = addMonths(today, 12);

    const within12Months = validades.filter((v: any) => {
      if (!certificateItemHasManagedValidity(v.item)) return false;
      const d = parseValidadeString(v.validade);
      if (!d) return false;
      return d <= in12Months;
    });

    const expired = within12Months.filter((v: any) => {
      const d = parseValidadeString(v.validade);
      return d ? d < today : false;
    });

    const monthlyByNeedKey = new Map<string, Map<string, number>>();
    const monthlyRaftsByNeedKey = new Map<string, Map<string, Map<number, { id: number; serial: string; brand?: string | null; model?: string | null; owner?: string | null }>>>();
    const needMeta = new Map<string, NeedMeta>();
    const needKeyToCanonical = new Map<string, string>(); // Maps need keys to canonical item names

    for (const validade of within12Months) {
      const validadeDate = parseValidadeString(validade.validade);
      if (!validadeDate) continue;

      const effectiveMonthDate = validadeDate < today ? today : validadeDate;
      const month = monthKey(effectiveMonthDate);
      const itemNorm = normalizeText(validade.item);
      
      // Try to find canonical name via alias mapping
      const canonicalItem = aliasMap.get(itemNorm) || itemNorm;
      const raftCount = Array.isArray(validade.jangadas) && validade.jangadas.length > 0
        ? validade.jangadas.length
        : 1;
      const qty = getPerRaftQuantityForItem(canonicalItem) * raftCount;
      const needKey = `item:${canonicalItem}`;

      if (!monthlyByNeedKey.has(needKey)) {
        monthlyByNeedKey.set(needKey, new Map<string, number>());
      }
      const monthMap = monthlyByNeedKey.get(needKey)!;
      monthMap.set(month, (monthMap.get(month) || 0) + qty);

      if (!monthlyRaftsByNeedKey.has(needKey)) {
        monthlyRaftsByNeedKey.set(needKey, new Map());
      }
      const raftMonthMap = monthlyRaftsByNeedKey.get(needKey)!;
      if (!raftMonthMap.has(month)) {
        raftMonthMap.set(month, new Map());
      }
      const raftRows = raftMonthMap.get(month)!;
      for (const jangada of Array.isArray(validade.jangadas) ? validade.jangadas : []) {
        const jangadaId = Number(jangada?.id || 0);
        if (!jangadaId) continue;
        raftRows.set(jangadaId, {
          id: jangadaId,
          serial: String(jangada?.serial || "").trim() || `ID ${jangadaId}`,
          brand: jangada?.brand || null,
          model: jangada?.model || null,
          owner: jangada?.owner || null,
        });
      }

      if (!needMeta.has(needKey)) {
        needMeta.set(needKey, {
          item: getBestItemLabel(validade.item, canonicalItem),
          referencia: canonicalReferenceByItem[canonicalItem] || null,
        });
      }
      
      needKeyToCanonical.set(needKey, canonicalItem);
    }

    const monthlyTotalsMap = new Map<string, number>();
    for (const [, monthMap] of monthlyByNeedKey) {
      for (const [month, qty] of monthMap) {
        monthlyTotalsMap.set(month, (monthlyTotalsMap.get(month) || 0) + qty);
      }
    }

    const upcomingRaftIds = new Set(upcomingRafts30d.map((raft) => raft.id));
    const gi30NeedMap = new Map<string, { item: string; quantidade: number }>();

    for (const validade of validades) {
      if (!certificateItemHasManagedValidity(validade.item)) continue;
      const relatedRafts = Array.isArray(validade.jangadas)
        ? validade.jangadas.filter((j: any) => upcomingRaftIds.has(j.id))
        : [];
      if (relatedRafts.length === 0) continue;

      const canonicalItem = aliasMap.get(normalizeText(validade.item)) || normalizeText(validade.item);
      if (!canonicalItem) continue;

      const current = gi30NeedMap.get(canonicalItem) || { item: getBestItemLabel(validade.item, canonicalItem), quantidade: 0 };
      current.quantidade += getPerRaftQuantityForItem(canonicalItem) * relatedRafts.length;
      gi30NeedMap.set(canonicalItem, current);
    }

    const stockByCanonical30d = new Map<string, number>();
    for (const row of stock) {
      const canonicalByName = aliasMap.get(normalizeText(row.descricao)) || normalizeText(row.descricao);
      const canonicalByRef = aliasMap.get(normalizeText(row.referencia)) || normalizeText(row.referencia);
      const canonical = canonicalByName || canonicalByRef;
      if (!canonical) continue;
      stockByCanonical30d.set(canonical, (stockByCanonical30d.get(canonical) || 0) + Number(row.quantidade || 0));
    }

    const gi30Needs: Gi30NeedRow[] = Array.from(gi30NeedMap.entries())
      .map(([canonicalKey, meta]) => {
        const stockAtual = stockByCanonical30d.get(canonicalKey) || 0;
        const necessidade30d = meta.quantidade;
        return {
          canonicalKey,
          item: meta.item,
          stockAtual,
          necessidade30d,
          saldoProjetado30d: stockAtual - necessidade30d,
          suficiente: stockAtual >= necessidade30d,
        };
      })
      .sort((a, b) => {
        if (Number(a.suficiente) !== Number(b.suficiente)) return Number(a.suficiente) - Number(b.suficiente);
        return b.necessidade30d - a.necessidade30d;
      });

    const cilindrosNecessarios30d = upcomingRafts30d.length;
    const cilindrosCheiosDisponiveis30d = stock
      .filter((row) => isCylinderLike(row))
      .filter((row) => String(row.estadoCargaCilindro || '').trim().toUpperCase() === 'CHEIO')
      .filter((row) => isHydraulicTestValidForWindow(row.testeHidraulico, 30))
      .reduce((acc, row) => acc + Number(row.quantidade || 0), 0);

    const artigosCriticosEmFalta30d = gi30Needs.filter((row) => !row.suficiente).length;

    const stockNeeds = stock.map((s) => {
      const nameNorm = normalizeText(s.descricao);
      const refNorm = normalizeText(s.referencia);
      
      // Try to match via alias mapping
      const canonicalByName = aliasMap.get(nameNorm) || nameNorm;
      const canonicalByRef = refNorm ? (aliasMap.get(refNorm) || refNorm) : "";

      const itemKeyByName = `item:${canonicalByName}`;
      const itemKeyByRef = canonicalByRef ? `item:${canonicalByRef}` : "";

      const matchedKey = (monthlyByNeedKey.has(itemKeyByName))
        ? itemKeyByName
        : ((itemKeyByRef && monthlyByNeedKey.has(itemKeyByRef)) ? itemKeyByRef : null);

      const monthMap = matchedKey ? monthlyByNeedKey.get(matchedKey)! : new Map<string, number>();
      const raftMonthMap = matchedKey ? monthlyRaftsByNeedKey.get(matchedKey) : undefined;
      const mensal: MonthlyNeed[] = Array.from(monthMap.entries())
        .map(([month, quantidade]) => ({
          month,
          quantidade,
          jangadas: Array.from(raftMonthMap?.get(month)?.values() || []).sort((a, b) =>
            a.serial.localeCompare(b.serial, "pt", { sensitivity: "base" })
          ),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const necessidade12m = mensal.reduce((acc, m) => acc + m.quantidade, 0);

      return {
        stockId: s.id,
        referencia: s.referencia,
        nome: s.descricao,
        stockAtual: Number(s.quantidade || 0),
        necessidade12m,
        saldoProjetado12m: Number(s.quantidade || 0) - necessidade12m,
        mensal,
        matchedBy: matchedKey ? "item" : null,
        matchedNeedKey: matchedKey,
      };
    });

    const matchedKeys = new Set(
      stockNeeds
        .map((s: any) => String(s?.matchedNeedKey || "").trim())
        .filter(Boolean)
    );

    const unmatchedNeeds = Array.from(monthlyByNeedKey.entries())
      .filter(([key]) => !matchedKeys.has(key))
      .map(([key, monthMap]) => {
        const meta = needMeta.get(key);
        const mensal: MonthlyNeed[] = Array.from(monthMap.entries())
          .map(([month, quantidade]) => ({ month, quantidade }))
          .sort((a, b) => a.month.localeCompare(b.month));
        return {
          key,
          referencia: meta?.referencia || null,
          nome: meta?.item || "",
          necessidade12m: mensal.reduce((acc, m) => acc + m.quantidade, 0),
          mensal: Array.from(monthMap.entries())
            .map(([month, quantidade]) => ({
              month,
              quantidade,
              jangadas: Array.from(monthlyRaftsByNeedKey.get(key)?.get(month)?.values() || []).sort((a, b) =>
                a.serial.localeCompare(b.serial, "pt", { sensitivity: "base" })
              ),
            }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        };
      })
      .sort((a, b) => b.necessidade12m - a.necessidade12m);

    const totalNecessaria12m = Array.from(monthlyTotalsMap.values()).reduce((acc, qty) => acc + qty, 0);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        artigosComValidadeAte12Meses: within12Months.length,
        artigosVencidos: expired.length,
        quantidadeTotalNecessaria12m: totalNecessaria12m,
        jangadasAfetadas: new Set(within12Months.flatMap((v: any) => v.jangadas.map((j: any) => j.id))).size,
        jangadasComInspecao30Dias: upcomingRafts30d.length,
        artigosCriticosNecessarios30Dias: gi30Needs.reduce((acc, row) => acc + row.necessidade30d, 0),
        artigosCriticosEmFalta30Dias: artigosCriticosEmFalta30d,
        cilindrosNecessarios30Dias: cilindrosNecessarios30d,
        cilindrosCheiosDisponiveis30Dias: cilindrosCheiosDisponiveis30d,
        necessidadesMensaisTotais: Array.from(monthlyTotalsMap.entries())
          .map(([month, quantidade]) => ({ month, quantidade }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      },
      stockNeeds: stockNeeds.sort((a, b) => b.necessidade12m - a.necessidade12m),
      gi30Needs,
      upcomingRafts30d,
      unmatchedNeeds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao calcular análise de validades e necessidades mensais.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
