import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getInspectionStatus } from "@/lib/inspection-status";
import { daysUntil } from "@/lib/date-utils";

const JANGADA_SELECT = {
  id: true,
  serial: true,
  brand: true,
  model: true,
  capacity: true,
  owner: true,
  shipId: true,
  shipNameManual: true,
  dataInspecao: true,
  dataProxInspecao: true,
  ultimoCertificadoNumero: true,
  certificadoExternoNumero: true,
  certificadoExternoUrl: true,
  hruReferencia: true,
  hruValidade: true,
  radarReflector: true,
  radarReflectorValidade: true,
  cylinderDataTeste: true,
  cylinderDataProxTeste: true,
  cylinderSistema: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nif = searchParams.get("nif")?.trim();
    const codigo = searchParams.get("codigo")?.trim();

    if (!nif && !codigo) {
      return NextResponse.json({ error: "Indique o NIF ou o Código de Cliente para aceder ao portal." }, { status: 400 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: nif ? { nif } : { numeroCliente: codigo },
      include: {
        navios: { select: { id: true, nome: true } },
        ordensServico: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            numeroOrdem: true,
            status: true,
            orcamentoStatus: true,
            valorTotal: true,
            createdAt: true,
            dataConclusao: true,
            jangada: { select: JANGADA_SELECT },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado com as credenciais fornecidas." }, { status: 404 });
    }

    const navioIds = (cliente.navios || []).map((n) => n.id);
    const jangadasDeNavios = navioIds.length > 0
      ? await prisma.jangada.findMany({
          where: { shipId: { in: navioIds } },
          select: { ...JANGADA_SELECT },
          orderBy: { serial: "asc" },
        })
      : [];

    const jangadasDeOrdens = (cliente.ordensServico || [])
      .map((o) => o.jangada)
      .filter((j): j is NonNullable<typeof j> => Boolean(j));

    const jangadas = Array.from(
      new Map(
        [...jangadasDeNavios, ...jangadasDeOrdens].map((j) => [j.id, j] as const)
      ).values()
    );

    const navioNomePorId = new Map((cliente.navios || []).map((n) => [n.id, n.nome]));

    const jangadasComEstado = jangadas.map((j) => {
      const status = getInspectionStatus(j.dataProxInspecao);
      const navioNome = j.shipId && navioNomePorId.has(j.shipId)
        ? navioNomePorId.get(j.shipId)
        : j.shipNameManual || null;
      return {
        id: j.id,
        serial: j.serial,
        brand: j.brand,
        model: j.model,
        capacity: j.capacity,
        owner: j.owner,
        navioNome,
        dataInspecao: j.dataInspecao,
        dataProxInspecao: j.dataProxInspecao,
        status,
        diasParaProxima: status.daysLeft,
        ultimoCertificadoNumero: j.ultimoCertificadoNumero,
        certificadoExternoNumero: j.certificadoExternoNumero,
        certificadoExternoUrl: j.certificadoExternoUrl,
        hruReferencia: j.hruReferencia,
        hruValidade: j.hruValidade,
        diasHru: daysUntil(j.hruValidade),
        radarReflector: j.radarReflector,
        radarReflectorValidade: j.radarReflectorValidade,
        diasRadarReflector: daysUntil(j.radarReflectorValidade),
        cylinderSistema: j.cylinderSistema,
        cylinderDataTeste: j.cylinderDataTeste,
        cylinderDataProxTeste: j.cylinderDataProxTeste,
        diasProxTesteCilindro: daysUntil(j.cylinderDataProxTeste),
      };
    });

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        nif: cliente.nif,
        numeroCliente: cliente.numeroCliente,
        morada: cliente.morada,
        ilha: cliente.ilha,
      },
      jangadas: jangadasComEstado,
      ordensServico: cliente.ordensServico,
    });
  } catch (error) {
    console.error("[GET /api/portal/cliente-auth]", error);
    return NextResponse.json({ error: "Erro ao autenticar no portal do cliente." }, { status: 500 });
  }
}
