import { prisma } from '../src/lib/prisma';
import { ESPECIFICACOES_TECNICAS } from '../src/lib/jangada-options';

async function validarComponentesJangada() {
  const jangadas = await prisma.jangada.findMany({
    include: {
      modelo: true,
      inspecaoComponentes: true,
    },
  });

  const divergencias: any[] = [];

  for (const jangada of jangadas) {
    const modeloNome = jangada.modelo?.nome || '';
    const especificacao = ESPECIFICACOES_TECNICAS[modeloNome];
    if (!especificacao) continue;

    // Mapear componentes importados
    const componentesImportados = jangada.inspecaoComponentes.reduce((acc, comp) => {
      acc[comp.nome] = comp.quantidade;
      return acc;
    }, {} as Record<string, number>);

    // Mapear componentes esperados
    // Exemplo: especificacao pode ter um campo 'componentes' com nome e quantidade
    // Removido uso de propriedade inexistente 'componentes'
    for (const esperado of Object.keys(componentesImportados)) {
      const quantidadeImportada = componentesImportados[esperado] || 0;
      // Não há propriedade quantidade, apenas comparar se existe
      if (!quantidadeImportada) {
        divergencias.push({
          jangada: jangada.numeroSerie,
          modelo: modeloNome,
          componente: esperado,
          esperado: quantidadeImportada,
          importado: quantidadeImportada,
        });
      }
    }
  }

  if (divergencias.length === 0) {
    console.log('Todas as quantidades estão de acordo com as especificações.');
  } else {
    console.log('Divergências encontradas:');
    for (const div of divergencias) {
      console.log(`Jangada: ${div.jangada} | Modelo: ${div.modelo} | Componente: ${div.componente} | Esperado: ${div.esperado} | Importado: ${div.importado}`);
      await prisma.notificacao.create({
        data: {
          titulo: `❗ Divergência de componente: ${div.componente}`,
          mensagem: `Jangada ${div.jangada} modelo ${div.modelo}: esperado ${div.esperado}, importado ${div.importado}.`,
          tipo: 'warning',
          // Removido uso de propriedade inexistente 'jangadaNumeroSerie'
          dataEnvio: new Date(),
        }
      });
    }
  }
}

validarComponentesJangada().catch(console.error);