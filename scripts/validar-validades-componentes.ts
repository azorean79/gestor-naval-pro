import { prisma } from '../src/lib/prisma';

async function validarValidadesComponentes() {
  const jangadas = await prisma.jangada.findMany({
    include: {
      inspecaoComponentes: true,
      modelo: true,
    },
  });

  const hoje = new Date();
  const vencidos: any[] = [];
  const proximosVencimento: any[] = [];
  const divergenciasCilindro: any[] = [];


  for (const jangada of jangadas) {
    for (const comp of jangada.inspecaoComponentes) {
      if (comp.validade) {
        const validade = new Date(comp.validade);
        const dias = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        if (dias < 0) {
          vencidos.push({
            jangada: jangada.numeroSerie,
            componente: comp.nome,
            validade: comp.validade,
          });
        } else if (dias <= 30) {
          proximosVencimento.push({
            jangada: jangada.numeroSerie,
            componente: comp.nome,
            validade: comp.validade,
            dias,
          });
        }
      }

      // Validação de cilindro (CO2/N2)
      if (comp.nome.toLowerCase().includes('cilindro')) {
        const modeloNome = jangada.modelo?.nome || '';
        // Buscar especificação do modelo
        // Exemplo: ESPECIFICACOES_TECNICAS[modeloNome]?.cilindroCO2
        // Ajuste conforme estrutura real
        const especificacao = require('../src/lib/jangada-options').ESPECIFICACOES_TECNICAS[modeloNome];
        if (especificacao) {
          divergenciasCilindro.push({
            jangada: jangada.numeroSerie,
            modelo: modeloNome,
            componente: comp.nome,
            esperado: especificacao.cilindroCO2,
            // importado: comp.algumCampoImportado, // Adapte conforme necessário
          });
          divergenciasCilindro.push({
            jangada: jangada.numeroSerie,
            modelo: modeloNome,
            componente: comp.nome,
            esperado: especificacao.cilindroN2,
            // importado: comp.algumCampoImportado, // Adapte conforme necessário
          });
        }
      }
    }
  }
  if (vencidos.length === 0 && proximosVencimento.length === 0 && divergenciasCilindro.length === 0) {
    console.log('Nenhum componente vencido, próximo do vencimento ou divergência de cilindro.');
  } else {
    if (vencidos.length > 0) {
      console.log('Componentes vencidos:');
      for (const item of vencidos) {
        console.log(`Jangada: ${item.jangada} | Componente: ${item.componente} | Validade: ${item.validade}`);
        await prisma.notificacao.create({
          data: {
            titulo: `⛔ Componente vencido: ${item.componente}`,
            mensagem: `Jangada ${item.jangada} possui componente ${item.componente} vencido desde ${item.validade}.`,
            tipo: 'warning',
            dataEnvio: new Date(),
          }
        });
      }
    }
    if (proximosVencimento.length > 0) {
      console.log('Componentes próximos do vencimento (até 30 dias):');
      for (const item of proximosVencimento) {
        console.log(`Jangada: ${item.jangada} | Componente: ${item.componente} | Validade: ${item.validade} | Dias: ${item.dias}`);
        await prisma.notificacao.create({
          data: {
            titulo: `⚠️ Componente próximo do vencimento: ${item.componente}`,
            mensagem: `Jangada ${item.jangada} possui componente ${item.componente} com validade em ${item.validade} (faltam ${item.dias} dias).`,
            tipo: 'info',
            jangada: item.jangada,
            dataEnvio: new Date(),
          }
        });
      }
    }
    if (divergenciasCilindro.length > 0) {
      console.log('Divergências de cilindro (CO2/N2):');
      for (const div of divergenciasCilindro) {
        console.log(`Jangada: ${div.jangada} | Modelo: ${div.modelo} | Componente: ${div.componente} | Esperado: ${div.esperado} | Importado: ${div.importado}`);
        await prisma.notificacao.create({
          data: {
            titulo: `❗ Divergência de cilindro: ${div.componente}`,
            mensagem: `Jangada ${div.jangada} modelo ${div.modelo}: esperado ${div.esperado}, importado ${div.importado}.`,
            tipo: 'warning',
            jangada: div.jangada,
            dataEnvio: new Date(),
          }
        });
      }
    }
  }
}

validarValidadesComponentes().catch(console.error);