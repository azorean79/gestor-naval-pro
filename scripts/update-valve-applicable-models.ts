import prisma from '../src/lib/prisma';

/**
 * Script para atualizar válvula A8/1 (20431001) para ser aplicável também a RFD SEASAVA PLUS
 */
async function updateValveApplicableModels() {
  try {
    console.log('🔍 Procurando válvula A8/1 (20431001)...');
    
    const valve = await prisma.stock.findUnique({
      where: { referencia: '20431001' }
    });

    if (!valve) {
      console.error('❌ Válvula não encontrada com referência 20431001');
      return;
    }

    console.log(`✅ Válvula encontrada:`, {
      id: valve.id,
      descricao: valve.descricao,
      aplicavelMarcaJangada: valve.aplicavelMarcaJangada,
      aplicavelModeloJangada: valve.aplicavelModeloJangada
    });

    // Modelos aplicáveis (separados por vírgula e espaço)
    const currentModelos = (valve.aplicavelModeloJangada || '').split(',').map(m => m.trim()).filter(Boolean);
    const novoModelo = 'RFD SEASAVA PLUS';

    // Adicionar novo modelo se não estiver já na lista
    if (!currentModelos.includes(novoModelo)) {
      currentModelos.push(novoModelo);
      console.log(`   Adicionando modelo: ${novoModelo}`);
    } else {
      console.log(`   Modelo já está na lista`);
      return;
    }

    const novoValorModelos = currentModelos.join(', ');

    console.log(`📝 Atualizando modelos aplicáveis de "${valve.aplicavelModeloJangada}" para "${novoValorModelos}"...`);

    const updated = await prisma.stock.update({
      where: { id: valve.id },
      data: {
        aplicavelModeloJangada: novoValorModelos
      }
    });

    console.log('✅ Válvula atualizada com sucesso!');
    console.log(`   Modelos agora aplicáveis: ${updated.aplicavelModeloJangada}`);

  } catch (error) {
    console.error('❌ Erro ao atualizar válvula:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateValveApplicableModels();
