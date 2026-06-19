import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const AGENDA_MARKER = "__AGENDA_EVENT__";

type LegacyMeta = {
  date?: string;
  responsavel?: string;
  status?: string;
  type?: string;
};

function parseLegacyMeta(raw: string | null | undefined): LegacyMeta {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        date: typeof parsed.date === "string" ? parsed.date : undefined,
        responsavel: typeof parsed.responsavel === "string" ? parsed.responsavel : undefined,
        status: typeof parsed.status === "string" ? parsed.status : undefined,
        type: typeof parsed.type === "string" ? parsed.type : undefined,
      };
    }
  } catch {
    return { date: raw };
  }

  return {};
}

async function run() {
  const legacyRows = await prisma.agenda.findMany({
    where: { tipoPesca: AGENDA_MARKER },
    orderBy: { id: "asc" },
  });

  let migrated = 0;
  let skipped = 0;

  for (const row of legacyRows) {
    const meta = parseLegacyMeta(row.embarcacoesDePesca);
    const dateText = meta.date;
    const parsedDate = dateText ? new Date(dateText) : null;

    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      skipped++;
      continue;
    }

    const title = (row.nome || "Inspeção").trim() || "Inspeção";
    const raftSerial = (row.matricula || "").trim();
    if (!raftSerial) {
      skipped++;
      continue;
    }

    const existing = await prisma.agendaEvento.findFirst({
      where: {
        raftSerial,
        date: parsedDate,
        title,
      },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.agendaEvento.create({
      data: {
        title,
        date: parsedDate,
        raftSerial,
        responsavel: meta.responsavel || "",
        status: meta.status || "scheduled",
        type: meta.type || "Inspeção",
      },
    });

    migrated++;
  }

  console.log(`[agenda-backfill] legacy rows: ${legacyRows.length}`);
  console.log(`[agenda-backfill] migrated: ${migrated}`);
  console.log(`[agenda-backfill] skipped: ${skipped}`);
}

run()
  .catch((error) => {
    console.error("[agenda-backfill] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
