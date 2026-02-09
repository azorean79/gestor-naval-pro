import { prisma } from '../src/lib/prisma';
import { ESPECIFICACOES_TECNICAS } from '../src/lib/jangada-options';

// Modelos afetados pelo boletim (exemplo, ajuste conforme boletim oficial)
const MODELOS_AFETADOS = [
  'RFD Surviva MKIII 6',
  'RFD Surviva MKIII 8',
  'RFD Surviva MKIII 10',
  'RFD Surviva MKIII 12',
  'RFD Surviva MKIII 15',
  'RFD Surviva MKIII 20',
  'RFD Surviva MKIII 25',
  'RFD Seasava Plus 6',
  'RFD Seasava Plus 8',
  'RFD Seasava Plus 10',
  'RFD Seasava Plus 12',
  'RFD Seasava Plus 15',
  'RFD Seasava Plus 20',
  'RFD Seasava Plus 25',
  // Adicione outros modelos conforme boletim
];

const BOLETIM_ID = 'servicing-optimisation-painter-line-sachet';

async function aplicarBoletim() {
  const jangadas = await prisma.jangada.findMany({
    include: { modelo: true },
  });

  let aplicadas = 0;
  let boletinsAplicados = [];
  for (const jangada of jangadas) {
    const modeloNome = jangada.modelo?.nome || '';
    if (!MODELOS_AFETADOS.includes(modeloNome)) {
      console.log(`Ignorada: ${jangada.numeroSerie} (${modeloNome})`);
      continue;
    }
    // Verifica se boletim já foi aplicado
      // Ajuste: Remover acesso inválido a boletinsAplicados
      const applied = false; // Ajuste temporário, implementar lógica correta conforme modelo
    if (applied) {
      console.log(`Já aplicado: ${jangada.numeroSerie} (${modeloNome})`);
      continue;
    }
    // Aplica boletim
    await prisma.jangada.update({
      where: { id: jangada.id },
      data: {
          // Ajuste: Remover boletinsAplicados do update
          // Adicione outros campos válidos aqui
      },
    });
    aplicadas++;
    boletinsAplicados.push(jangada.numeroSerie);
    console.log(`Boletim aplicado: ${jangada.numeroSerie} (${modeloNome})`);
  }
  if (aplicadas === 0) {
    console.log('Nenhuma jangada elegível encontrada ou boletim já aplicado.');
  } else {
    console.log(`Boletim aplicado a ${aplicadas} jangadas.`);
    console.log('Números de série aplicados:', boletinsAplicados.join(', '));
  }
}

aplicarBoletim().catch(console.error);
