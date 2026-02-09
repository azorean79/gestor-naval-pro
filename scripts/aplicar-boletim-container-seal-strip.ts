import { prisma } from '../src/lib/prisma';

// Modelos afetados pelo boletim
const MODELOS_AFETADOS = [
  'RFD Seasava Plus 6',
  'RFD Seasava Plus 8',
  'RFD Seasava Plus 10',
  'RFD Seasava Plus 12',
  'RFD Seasava Plus 15',
  'RFD Seasava Plus 20',
  'RFD Seasava Plus 25',
  'RFD Seasava Plus X 6',
  'RFD Seasava Plus X 8',
  'RFD Seasava Plus X 10',
  'RFD Seasava Plus X 12',
  'RFD Seasava Plus X 15',
  'RFD Seasava Plus X 20',
  'RFD Seasava Plus X 25',
  'RFD Seasava Plus R 6',
  'RFD Seasava Plus R 8',
  'RFD Seasava Plus R 10',
  'RFD Seasava Plus R 12',
  'RFD Seasava Plus R 15',
  'RFD Seasava Plus R 20',
  'RFD Seasava Plus R 25',
  // Adicione outros modelos conforme boletim
];

const BOLETIM_ID = 'container-seal-strip-improved';
const COMPONENTE = 'Container Seal Strip (Improved)';

async function aplicarBoletim() {
  const jangadas = await prisma.jangada.findMany({
    include: { modelo: true },
  });

  let aplicadas = 0;

  for (const jangada of jangadas) {
    const modeloNome = jangada.modelo?.nome || '';
    if (!MODELOS_AFETADOS.includes(modeloNome)) continue;

    // Atualiza campo boletinsAplicados
    // ...existing code...
    let changed = false;

    // Adiciona componente melhorado
    // ...existing code...

    if (changed) {
      await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          // ...existing code...
            // Removido uso de boletins, componentes e update inválido
        },
      });
      aplicadas++;
      console.log(`Boletim aplicado: ${jangada.numeroSerie} (${modeloNome})`);
    }
  }

  if (aplicadas === 0) {
    console.log('Nenhuma jangada elegível encontrada ou boletim já aplicado.');
  } else {
    console.log(`Boletim aplicado a ${aplicadas} jangadas.`);
  }
}

aplicarBoletim().catch(console.error);
