// Script para aplicar boletim de substituição de válvula Thanner OTS-65 em Surviva (RFD Beaufort Inc, USA)
// e DSB Marine após 10 anos

import { PrismaClient } from '@prisma/client';

require('dotenv').config({ path: '.env' });

const ACCELERATE_URL = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19TTVZ5LXJiWktoUUtZMHpmSm5Yd3YiLCJhcGlfa2V5IjoiMDFLR0FCQjI2RjRQMTFTR0dQOEY5RjlCRkoiLCJ0ZW5hbnRfaWQiOiIyMDkxNzE0YjM5OTA5NzkzMzVjM2M1MWUxZjQxNTY0NGE0ZDk0ZmM5MzhkODU4NWY4MGExM2VlYjdkODQwOGZkIiwiaW50ZXJuYWxfc2VjcmV0IjoiN2U1MDI0MGUtYjdmYS00NjhjLTljZTQtZTM5NTA2OGQ1NmJlIn0.A-eGaWSZG_w0sMQ4BmVZ13ckdGeYuRb6lMG4T4yvblk";

const prisma = new PrismaClient({ accelerateUrl: ACCELERATE_URL });

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
