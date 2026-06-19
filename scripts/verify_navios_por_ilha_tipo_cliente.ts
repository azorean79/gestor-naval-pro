import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

function normalizeTipoCategoria(tipo?: string): 'Pesca Local' | 'Pesca Costeira' | 'Marítimo Turística' {
  const t = (tipo || '').toLowerCase();
  if (t.includes('marít') || t.includes('marit') || t.includes('tur')) return 'Marítimo Turística';
  if (t.includes('costeir') || t.includes('vara') || t.includes('atum') || t.includes('espada')) return 'Pesca Costeira';
  return 'Pesca Local';
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      ilha: true,
      tipoPesca: true,
      cliente: { select: { id: true, nome: true, ilha: true } },
    },
  });

  const resumo = new Map<string, { total: number; local: number; costeira: number; turistica: number; comCliente: number }>();

  for (const n of navios) {
    const ilha = n.ilha || 'Desconhecida';
    const tipo = normalizeTipoCategoria(n.tipoPesca || undefined);

    const cur = resumo.get(ilha) ?? { total: 0, local: 0, costeira: 0, turistica: 0, comCliente: 0 };
    cur.total += 1;
    if (tipo === 'Pesca Local') cur.local += 1;
    if (tipo === 'Pesca Costeira') cur.costeira += 1;
    if (tipo === 'Marítimo Turística') cur.turistica += 1;
    if (n.cliente?.id) cur.comCliente += 1;

    resumo.set(ilha, cur);
  }

  const ilhas = [...resumo.keys()].sort((a, b) => a.localeCompare(b));
  console.log(`Total navios: ${navios.length}`);
  for (const ilha of ilhas) {
    const r = resumo.get(ilha)!;
    console.log(`- ${ilha}: total=${r.total}, local=${r.local}, costeira=${r.costeira}, turistica=${r.turistica}, comCliente=${r.comCliente}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
