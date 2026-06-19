const bcrypt = require("bcryptjs");
const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const DEFAULT_PASSWORD = "lisboa123";

function normalizeSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildStationEmail(stationCode, stationName) {
  const base = normalizeSlug(stationCode) || normalizeSlug(stationName) || "estacao";
  return `estacao.${base}@orey.local`;
}

async function main() {
  const stations = await prisma.serviceStation.findMany({
    where: { ativo: true },
    select: { id: true, codigo: true, nome: true },
    orderBy: [{ codigo: "asc" }],
  });

  if (!stations.length) {
    console.log("Nenhuma estação ativa encontrada.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let created = 0;
  let skipped = 0;

  for (const station of stations) {
    const email = buildStationEmail(station.codigo, station.nome);
    const name = `Estação ${station.nome}`;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name }],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (existing) {
      skipped += 1;
      console.log(
        `[SKIP] ${station.codigo} (${station.nome}) -> já existe utilizador: ${existing.email || existing.name || existing.id}`
      );
      continue;
    }

    if (APPLY) {
      await prisma.user.create({
        data: {
          email,
          name,
          role: UserRole.USER,
          passwordHash,
        },
      });
    }

    created += 1;
    console.log(`[${APPLY ? "CREATE" : "DRY"}] ${station.codigo} (${station.nome}) -> ${email}`);
  }

  console.log("\nResumo");
  console.table({
    modo: APPLY ? "apply" : "dry-run",
    estacoesAtivas: stations.length,
    criados: created,
    ignorados: skipped,
    passwordDefinida: DEFAULT_PASSWORD,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
