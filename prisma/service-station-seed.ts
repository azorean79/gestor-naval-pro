import { PrismaClient } from "@prisma/client";

export type ServiceStationSeedItem = {
  codigo: string;
  nome: string;
  empresa?: string | null;
  localizacao?: string | null;
  territorioTipo: "AZORES" | "MAINLAND" | "MADEIRA";
  regiaoOperacional?: "NORTE" | "CENTRO" | "SUL" | "MADEIRA" | null;
  aliases: string[];
};

export const SERVICE_STATION_SEED: ServiceStationSeedItem[] = [
  {
    codigo: "ACORES",
    nome: "Açores",
    empresa: "Orey",
    localizacao: "Açores",
    territorioTipo: "AZORES",
    regiaoOperacional: null,
    aliases: ["acores", "açores", "azores", "orey azores"],
  },

];

type ServiceStationRecord = {
  id: number;
  codigo: string;
  nome: string;
};

type ServiceStationDelegate = {
  upsert(args: unknown): Promise<ServiceStationRecord>;
  findMany(args?: unknown): Promise<ServiceStationRecord[]>;
};

function getServiceStationModel(prisma: PrismaClient): ServiceStationDelegate {
  return (prisma as unknown as { serviceStation: ServiceStationDelegate }).serviceStation;
}

export function normalizeServiceStationKey(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveServiceStationCode(raw?: string | null): string | null {
  const normalized = normalizeServiceStationKey(raw);
  if (!normalized) return null;

  for (const station of SERVICE_STATION_SEED) {
    if (normalizeServiceStationKey(station.codigo) === normalized) return station.codigo;
    if (normalizeServiceStationKey(station.nome) === normalized) return station.codigo;
    if (station.aliases.some((alias) => normalizeServiceStationKey(alias) === normalized)) {
      return station.codigo;
    }
  }

  return null;
}

export async function seedServiceStations(prisma: PrismaClient) {
  const serviceStationModel = getServiceStationModel(prisma);
  const result = new Map<string, ServiceStationRecord>();
  const activeCodes = SERVICE_STATION_SEED.map((station) => station.codigo);

  for (const station of SERVICE_STATION_SEED) {
    const saved = await serviceStationModel.upsert({
      where: { codigo: station.codigo },
      update: {
        nome: station.nome,
        empresa: station.empresa ?? null,
        localizacao: station.localizacao ?? null,
        territorioTipo: station.territorioTipo,
        regiaoOperacional: station.regiaoOperacional ?? null,
        ativo: true,
      },
      create: {
        codigo: station.codigo,
        nome: station.nome,
        empresa: station.empresa ?? null,
        localizacao: station.localizacao ?? null,
        territorioTipo: station.territorioTipo,
        regiaoOperacional: station.regiaoOperacional ?? null,
        ativo: true,
      },
    });

    result.set(saved.codigo, saved);
  }

  await (prisma as unknown as { serviceStation: { updateMany(args: unknown): Promise<unknown> } }).serviceStation.updateMany({
    where: { codigo: { notIn: activeCodes } },
    data: { ativo: false },
  });

  return result;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const stations = await seedServiceStations(prisma);
    console.log(`Estações sincronizadas: ${Array.from(stations.keys()).join(", ")}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
