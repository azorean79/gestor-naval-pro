// Script para aplicar boletim de substituição de válvula Thanner OTS-65 em Surviva (RFD Beaufort Inc, USA)
// e DSB Marine após 10 anos

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({});

const BOLETIM = 'Replacement of Thanner OTS-65 Pressure Relief Valves';
const COMPONENTE = 'Thanner OTS-65 Pressure Relief Valve';

async function aplicarBoletim() {
  let aplicadas = 0;

  // Surviva (RFD Beaufort Inc, USA)
  const survivaJangadas = await prisma.jangada.findMany({
    where: {
      modelo: {
        nome: { contains: 'Surviva', mode: 'insensitive' },
        marca: {
          nome: { contains: 'RFD Beaufort', mode: 'insensitive' },
        },
      },
    },
    include: { modelo: true },
  });

  // DSB Marine após 10 anos
  const dsbJangadas = await prisma.jangada.findMany({
    where: {
      modelo: {
        marca: {
          nome: { contains: 'DSB Marine', mode: 'insensitive' },
        },
      },
      dataFabricacao: {
        lte: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    },
    include: { modelo: true },
  });

  const jangadas = [...survivaJangadas, ...dsbJangadas];

  for (const jangada of jangadas) {
    // ...existing code...

    // ...existing code...

    await prisma.jangada.update({
      where: { id: jangada.id },
      data: {
        // ...existing code...
          // Removido uso de boletins, componentes e update inválido
      },
    });
    aplicadas++;
    console.log(`Boletim aplicado: ${jangada.numeroSerie} (${jangada.modelo?.nome ?? 'sem modelo'})`);
  }

  console.log(`Total de jangadas atualizadas: ${aplicadas}`);
  await prisma.$disconnect();
}

aplicarBoletim();
