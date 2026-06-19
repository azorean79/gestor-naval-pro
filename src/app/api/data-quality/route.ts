import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type SampleItem = {
  id: number;
  label: string;
  meta?: string | null;
  href: string;
};

type QualityIssue = {
  key: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  count: number;
  href: string;
  samples: SampleItem[];
};

function labelParts(...values: Array<string | null | undefined>) {
  return values.filter((value) => String(value || "").trim()).join(" · ");
}

export async function GET() {
  try {
    const [
      naviosSemCliente,
      naviosSemDadosMinimos,
      clientesSemContacto,
      jangadasSemAssociacao,
      coletesSemNavio,
      coletesSemInspecao,
      epirbsSemNavio,
      epirbsSemHex,
      epirbsSemBateria,
    ] = await Promise.all([
      prisma.navio.findMany({
        where: { clienteId: null },
        select: { id: true, nome: true, matricula: true },
        orderBy: { nome: "asc" },
        take: 6,
      }),
      prisma.navio.findMany({
        where: {
          OR: [{ mmsi: null }, { imo: null }, { portoRegisto: null }],
        },
        select: { id: true, nome: true, matricula: true, mmsi: true, imo: true, portoRegisto: true },
        orderBy: { nome: "asc" },
        take: 6,
      }),
      prisma.cliente.findMany({
        where: {
          AND: [{ email: null }, { telefone: null }, { telmovel: null }],
        },
        select: { id: true, nome: true, numeroCliente: true },
        orderBy: { nome: "asc" },
        take: 6,
      }),
      prisma.jangada.findMany({
        where: {
          shipId: null,
          OR: [{ shipNameManual: null }, { shipNameManual: "" }],
        },
        select: { id: true, serial: true, brand: true, model: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
      prisma.colete.findMany({
        where: { shipId: null },
        select: { id: true, serial: true, marca: true, modelo: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
      prisma.colete.findMany({
        where: { dataProxInspecao: null },
        select: { id: true, serial: true, marca: true, modelo: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
      (prisma as any).epirb.findMany({
        where: { shipId: null },
        select: { id: true, serial: true, marca: true, modelo: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
      (prisma as any).epirb.findMany({
        where: { OR: [{ hexId: null }, { hexId: "" }] },
        select: { id: true, serial: true, marca: true, modelo: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
      (prisma as any).epirb.findMany({
        where: { OR: [{ dataValidadeBateria: null }, { dataValidadeBateria: "" }] },
        select: { id: true, serial: true, marca: true, modelo: true },
        orderBy: { serial: "asc" },
        take: 6,
      }),
    ]);

    const [
      naviosSemClienteCount,
      naviosSemDadosMinimosCount,
      clientesSemContactoCount,
      jangadasSemAssociacaoCount,
      coletesSemNavioCount,
      coletesSemInspecaoCount,
      epirbsSemNavioCount,
      epirbsSemHexCount,
      epirbsSemBateriaCount,
    ] = await Promise.all([
      prisma.navio.count({ where: { clienteId: null } }),
      prisma.navio.count({ where: { OR: [{ mmsi: null }, { imo: null }, { portoRegisto: null }] } }),
      prisma.cliente.count({ where: { AND: [{ email: null }, { telefone: null }, { telmovel: null }] } }),
      prisma.jangada.count({ where: { shipId: null, OR: [{ shipNameManual: null }, { shipNameManual: "" }] } }),
      prisma.colete.count({ where: { shipId: null } }),
      prisma.colete.count({ where: { dataProxInspecao: null } }),
      (prisma as any).epirb.count({ where: { shipId: null } }),
      (prisma as any).epirb.count({ where: { OR: [{ hexId: null }, { hexId: "" }] } }),
      (prisma as any).epirb.count({ where: { OR: [{ dataValidadeBateria: null }, { dataValidadeBateria: "" }] } }),
    ]);

    const issues: QualityIssue[] = [
      {
        key: "jangadas-sem-associacao",
        title: "Jangadas sem navio associado",
        description: "Jangadas órfãs que continuam fora do contexto operacional do navio.",
        severity: "critical" as const,
        count: jangadasSemAssociacaoCount,
        href: "/jangadas",
        samples: jangadasSemAssociacao.map((item) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.brand, item.model),
          href: `/jangadas/${item.id}`,
        })),
      },
      {
        key: "coletes-sem-navio",
        title: "Coletes sem navio associado",
        description: "Equipamento solto na base — precisa de dono operacional.",
        severity: "critical" as const,
        count: coletesSemNavioCount,
        href: "/equipamentos",
        samples: coletesSemNavio.map((item) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.marca, item.modelo),
          href: `/equipamentos/${item.id}`,
        })),
      },
      {
        key: "epirbs-sem-navio",
        title: "EPIRBs sem navio associado",
        description: "Beacons sem contexto de embarcação, logo sem operação clara.",
        severity: "critical" as const,
        count: epirbsSemNavioCount,
        href: "/epirbs",
        samples: epirbsSemNavio.map((item: any) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.marca, item.modelo),
          href: `/epirbs/${item.id}`,
        })),
      },
      {
        key: "navios-sem-cliente",
        title: "Navios sem cliente associado",
        description: "Faltam relações comerciais/operacionais para fechar o circuito.",
        severity: "warning" as const,
        count: naviosSemClienteCount,
        href: "/navios",
        samples: naviosSemCliente.map((item) => ({
          id: item.id,
          label: item.nome,
          meta: item.matricula || null,
          href: `/navios/${item.id}`,
        })),
      },
      {
        key: "navios-sem-dados-minimos",
        title: "Navios com dados mínimos em falta",
        description: "MMSI, IMO ou porto em falta reduzem qualidade operacional e pesquisa.",
        severity: "warning" as const,
        count: naviosSemDadosMinimosCount,
        href: "/navios",
        samples: naviosSemDadosMinimos.map((item) => ({
          id: item.id,
          label: item.nome,
          meta: labelParts(item.matricula, !item.mmsi ? "sem MMSI" : null, !item.imo ? "sem IMO" : null, !item.portoRegisto ? "sem porto" : null),
          href: `/navios/${item.id}`,
        })),
      },
      {
        key: "clientes-sem-contacto",
        title: "Clientes sem qualquer contacto",
        description: "Sem email, telefone ou telemóvel — mais silêncio do que devia.",
        severity: "warning" as const,
        count: clientesSemContactoCount,
        href: "/clientes",
        samples: clientesSemContacto.map((item) => ({
          id: item.id,
          label: item.nome,
          meta: item.numeroCliente ? `Cliente ${item.numeroCliente}` : null,
          href: `/clientes/${item.id}`,
        })),
      },
      {
        key: "coletes-sem-proxima-inspecao",
        title: "Coletes sem próxima inspeção",
        description: "Sem data futura, o seguimento também fica à deriva.",
        severity: "warning" as const,
        count: coletesSemInspecaoCount,
        href: "/equipamentos",
        samples: coletesSemInspecao.map((item) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.marca, item.modelo),
          href: `/equipamentos/${item.id}`,
        })),
      },
      {
        key: "epirbs-sem-hex",
        title: "EPIRBs sem HEX ID",
        description: "Beacon registado sem identificador essencial de emergência.",
        severity: "warning" as const,
        count: epirbsSemHexCount,
        href: "/epirbs",
        samples: epirbsSemHex.map((item: any) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.marca, item.modelo),
          href: `/epirbs/${item.id}`,
        })),
      },
      {
        key: "epirbs-sem-bateria",
        title: "EPIRBs sem validade de bateria",
        description: "Sem esta data, o risco fica invisível até ser tarde demais.",
        severity: "warning" as const,
        count: epirbsSemBateriaCount,
        href: "/epirbs",
        samples: epirbsSemBateria.map((item: any) => ({
          id: item.id,
          label: item.serial,
          meta: labelParts(item.marca, item.modelo),
          href: `/epirbs/${item.id}`,
        })),
      },
    ].sort((a, b) => b.count - a.count);

    const criticalCount = issues.filter((issue) => issue.severity === "critical" && issue.count > 0).length;
    const warningCount = issues.filter((issue) => issue.severity === "warning" && issue.count > 0).length;
    const totalOpen = issues.reduce((sum, issue) => sum + issue.count, 0);

    return NextResponse.json({
      summary: {
        totalOpen,
        criticalCount,
        warningCount,
        healthyCount: issues.filter((issue) => issue.count === 0).length,
      },
      issues,
    });
  } catch (error: any) {
    console.error("Erro ao gerar painel de qualidade de dados:", error);
    return NextResponse.json({ error: error?.message || "Erro ao gerar painel de qualidade de dados." }, { status: 500 });
  }
}