import { PrismaClient } from "@prisma/client";
import { resolveServiceStationCode, seedServiceStations } from "../prisma/service-station-seed";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const DEFAULT_STATION_CODE = "ACORES";
const AZORES_ISLANDS = new Set([
  "sao miguel",
  "santa maria",
  "terceira",
  "graciosa",
  "sao jorge",
  "pico",
  "faial",
  "flores",
  "corvo",
]);

type IdRecord = { id: number; serviceStationId: number | null };

type ContactoInternoRecord = {
  email: string | null;
  nome: string;
  localizacao: string | null;
};

function normalize(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveIslandStationCode(ilha?: string | null) {
  const normalized = normalize(ilha);
  if (!normalized) return null;
  if (AZORES_ISLANDS.has(normalized)) return "ACORES";
  if (normalized === "madeira" || normalized === "porto santo") return "MADEIRA";
  return null;
}

function resolveTerritorioGrupo(ilha?: string | null, serviceStationCode?: string | null) {
  const normalizedIlha = normalize(ilha);
  if (serviceStationCode === "ACORES") {
    return ilha?.trim() || null;
  }
  if (serviceStationCode === "MADEIRA") {
    return "MADEIRA";
  }
  if (serviceStationCode === "AVELEDA") {
    return "NORTE";
  }
  if (serviceStationCode === "CENTRO") {
    return "CENTRO";
  }
  if (serviceStationCode === "SUL_ALGARVE") {
    return "SUL";
  }
  if (normalizedIlha === "madeira" || normalizedIlha === "porto santo") return "MADEIRA";
  return null;
}

async function main() {
  const clienteModel = prisma.cliente as any;
  const navioModel = prisma.navio as any;
  const jangadaModel = prisma.jangada as any;
  const tecnicoModel = prisma.tecnico as any;
  const ordemServicoModel = prisma.ordemServico as any;
  const serviceStationQueueModel = prisma.serviceStationQueue as any;

  const stations = await seedServiceStations(prisma);
  const defaultStation = stations.get(DEFAULT_STATION_CODE);
  if (!defaultStation) {
    throw new Error(`Estação default ${DEFAULT_STATION_CODE} não encontrada.`);
  }

  const contactos = await prisma.contactoInterno.findMany({
    select: { email: true, nome: true, localizacao: true },
  });

  const stationByEmail = new Map<string, string>();
  const stationByName = new Map<string, string>();

  for (const contacto of contactos as ContactoInternoRecord[]) {
    const stationCode = resolveServiceStationCode(contacto.localizacao);
    if (!stationCode) continue;
    const emailKey = normalize(contacto.email);
    const nameKey = normalize(contacto.nome);
    if (emailKey) stationByEmail.set(emailKey, stationCode);
    if (nameKey) stationByName.set(nameKey, stationCode);
  }

  const clienteResults = { updated: 0, fallback: 0 };
  const navioResults = { updated: 0, fallback: 0, territorioUpdated: 0 };
  const jangadaResults = { updated: 0, fallback: 0 };
  const tecnicoResults = { updated: 0, fallback: 0 };
  const ordemResults = { updated: 0, fallback: 0 };
  const queueResults = { updated: 0, fallback: 0 };

  const clientes = await clienteModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, ilha: true, localidade: true },
  });

  for (const cliente of clientes) {
    const stationCode =
      resolveIslandStationCode(cliente.ilha) ||
      resolveServiceStationCode(cliente.localidade) ||
      DEFAULT_STATION_CODE;
    const stationId = stations.get(stationCode)?.id ?? defaultStation.id;
    if (stationCode === DEFAULT_STATION_CODE) clienteResults.fallback += 1;
    if (APPLY) {
      await clienteModel.update({ where: { id: cliente.id }, data: { serviceStationId: stationId } });
    }
    clienteResults.updated += 1;
  }

  const navios = await navioModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, ilha: true, clienteId: true },
  });

  for (const navio of navios) {
    let stationId: number | null = null;
    let stationCode: string | null = resolveIslandStationCode(navio.ilha);

    if (!stationCode && navio.clienteId) {
      const cliente = await clienteModel.findUnique({ where: { id: navio.clienteId }, select: { serviceStationId: true } });
      stationId = cliente?.serviceStationId ?? null;
      stationCode = Array.from(stations.values()).find((item) => item.id === stationId)?.codigo ?? null;
    }

    if (!stationCode) {
      stationCode = DEFAULT_STATION_CODE;
      navioResults.fallback += 1;
    }

    if (!stationId) {
      stationId = stations.get(stationCode)?.id ?? defaultStation.id;
    }

    const territorioGrupo = resolveTerritorioGrupo(navio.ilha, stationCode);
    if (APPLY) {
      await navioModel.update({
        where: { id: navio.id },
        data: { serviceStationId: stationId, territorioGrupo },
      });
    }
    navioResults.updated += 1;
    if (territorioGrupo) navioResults.territorioUpdated += 1;
  }

  const jangadas = await jangadaModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, shipId: true },
  });

  for (const jangada of jangadas) {
    let stationId: number | null = null;
    if (jangada.shipId) {
      const navio = await navioModel.findUnique({ where: { id: jangada.shipId }, select: { serviceStationId: true } });
      stationId = navio?.serviceStationId ?? null;
    }
    if (!stationId) {
      stationId = defaultStation.id;
      jangadaResults.fallback += 1;
    }
    if (APPLY) {
      await jangadaModel.update({ where: { id: jangada.id }, data: { serviceStationId: stationId } });
    }
    jangadaResults.updated += 1;
  }

  const tecnicos = await tecnicoModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, email: true, nome: true },
  });

  for (const tecnico of tecnicos) {
    const stationCode =
      stationByEmail.get(normalize(tecnico.email)) ||
      stationByName.get(normalize(tecnico.nome)) ||
      DEFAULT_STATION_CODE;
    const stationId = stations.get(stationCode)?.id ?? defaultStation.id;
    if (stationCode === DEFAULT_STATION_CODE) tecnicoResults.fallback += 1;
    if (APPLY) {
      await tecnicoModel.update({ where: { id: tecnico.id }, data: { serviceStationId: stationId } });
    }
    tecnicoResults.updated += 1;
  }

  const ordens = await ordemServicoModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, jangadaId: true, shipId: true, clienteId: true, tecnicoId: true },
  });

  for (const ordem of ordens) {
    let stationId: number | null = null;

    if (ordem.jangadaId) {
      const jangada = await jangadaModel.findUnique({ where: { id: ordem.jangadaId }, select: { serviceStationId: true } });
      stationId = jangada?.serviceStationId ?? null;
    }
    if (!stationId && ordem.shipId) {
      const navio = await navioModel.findUnique({ where: { id: ordem.shipId }, select: { serviceStationId: true } });
      stationId = navio?.serviceStationId ?? null;
    }
    if (!stationId && ordem.clienteId) {
      const cliente = await clienteModel.findUnique({ where: { id: ordem.clienteId }, select: { serviceStationId: true } });
      stationId = cliente?.serviceStationId ?? null;
    }
    if (!stationId && ordem.tecnicoId) {
      const tecnico = await tecnicoModel.findUnique({ where: { id: ordem.tecnicoId }, select: { serviceStationId: true } });
      stationId = tecnico?.serviceStationId ?? null;
    }
    if (!stationId) {
      stationId = defaultStation.id;
      ordemResults.fallback += 1;
    }
    if (APPLY) {
      await ordemServicoModel.update({ where: { id: ordem.id }, data: { serviceStationId: stationId } });
    }
    ordemResults.updated += 1;
  }

  const queueItems = await serviceStationQueueModel.findMany({
    where: { serviceStationId: null },
    select: { id: true, jangadaId: true, ordemServicoId: true },
  });

  for (const item of queueItems) {
    let stationId: number | null = null;
    if (item.ordemServicoId) {
      const ordem = await ordemServicoModel.findUnique({ where: { id: item.ordemServicoId }, select: { serviceStationId: true } });
      stationId = ordem?.serviceStationId ?? null;
    }
    if (!stationId && item.jangadaId) {
      const jangada = await jangadaModel.findUnique({ where: { id: item.jangadaId }, select: { serviceStationId: true } });
      stationId = jangada?.serviceStationId ?? null;
    }
    if (!stationId) {
      stationId = defaultStation.id;
      queueResults.fallback += 1;
    }
    if (APPLY) {
      await serviceStationQueueModel.update({ where: { id: item.id }, data: { serviceStationId: stationId } });
    }
    queueResults.updated += 1;
  }

  console.log(`Modo: ${APPLY ? "apply" : "dry-run"}`);
  console.log("Service stations seeded:", Array.from(stations.keys()).join(", "));
  console.table({
    clientes: clienteResults,
    navios: navioResults,
    jangadas: jangadaResults,
    tecnicos: tecnicoResults,
    ordensServico: ordemResults,
    serviceStationQueue: queueResults,
  });
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
