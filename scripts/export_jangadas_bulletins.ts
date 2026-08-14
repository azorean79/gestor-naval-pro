/**
 * Gera um snapshot JSON de todas as jangadas com o mesmo enriquecimento da
 * list API (`GET /api/jangadas`), incluindo boletins de serviço aplicáveis.
 *
 * Uso:
 *   npx tsx scripts/export_jangadas_bulletins.ts
 *
 * Saída:
 *   scripts/jangadas_result.json  (UTF-8 com BOM, CRLF, indentação 4)
 *
 * O snapshot antigo (2026-08) tinha acentos duplamente codificados ("Sǜo
 * Miguel"); este script volta a gerar o ficheiro em UTF-8 correto.
 */
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import {
  canonicalizeCylinderSistema,
  canonicalizeRaftBrand,
  canonicalizeRaftModel,
  normalizeUpperText,
} from "@/lib/text-normalization";
import {
  formatTechnicalBulletinShortLabel,
  getApplicableServiceBulletinsForRaft,
} from "@/modules/rafts/serviceBulletins";

function isLegacyAlmarModel(value: unknown) {
  return normalizeUpperText(value) === "ALMAR";
}

function normalizeBrandName(value: unknown, model?: unknown) {
  if (isLegacyAlmarModel(model)) return "ALMAR";
  return canonicalizeRaftBrand(value ?? "");
}

function normalizeRaftModel(value: unknown, brand?: unknown, packType?: unknown) {
  if (isLegacyAlmarModel(value)) return "STD";
  return canonicalizeRaftModel(value ?? "", brand, packType);
}

function parseServiceStationMeta(raw?: string | null) {
  const text = String(raw || "").trim();
  if (!text) return {} as { scheduledAt?: string; startedAt?: string; finishedAt?: string; deliveredAt?: string };

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return {
        scheduledAt: typeof parsed.scheduledAt === "string" ? parsed.scheduledAt : undefined,
        startedAt: typeof parsed.startedAt === "string" ? parsed.startedAt : undefined,
        finishedAt: typeof parsed.finishedAt === "string" ? parsed.finishedAt : undefined,
        deliveredAt: typeof parsed.deliveredAt === "string" ? parsed.deliveredAt : undefined,
      };
    }
  } catch {
    // nota de texto simples legada
  }

  return {} as { scheduledAt?: string; startedAt?: string; finishedAt?: string; deliveredAt?: string };
}

async function main() {
  const jangadas = await prisma.jangada.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      serial: true,
      brand: true,
      model: true,
      launchType: true,
      painterLength: true,
      maxStowageHeight: true,
      capacity: true,
      owner: true,
      dataFabrico: true,
      packType: true,
      containerModel: true,
      shipId: true,
      shipNameManual: true,
      serviceStationId: true,
      serviceStation: { select: { id: true, codigo: true, nome: true } },
      dataInspecao: true,
      dataProxInspecao: true,
      cylinderSerial: true,
      cylinderTara: true,
      cylinderPesoBruto: true,
      cylinderCo2: true,
      cylinderN2: true,
      cylinderDataTeste: true,
      cylinderDataProxTeste: true,
      cylinderSistema: true,
      cylinderCabecaDisparoRef: true,
      cylinderCabecaDisparoSerial: true,
      cylinderCabecaDisparoDescricao: true,
      cylinderTuboCamaraSuperiorRef: true,
      cylinderTuboCamaraSuperiorDescricao: true,
      cylinderTuboCamaraInferiorRef: true,
      cylinderTuboCamaraInferiorDescricao: true,
      cylinderAcessoriosCamaraSuperiorJson: true,
      cylinderAcessoriosCamaraInferiorJson: true,
      valvulasAlivio: true,
      valvulasAtestar: true,
      hruReferencia: true,
      hruDataInstalacao: true,
      hruValidade: true,
      radarReflector: true,
      radarReflectorValidade: true,
      tuboIdentificacao: true,
      numeroObra: true,
      artigos: {
        select: {
          id: true,
          name: true,
          quantidade: true,
          validade: true,
          referencia: true,
          codigoFabricante: true,
        },
      },
      createdAt: true,
      updatedAt: true,
      certificadoAtivoId: true,
    },
  });

  const shipIds = Array.from(
    new Set(
      jangadas
        .map((item) => item.shipId)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
    )
  );

  const shipsById = shipIds.length
    ? new Map(
        (
          await prisma.navio.findMany({
            where: { id: { in: shipIds } },
            select: {
              id: true,
              nome: true,
              cliente: { select: { id: true, nome: true, ilha: true } },
            },
          })
        ).map((ship) => [ship.id, ship])
      )
    : new Map<number, { id: number; nome: string; cliente: { id: number; nome: string; ilha: string | null } | null }>();

  const jangadaIds = jangadas.map((item) => item.id);

  const queueRows = jangadaIds.length
    ? await prisma.serviceStationQueue.findMany({
        where: { jangadaId: { in: jangadaIds } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          jangadaId: true,
          status: true,
          dataChegada: true,
          dataPrevistaEntrega: true,
          observacoes: true,
        },
      })
    : [];

  const latestQueueByRaft = new Map<number, (typeof queueRows)[number]>();
  for (const row of queueRows) {
    if (!latestQueueByRaft.has(row.jangadaId)) {
      latestQueueByRaft.set(row.jangadaId, row);
    }
  }

  const latestInspections = jangadaIds.length
    ? await prisma.inspecao.findMany({
        where: {
          OR: [
            { jangadaId: { in: jangadaIds } },
            { jangadaSerial: { in: jangadas.map((j) => j.serial).filter(Boolean) } },
          ],
          status: "Concluída",
        },
        orderBy: [{ dataInspecao: "desc" }, { id: "desc" }],
        select: {
          jangadaId: true,
          jangadaSerial: true,
          dataInspecao: true,
          dataProxInspecao: true,
        },
      })
    : [];

  const latestInspByRaftId = new Map<number, (typeof latestInspections)[number]>();
  const latestInspByRaftSerial = new Map<string, (typeof latestInspections)[number]>();
  for (const insp of latestInspections) {
    if (insp.jangadaId && !latestInspByRaftId.has(insp.jangadaId)) {
      latestInspByRaftId.set(insp.jangadaId, insp);
    }
    if (insp.jangadaSerial && !latestInspByRaftSerial.has(insp.jangadaSerial)) {
      latestInspByRaftSerial.set(insp.jangadaSerial, insp);
    }
  }

  const enriched = jangadas.map((jangada) => {
    const latestQueue = latestQueueByRaft.get(jangada.id);
    const meta = parseServiceStationMeta(latestQueue?.observacoes);
    const applicableServiceBulletins = getApplicableServiceBulletinsForRaft(jangada);

    const linkedShip = jangada.shipId ? (shipsById.get(jangada.shipId) || null) : null;

    const latestInsp =
      (jangada.id ? latestInspByRaftId.get(jangada.id) : null) ||
      (jangada.serial ? latestInspByRaftSerial.get(jangada.serial) : null);

    const effectiveDataInspecao = latestInsp?.dataInspecao || jangada.dataInspecao;
    const effectiveDataProxInspecao = latestInsp?.dataProxInspecao || jangada.dataProxInspecao;

    return {
      ...jangada,
      dataInspecao: effectiveDataInspecao,
      dataProxInspecao: effectiveDataProxInspecao,
      linkedShipName: linkedShip?.nome || null,
      navio: linkedShip
        ? {
            nome: linkedShip.nome,
            cliente: linkedShip.cliente
              ? {
                  id: linkedShip.cliente.id,
                  nome: linkedShip.cliente.nome,
                  ilha: linkedShip.cliente.ilha,
                }
              : undefined,
          }
        : undefined,
      brand: normalizeBrandName(jangada.brand, jangada.model),
      model: normalizeRaftModel(jangada.model, jangada.brand, jangada.packType),
      cylinderSistema: canonicalizeCylinderSistema(jangada.cylinderSistema),
      status: latestQueue?.status || null,
      inQueue: !!latestQueue,
      queueStatus: latestQueue?.status || null,
      queueDataChegada: latestQueue?.dataChegada?.toISOString() || null,
      queueDataPrevistaEntrega: latestQueue?.dataPrevistaEntrega?.toISOString().slice(0, 10) || null,
      queueObservacoes: latestQueue?.observacoes || null,
      serviceStationName: jangada.serviceStation?.nome || null,
      ilha: linkedShip?.cliente?.ilha || null,
      receivedAt: latestQueue?.dataChegada?.toISOString() || null,
      expectedDeliveryDate: latestQueue?.dataPrevistaEntrega?.toISOString().slice(0, 10) || null,
      delivered: Boolean(meta.deliveredAt),
      deliveredAt: meta.deliveredAt || null,
      scheduledAt: meta.scheduledAt || null,
      startedAt: meta.startedAt || null,
      finishedAt: meta.finishedAt || null,
      applicableServiceBulletinsCount: applicableServiceBulletins.length,
      applicableServiceBulletinTitles: applicableServiceBulletins.map((bulletin) =>
        formatTechnicalBulletinShortLabel(bulletin)
      ),
    };
  });

  const output = path.join(__dirname, "jangadas_result.json");
  const json = JSON.stringify(enriched, null, 4).replace(/\n/g, "\r\n");
  fs.writeFileSync(output, "\uFEFF" + json + "\r\n", "utf8");
  console.log(`Snapshot escrito: ${output} (${enriched.length} jangadas)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
