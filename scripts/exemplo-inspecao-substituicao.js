const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Inicializar Prisma com adapter PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

async function exemploSubstituicaoSinaisFumo() {
  console.log('🔍 EXEMPLO: INSPEÇÃO COM SUBSTITUIÇÃO DE SINAIS DE FUMO\n');

  try {
    // 1. OBTER JANGADA
    console.log('1️⃣ Procurando jangada...');
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada não encontrada');
      process.exit(1);
    }
    console.log(`✅ Jangada encontrada: ${jangada.numeroSerie}`);

    // 2. ATUALIZAR VALIDADE DOS SINAIS DE FUMO PARA SIMULAR NECESSIDADE DE SUBSTITUIÇÃO
    console.log('\n2️⃣ Atualizando validade dos Sinais de Fumo para simular necessidade de substituição...');
    const sinaisFumo = await prisma.inspecaoComponente.findFirst({
      where: {
        jangadaId: jangada.id,
        nome: { contains: 'Sinais de Fumo' }
      }
    });

    if (sinaisFumo) {
      // Alterar validade para 2 meses no futuro (menos de 12 meses)
      const novaValidade = new Date();
      novaValidade.setMonth(novaValidade.getMonth() + 2);

      await prisma.inspecaoComponente.update({
        where: { id: sinaisFumo.id },
        data: { validade: novaValidade }
      });

      console.log(`✅ Validade atualizada para: ${novaValidade.toLocaleDateString('pt-PT')}`);
    }

    // 3. ANÁLISE DE INSPEÇÃO
    console.log('\n3️⃣ Quadro de Inspeção - Análise de Validades\n');
    console.log('═'.repeat(130));
    console.log('COMPONENTE                           | QTDE | VALIDADE      | DIAS RESTANTES | STATUS      | AÇÃO NECESSÁRIA');
    console.log('═'.repeat(130));

    const agora = new Date();
    const limiteSubstituicao = 12 * 30; // 12 meses em dias
    const itensASubstituir = [];

    // Apenas componentes críticos para simplificar
    const componentesCriticos = ['Sinais de Fumo', 'Foguetes com Paraquedas', 'Fachos de Mão', 'Cilindro CO2', 'Pilhas'];

    const componentes = await prisma.inspecaoComponente.findMany({
      where: { jangadaId: jangada.id }
    });

    for (const comp of componentes) {
      // Mostrar apenas componentes críticos
      if (!componentesCriticos.some(c => comp.nome.includes(c))) continue;

      if (!comp.validade) {
        console.log(
          `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | Sem validade  | N/A            | ✅ OK       | -`
        );
        continue;
      }

      const diasParaExpirar = Math.ceil((comp.validade - agora) / (1000 * 60 * 60 * 24));
      let status = '✅ OK';
      let acao = '-';

      if (diasParaExpirar < limiteSubstituicao) {
        status = '⚠️  ALERTA';
        acao = 'SUBSTITUIR';
        itensASubstituir.push({ ...comp, diasParaExpirar });
      }

      const dataFormatada = comp.validade.toLocaleDateString('pt-PT');
      console.log(
        `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${dataFormatada.padEnd(13)} | ${String(diasParaExpirar).padEnd(14)} | ${status.padEnd(11)} | ${acao}`
      );
    }

    console.log('═'.repeat(130));

    // 4. VERIFICAR SE HÁ ITENS PARA SUBSTITUIR
    if (itensASubstituir.length === 0) {
      console.log('\n❌ Nenhum item com alerta de substituição neste exemplo.');
      console.log('💡 Dica: Execute este script novamente para simular a substituição.');
      process.exit(0);
    }

    // 5. ITENS PARA SUBSTITUIÇÃO - FOCAR EM SINAIS DE FUMO
    console.log('\n4️⃣ ⚠️ ITENS QUE REQUEREM SUBSTITUIÇÃO\n');
    console.log('─'.repeat(130));
    console.log('COMPONENTE                           | QTDE A SUBSTITUIR | MOTIVO');
    console.log('─'.repeat(130));

    let quantidadeSubstituida = 0;
    for (const comp of itensASubstituir) {
      const motivo = `Expira em ${comp.diasParaExpirar} dias (limite: 12 meses)`;
      console.log(
        `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(16)} | ${motivo}`
      );
      quantidadeSubstituida += comp.quantidade;
    }
    console.log('─'.repeat(130));

    // 6. CRIAR STOCK PARA SINAIS DE FUMO SE NÃO EXISTIR
    console.log('\n5️⃣ Verificando stock de Sinais de Fumo...');

    let stockSinaisFumo = await prisma.stock.findFirst({
      where: {
        nome: { contains: 'Sinais de Fumo' }
      }
    });

    if (!stockSinaisFumo) {
      console.log('   Criando item de stock: Sinais de Fumo Flutuantes');
      stockSinaisFumo = await prisma.stock.create({
        data: {
          nome: 'Sinais de Fumo Flutuantes',
          descricao: 'Sinais de fumo laranja para durante o dia - Pack SOLAS A',
          categoria: 'pirotecnico',
          quantidade: 10,
          quantidadeMinima: 2,
          precoUnitario: 45.50,
          fornecedor: 'RFD',
          refFabricante: 'RSF-10',
          dataValidade: new Date('2028-12-31'),
          status: 'ativo'
        }
      });
      console.log(`   ✅ Stock criado com 10 unidades`);
    } else {
      console.log(`   ✅ Stock encontrado: ${stockSinaisFumo.quantidade} unidades disponíveis`);
    }

    // 7. PROCESSAMENTO DE SUBSTITUIÇÃO - FOCAR EM SINAIS DE FUMO
    console.log('\n6️⃣ 🔄 PROCESSAMENTO DE SUBSTITUIÇÃO\n');

    const sinaisFumoParaSubstituir = itensASubstituir.find(i => i.nome.includes('Sinais de Fumo'));

    if (sinaisFumoParaSubstituir) {
      console.log(`   📦 Componente: ${sinaisFumoParaSubstituir.nome}`);
      console.log(`   🔢 Quantidade a substituir: ${sinaisFumoParaSubstituir.quantidade} unidades`);
      console.log(`   📅 Validade anterior: ${sinaisFumoParaSubstituir.validade.toLocaleDateString('pt-PT')}`);

      if (stockSinaisFumo.quantidade >= sinaisFumoParaSubstituir.quantidade) {
        // RETIRADA DO STOCK
        console.log('\n   📋 Movimentação de Stock:');
        console.log(`      Tipo: SAÍDA`);
        console.log(`      Motivo: Substituição - Inspeção Jangada ${jangada.numeroSerie}`);
        console.log(`      Responsável: Julio Correia`);

        const movimentacao = await prisma.movimentacaoStock.create({
          data: {
            stockId: stockSinaisFumo.id,
            tipo: 'saida',
            quantidade: sinaisFumoParaSubstituir.quantidade,
            motivo: `Substituição - Inspeção Jangada ${jangada.numeroSerie} - Sinais de Fumo Expirados`,
            responsavel: 'Julio Correia'
          }
        });

        // Atualizar stock
        const novoEstoque = stockSinaisFumo.quantidade - sinaisFumoParaSubstituir.quantidade;
        await prisma.stock.update({
          where: { id: stockSinaisFumo.id },
          data: { quantidade: novoEstoque }
        });

        console.log(`\n   ✅ Retirada do Stock:`);
        console.log(`      - ${sinaisFumoParaSubstituir.quantidade} unidades retiradas`);
        console.log(`      - Stock anterior: ${stockSinaisFumo.quantidade} unidades`);
        console.log(`      - Stock novo: ${novoEstoque} unidades`);
        console.log(`      - Movimentação ID: ${movimentacao.id}`);

        // SUBSTITUIÇÃO NA JANGADA
        console.log(`\n   ✅ Substituição na Jangada:`);

        // Atualizar validade com nova data
        const novaValidadeSinaisFumo = new Date();
        novaValidadeSinaisFumo.setFullYear(novaValidadeSinaisFumo.getFullYear() + 2);

        await prisma.inspecaoComponente.update({
          where: { id: sinaisFumoParaSubstituir.id },
          data: {
            validade: novaValidadeSinaisFumo,
            estado: 'OK'
          }
        });

        console.log(`      - Validade atualizada para: ${novaValidadeSinaisFumo.toLocaleDateString('pt-PT')}`);
        console.log(`      - Status: OK`);
      } else {
        console.log(`\n   ❌ ERRO: Stock insuficiente!`);
        console.log(`      - Disponível: ${stockSinaisFumo.quantidade} unidades`);
        console.log(`      - Necessário: ${sinaisFumoParaSubstituir.quantidade} unidades`);
      }
    }

    // 8. AGENDAMENTO PARA PRÓXIMA INSPEÇÃO
    console.log('\n7️⃣ 📅 Agendamento para Próxima Inspeção\n');

    const dataInicio = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const dataFim = new Date(dataInicio.getTime() + 3 * 60 * 60 * 1000);
    const proximaInspecao = new Date(agora);
    proximaInspecao.setFullYear(proximaInspecao.getFullYear() + 1);

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: `Inspeção Anual - ${jangada.numeroSerie}`,
        descricao: `Inspeção anual com substituição de ${quantidadeSubstituida} itens (Sinais de Fumo)`,
        dataInicio: dataInicio,
        dataFim: dataFim,
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'media',
        responsavel: 'Julio Correia',
        jangadaId: jangada.id
      }
    });

    console.log(`   ✅ Agendamento criado:`);
    console.log(`      - Data: ${dataInicio.toLocaleDateString('pt-PT')}`);
    console.log(`      - Horário: ${dataInicio.toLocaleTimeString('pt-PT').substring(0, 5)} - ${dataFim.toLocaleTimeString('pt-PT').substring(0, 5)}`);
    console.log(`      - ID Agendamento: ${agendamento.id}`);

    // 9. RESUMO FINAL
    console.log('\n' + '═'.repeat(130));
    console.log('🎉 INSPEÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📊 RELATÓRIO FINAL:');
    console.log(`   📅 Data inspeção: ${agora.toLocaleDateString('pt-PT')} ${agora.toLocaleTimeString('pt-PT').substring(0, 5)}`);
    console.log(`   🛳️  Navio/Jangada: ${jangada.numeroSerie}`);
    console.log(`   👥 Capacidade: ${jangada.capacidade} pessoas`);
    console.log(`   \n   📋 SUBSTITUIÇÕES REALIZADAS:`);
    console.log(`      • Sinais de Fumo Flutuantes: 2 unidades retiradas do stock`);
    console.log(`      • Validade nova: ${new Date(agora.getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')}`);
    console.log(`      • Motivo: Substituição por expiração (menos de 12 meses)`);
    console.log(`   \n   📦 STOCK ATUALIZADO:`);
    console.log(`      • Sinais de Fumo: ${stockSinaisFumo.quantidade - sinaisFumoParaSubstituir.quantidade} unidades disponíveis`);
    console.log(`      • Movimentação: Saída registrada com motivo`);
    console.log(`   \n   📅 PRÓXIMA INSPEÇÃO:`);
    console.log(`      • Data: ${proximaInspecao.toLocaleDateString('pt-PT')}`);
    console.log(`   \n   ✅ STATUS: Inspeção Realizada com Sucesso`);
    console.log('═'.repeat(130));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
exemploSubstituicaoSinaisFumo()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
