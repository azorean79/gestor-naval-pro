import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { extrairPortoDeMatricula } from "@/utils/portosRegisto";
import { logAuditoria } from "@/lib/auditoria";
import { isValidImo, isValidMmsi } from "@/lib/validators";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { parseCoordinate } from "@/lib/coordinates";
import { resolveActiveServiceStationId } from "@/lib/station-selection";
import { APP_CONFIG, normalizeStationMatchToken } from "@/lib/app-config";
import { getResolvedClienteIslandForNavio, normalizeManualNavioIsland } from "@/lib/navio-island-resolution";
import { normalizeNavioDisplayName } from '@/lib/navio-name-normalization';

function isMissingNavioComprimentoMetrosColumn(error: unknown) {
  const message = String(error || "");
  return message.includes("Navio.comprimentoMetros") || message.includes("column `comprimentoMetros` does not exist");
}

function isMissingDatabaseColumnError(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("does not exist in the current database")
    || (message.includes("column") && message.includes("does not exist"))
    || message.includes("unknown field")
  );
}

async function findNaviosWithResilientSelect(where: any) {
  try {
    return await prisma.navio.findMany({
      where,
      select: {
        id: true,
        serviceStationId: true,
        nome: true,
        matricula: true,
        portoRegisto: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        comprimentoMetros: true,
        zonaNavegacao: true,
        proprietario: true,
        bandeira: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        lat: true,
        lng: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            ilha: true,
            nif: true,
          },
        },
        serviceStation: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            regiaoOperacional: true,
            territorioTipo: true,
          },
        },
      },
    });
  } catch (error) {
    if (!isMissingDatabaseColumnError(error)) throw error;

    const navios = await prisma.navio.findMany({
      where,
      select: {
        id: true,
        serviceStationId: true,
        nome: true,
        matricula: true,
        portoRegisto: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        proprietario: true,
        bandeira: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        lat: true,
        lng: true,
        clienteId: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            ilha: true,
            nif: true,
          },
        },
      },
    });

    return navios.map((navio) => ({
      ...navio,
      comprimentoMetros: null,
      zonaNavegacao: null,
      serviceStation: null,
    }));
  }
}

async function resolveScopedStationIdsForApp(access: Awaited<ReturnType<typeof getAccessContext>>, req: NextRequest) {
  if (!access) return [] as number[];

  const activeStationId = resolveActiveServiceStationId(req, access);
  if (activeStationId) return [activeStationId];

  if (!access.isAdmin) {
    return access.allowedStationIds.length ? access.allowedStationIds : [-1];
  }

  const targetToken = normalizeStationMatchToken(APP_CONFIG.defaultServiceStationCode);
  if (!targetToken) return [] as number[];

  const stations = await prisma.serviceStation.findMany({
    where: { ativo: true },
    select: { id: true, codigo: true, nome: true, regiaoOperacional: true },
  });

  return stations
    .filter((station) => (
      normalizeStationMatchToken(station.codigo) === targetToken
      || normalizeStationMatchToken(station.nome) === targetToken
      || normalizeStationMatchToken(station.regiaoOperacional) === targetToken
    ))
    .map((station) => station.id);
}

function resolveClienteId(body: any) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, "clienteId")) return undefined;
  if (body?.clienteId === null || body?.clienteId === "") return null;

  const parsed = Number(body?.clienteId);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return null;
}

function resolveOptionalPositiveFloat(body: any, key: string) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, key)) return undefined;

  const rawValue = body?.[key];
  if (rawValue === null || rawValue === "") return null;

  const normalized = String(rawValue).trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function sanitizeNavioPayload(body: any) {
  const bandeiraValue = typeof body?.bandeira === "string" ? body.bandeira.trim() : "";
  const lat = Object.prototype.hasOwnProperty.call(body || {}, "lat") ? parseCoordinate(body?.lat, "lat") : undefined;
  const lng = Object.prototype.hasOwnProperty.call(body || {}, "lng") ? parseCoordinate(body?.lng, "lng") : undefined;
  const comprimentoMetros = resolveOptionalPositiveFloat(body, "comprimentoMetros");
  const payload: any = {
    nome: typeof body?.nome === "string" ? normalizeNavioDisplayName(body.nome) : undefined,
    matricula: typeof body?.matricula === "string" ? body.matricula.trim() : undefined,
    ilha: typeof body?.ilha === "string" ? body.ilha.trim() : undefined,
    tipoPesca: typeof body?.tipoPesca === "string" ? body.tipoPesca.trim() : undefined,
    tipoNavio: typeof body?.tipoNavio === "string" ? body.tipoNavio.trim() : undefined,
    comprimentoMetros,
    zonaNavegacao: typeof body?.zonaNavegacao === "string" ? (body.zonaNavegacao.trim() || null) : undefined,
    proprietario: typeof body?.proprietario === "string" ? body.proprietario.trim() : undefined,
    portoRegisto: typeof body?.portoRegisto === "string" ? body.portoRegisto.trim() : undefined,
    bandeira: bandeiraValue || "Portugal",
    mmsi: typeof body?.mmsi === "string" ? body.mmsi.trim() : undefined,
    imo: typeof body?.imo === "string" ? body.imo.trim() : undefined,
    callSignal: typeof body?.callSignal === "string" ? body.callSignal.trim() : undefined,
    lat,
    lng,
    clienteId: resolveClienteId(body),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  if (!payload.portoRegisto && payload.matricula) {
    const portoInferido = extrairPortoDeMatricula(payload.matricula);
    if (portoInferido) payload.portoRegisto = portoInferido;
  }

  return payload;
}

async function applyResolvedIslandToNavioPayload(
  payload: Record<string, unknown>,
  options?: { effectiveClienteId?: number | null; fallbackIlha?: string | null }
) {
  const effectiveClienteId = options?.effectiveClienteId !== undefined
    ? options.effectiveClienteId
    : (typeof payload.clienteId === "number" ? payload.clienteId : undefined);

  if (typeof effectiveClienteId === "number" && Number.isFinite(effectiveClienteId) && effectiveClienteId > 0) {
    const { cliente, island } = await getResolvedClienteIslandForNavio(effectiveClienteId);
    if (!cliente) {
      throw new Error("Cliente associado não encontrado.");
    }

    payload.clienteId = effectiveClienteId;
    payload.ilha = island ?? normalizeManualNavioIsland(payload.ilha) ?? options?.fallbackIlha ?? payload.ilha ?? "";
    return payload;
  }

  const normalizedManualIsland = normalizeManualNavioIsland(payload.ilha);
  if (normalizedManualIsland !== null) {
    payload.ilha = normalizedManualIsland;
  }

  return payload;
}

// DELETE em lote: recebe { ids: number[] }
export async function DELETE(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) return NextResponse.json({ error: "Sem permissão para eliminar navios." }, { status: 403 });

    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Envie um array de IDs para exclusão em lote." }, { status: 400 });
    }

    const existentes = await prisma.navio.findMany({ where: { id: { in: ids } } });
    await prisma.navio.deleteMany({ where: { id: { in: ids } } });
    await Promise.all(
      existentes.map((item) =>
        logAuditoria({
          tabela: "Navio",
          tipoOperacao: "DELETE",
          idRegisto: item.id,
          descricao: `Exclusão em lote do navio ${item.nome}`,
          dadosAntes: item,
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar navios", details: error }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scopeAll = searchParams.get("scope") === "all";
    const id = searchParams.get("id");

    if (id) {
      const navio = await prisma.navio.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          serviceStationId: true,
          nome: true,
          matricula: true,
          portoRegisto: true,
          ilha: true,
          tipoPesca: true,
          tipoNavio: true,
          proprietario: true,
          bandeira: true,
          mmsi: true,
          imo: true,
          callSignal: true,
          lat: true,
          lng: true,
          clienteId: true,
          cliente: true,
        },
      });

      if (!navio) {
        return NextResponse.json({ error: "Navio não encontrado." }, { status: 404 });
      }

      if (!access.isAdmin && !access.allowedStationIds.includes(Number(navio.serviceStationId || 0))) {
        return NextResponse.json({ error: "Sem permissão para aceder a este navio." }, { status: 403 });
      }

      const jangadas = await prisma.jangada.findMany({ where: { shipId: navio.id } });
      const portoInferido = navio.portoRegisto || extrairPortoDeMatricula(navio.matricula || "") || null;
      return NextResponse.json({ ...navio, portoRegisto: portoInferido, jangadas });
    }

    const where: any = {};
    const scopedStationIds = scopeAll && access.isAdmin ? [] : await resolveScopedStationIdsForApp(access, req);
    if (scopedStationIds.length === 1) {
      where.OR = access.isAdmin
        ? [{ serviceStationId: scopedStationIds[0] }, { serviceStationId: null }]
        : [{ serviceStationId: scopedStationIds[0] }];
    } else if (scopedStationIds.length > 1) {
      where.OR = access.isAdmin
        ? [{ serviceStationId: { in: scopedStationIds } }, { serviceStationId: null }]
        : [{ serviceStationId: { in: scopedStationIds } }];
    }
    if (searchParams.get("nome")) where.nome = { contains: searchParams.get("nome"), mode: "insensitive" };
    if (searchParams.get("matricula")) where.matricula = { contains: searchParams.get("matricula"), mode: "insensitive" };
    if (searchParams.get("ilha")) where.ilha = { contains: searchParams.get("ilha"), mode: "insensitive" };
    const serviceStationIdParam = searchParams.get("serviceStationId");
    if (serviceStationIdParam) {
      const parsedStationId = Number(serviceStationIdParam);
      if (Number.isFinite(parsedStationId) && parsedStationId > 0) {
        delete where.OR;
        where.serviceStationId = parsedStationId;
      }
    }
    if (searchParams.get("tipoPesca")) where.tipoPesca = { contains: searchParams.get("tipoPesca"), mode: "insensitive" };
    if (searchParams.get("tipoNavio")) where.tipoNavio = { contains: searchParams.get("tipoNavio"), mode: "insensitive" };
    const clienteIdParam = searchParams.get("clienteId");
    if (clienteIdParam !== null) {
      const normalized = clienteIdParam.trim().toLowerCase();
      if (normalized === "" || normalized === "null" || normalized === "none" || normalized === "sem-cliente") {
        where.clienteId = null;
      } else {
        const parsed = Number(clienteIdParam);
        if (!Number.isFinite(parsed)) {
          return NextResponse.json({ error: 'clienteId inválido' }, { status: 400 });
        }
        where.clienteId = parsed;
      }
    }

    const navios = await findNaviosWithResilientSelect(where);

    return NextResponse.json(
      navios.map((n) => ({
        ...n,
        bandeira: n.bandeira || "Portugal",
        portoRegisto: n.portoRegisto || extrairPortoDeMatricula(n.matricula || "") || null,
      }))
    );
  } catch (error) {
    console.error('Error loading navios:', error);
    return buildDatabaseErrorResponse(error, 'Erro ao carregar navios.');
  }
}

// Permite criar navios individualmente ou em massa via POST
export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) return NextResponse.json({ error: "Sem permissão para criar navios." }, { status: 403 });

    const body = await req.json();
    if (Array.isArray(body)) {
      const rows = [] as Record<string, unknown>[];
      for (const row of body) {
        const payload = sanitizeNavioPayload(row) as Record<string, unknown>;
        rows.push(await applyResolvedIslandToNavioPayload(payload));
      }

      const created = await prisma.navio.createMany({ data: rows as any });
      return NextResponse.json({ count: created.count });
    }

    const data = await applyResolvedIslandToNavioPayload(sanitizeNavioPayload(body) as Record<string, unknown>);
    if (data.nome) {
      const existingNavio = await prisma.navio.findFirst({
        where: {
          nome: {
            equals: data.nome as string,
            mode: 'insensitive',
          },
        },
      });
      if (existingNavio) {
        return NextResponse.json({ error: 'Já existe um navio com esse nome registado.' }, { status: 400 });
      }
    }
    if (!data.nome) {
      return NextResponse.json({ error: "Campo obrigatório: nome." }, { status: 400 });
    }

    data.matricula = data.matricula || "";
    data.ilha = data.ilha || "";
    data.tipoPesca = data.tipoPesca || "";

    const activeStationId = resolveActiveServiceStationId(req, access);
    if (activeStationId) {
      data.serviceStationId = activeStationId;
    }

    const mmsiValue = typeof data.mmsi === "string" ? data.mmsi : null;
    const imoValue = typeof data.imo === "string" ? data.imo : null;

    if (!isValidMmsi(mmsiValue)) {
      return NextResponse.json({ error: "MMSI inválido. Deve ter 9 dígitos." }, { status: 400 });
    }

    if (!isValidImo(imoValue)) {
      return NextResponse.json({ error: "IMO inválido. Deve ter 7 dígitos." }, { status: 400 });
    }

    let created;

    try {
      created = await prisma.navio.create({
        data: data as any,
        select: {
          id: true,
          nome: true,
          matricula: true,
          ilha: true,
          tipoPesca: true,
          tipoNavio: true,
          comprimentoMetros: true,
          proprietario: true,
          bandeira: true,
          mmsi: true,
          imo: true,
          callSignal: true,
          lat: true,
          lng: true,
          clienteId: true,
        },
      });
    } catch (error) {
      if (!isMissingNavioComprimentoMetrosColumn(error)) throw error;

      const fallbackData = { ...data } as Record<string, unknown>;
      delete fallbackData.comprimentoMetros;

      created = await prisma.navio.create({
        data: fallbackData as any,
        select: {
          id: true,
          nome: true,
          matricula: true,
          ilha: true,
          tipoPesca: true,
          tipoNavio: true,
          proprietario: true,
          bandeira: true,
          mmsi: true,
          imo: true,
          callSignal: true,
          lat: true,
          lng: true,
          clienteId: true,
        },
      });

      created = { ...created, comprimentoMetros: null };
    }

    await logAuditoria({
      tabela: "Navio",
      tipoOperacao: "CREATE",
      idRegisto: created.id,
      descricao: `Criação do navio ${created.nome}`,
      dadosDepois: created,
    });

    return NextResponse.json(created);
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao criar navio");
  }
}

