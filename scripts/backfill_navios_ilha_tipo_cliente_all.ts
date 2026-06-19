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

function normalizeNome(nome: string): string {
  return (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function inferIlha(nome: string): string {
  const n = normalizeNome(nome);
  if (n.includes('HORTA')) return 'Faial';
  if (n.includes('SAO MIGUEL') || n.includes('SÃO MIGUEL')) return 'São Miguel';
  if (n.includes('MAIA')) return 'São Miguel';
  if (n.includes('AMARELA') || n.includes('PIA')) return 'Pico';
  if (n.includes('CORVO')) return 'Corvo';
  if (n.includes('FLORES')) return 'Flores';
  if (n.includes('TERCEIRA')) return 'Terceira';
  if (n.includes('GRACIOSA')) return 'Graciosa';
  if (n.includes('SANTA MARIA')) return 'Santa Maria';
  if (n.includes('SAO JORGE') || n.includes('SÃO JORGE')) return 'São Jorge';
  if (n.includes('FAIAL')) return 'Faial';
  return 'Desconhecida';
}

function inferTipoPesca(nome: string): string {
  const n = normalizeNome(nome);
  if (
    n.includes('EXPRESSO') ||
    n.includes('TUR') ||
    n.includes('BALEIA') ||
    n.includes('WHALE') ||
    n.includes('CETUS') ||
    n.includes('CHALLENGE') ||
    n.includes('RELAX')
  ) {
    return 'Marítimo Turística';
  }
  if (
    n.includes('VARA') ||
    n.includes('ATUM') ||
    n.includes('ESPADA') ||
    n.includes('ATLANTICO') ||
    n.includes('OCEANO') ||
    n.includes('ARQUIPELAGO')
  ) {
    return 'Pesca Costeira';
  }
  return 'Pesca Local';
}

async function main() {
  const navios = await prisma.navio.findMany({ select: { id: true, nome: true, ilha: true, tipoPesca: true, clienteId: true } });

  const clientesPorIlha = await prisma.cliente.findMany({
    where: { ilha: { not: null } },
    select: { id: true, ilha: true },
  });

  const clienteIlhaToId = new Map<string, number>();
  for (const c of clientesPorIlha) {
    const ilhaNorm = normalizeNome(c.ilha || '');
    if (!ilhaNorm) continue;
    if (!clienteIlhaToId.has(ilhaNorm)) clienteIlhaToId.set(ilhaNorm, c.id);
  }

  let updated = 0;
  let clientesCriados = 0;
  let clientesAssociados = 0;

  for (const n of navios) {
    const ilhaInferida = inferIlha(n.nome);
    const tipoInferido = inferTipoPesca(n.nome);

    const needsIlha = !n.ilha || n.ilha === 'N/D' || n.ilha === 'Desconhecida';
    const needsTipo = !n.tipoPesca || !['Pesca Local', 'Pesca Costeira', 'Marítimo Turística'].includes(n.tipoPesca);
    const needsCliente = !n.clienteId;

    const data: { ilha?: string; tipoPesca?: string; clienteId?: number } = {};

    if (needsIlha && ilhaInferida !== 'Desconhecida') data.ilha = ilhaInferida;
    if (needsTipo) data.tipoPesca = tipoInferido;

    if (needsCliente) {
      const ilhaForClient = data.ilha || n.ilha || ilhaInferida;
      const ilhaNorm = normalizeNome(ilhaForClient);
      if (ilhaNorm && ilhaNorm !== normalizeNome('Desconhecida') && ilhaNorm !== normalizeNome('N/D')) {
        let clienteId = clienteIlhaToId.get(ilhaNorm);
        if (!clienteId) {
          const novo = await prisma.cliente.create({
            data: { nome: `Cliente ${ilhaForClient}`, ilha: ilhaForClient, morada: `Ilha ${ilhaForClient}` },
            select: { id: true },
          });
          clienteId = novo.id;
          clienteIlhaToId.set(ilhaNorm, clienteId);
          clientesCriados += 1;
        }
        data.clienteId = clienteId;
        clientesAssociados += 1;
      }
    }

    if (Object.keys(data).length > 0) {
      await prisma.navio.update({ where: { id: n.id }, data });
      updated += 1;
    }
  }

  console.log(`Navios atualizados: ${updated}`);
  console.log(`Clientes por ilha criados: ${clientesCriados}`);
  console.log(`Associações navio->cliente aplicadas: ${clientesAssociados}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
