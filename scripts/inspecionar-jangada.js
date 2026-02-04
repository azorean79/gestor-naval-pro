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
const prisma = new PrismaClient({ adapter });

async function inspecionarJangada() {
  console.log('🔍 INSPEÇÃO DE JANGADA - ESPIRITO SANTO\n');

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

    // 2. OBTER COMPONENTES DA JANGADA
    console.log('\n2️⃣ Carregando componentes da jangada...');
    const componentes = await prisma.inspecaoComponente.findMany({
      where: { jangadaId: jangada.id }
    });

    console.log(`✅ ${componentes.length} componentes encontrados`);

    // 3. ANÁLISE DE VALIDADES
    console.log('\n3️⃣ Quadro de Inspeção - Análise de Validades\n');
    console.log('═'.repeat(110));
    console.log('COMPONENTE                           | QTDE | ESTADO | VALIDADE      | DIAS P/ EXPIRAR | STATUS      | AÇÃO');
    console.log('═'.repeat(110));

    const agora = new Date();
    const limiteSubstituicao = 12 * 30; // 12 meses em dias
    const itensASubstituir = [];
    let totalItensOK = 0;
    let totalItensAlerta = 0;
    let totalItensExpirados = 0;

    for (const comp of componentes) {
      if (!comp.validade) {
        console.log(
          `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${comp.estado?.padEnd(6) || 'OK    '} | Sem validade  | N/A             | ✅ OK       | -`
        );
        totalItensOK++;
        continue;
      }

      const diasParaExpirar = Math.ceil((comp.validade - agora) / (1000 * 60 * 60 * 24));
      let status = '✅ OK';
      let acao = '-';

      if (diasParaExpirar < 0) {
        status = '❌ EXPIRADO';
        acao = 'SUBSTITUIR';
        itensASubstituir.push(comp);
        totalItensExpirados++;
      } else if (diasParaExpirar < limiteSubstituicao) {
        status = '⚠️  ALERTA';
        acao = 'SUBSTITUIR';
        itensASubstituir.push(comp);
        totalItensAlerta++;
      } else {
        totalItensOK++;
      }

      const dataFormatada = comp.validade.toLocaleDateString('pt-PT');
      console.log(
        `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${comp.estado?.padEnd(6) || 'OK    '} | ${dataFormatada.padEnd(13)} | ${String(diasParaExpirar).padEnd(15)} | ${status.padEnd(11)} | ${acao}`
      );
    }

    console.log('═'.repeat(110));

    // 4. RESUMO DA INSPEÇÃO
    console.log('\n4️⃣ Resumo da Inspeção\n');
    console.log(`   ✅ Itens OK (válidos):           ${totalItensOK}`);
    console.log(`   ⚠️  Itens com Alerta (< 12 mês): ${totalItensAlerta}`);
    console.log(`   ❌ Itens Expirados:              ${totalItensExpirados}`);
    console.log(`   📋 Total para substituir:        ${itensASubstituir.length}`);

    if (itensASubstituir.length === 0) {
      console.log('\n🎉 Inspeção OK - Nenhum item requer substituição!');
      process.exit(0);
    }

    // 5. ITENS PARA SUBSTITUIÇÃO
    console.log('\n5️⃣ Itens que Requerem Substituição\n');
    console.log('─'.repeat(110));
    console.log('COMPONENTE                           | QTDE | MOTIVO');
    console.log('─'.repeat(110));

    for (const comp of itensASubstituir) {
      const diasParaExpirar = Math.ceil((comp.validade - agora) / (1000 * 60 * 60 * 24));
      let motivo = '';

      if (diasParaExpirar < 0) {
        motivo = `Expirado há ${Math.abs(diasParaExpirar)} dias`;
      } else {
        motivo = `Expira em ${diasParaExpirar} dias (< 12 meses)`;
      }

      console.log(
        `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${motivo}`
      );
    }

    // 6. MOVIMENTAÇÃO DE STOCK
    console.log('\n6️⃣ Processando Movimentação de Stock\n');

    for (const comp of itensASubstituir) {
      // Procurar item no stock
      const stockItem = await prisma.stock.findFirst({
        where: {
          nome: { contains: comp.nome.split('(')[0].trim() }
        }
      });

      if (stockItem) {
        if (stockItem.quantidade >= comp.quantidade) {
          // Criar movimentação de saída
          await prisma.movimentacaoStock.create({
            data: {
              stockId: stockItem.id,
              tipo: 'saida',
              quantidade: comp.quantidade,
              motivo: `Substituição - Inspeção Jangada ${jangada.numeroSerie}`,
              responsavel: 'Julio Correia'
            }
          });

          // Atualizar stock
          await prisma.stock.update({
            where: { id: stockItem.id },
            data: { quantidade: stockItem.quantidade - comp.quantidade }
          });

          console.log(`   ✅ ${comp.nome}: ${comp.quantidade} un. retirado do stock`);
        } else {
          console.log(`   ⚠️  ${comp.nome}: Quantidade insuficiente no stock (disponível: ${stockItem.quantidade}, necessário: ${comp.quantidade})`);
        }
      } else {
        console.log(`   ℹ️  ${comp.nome}: Não encontrado no stock`);
      }
    }

    // 7. CRIAR AGENDAMENTO PARA PRÓXIMA INSPEÇÃO
    console.log('\n7️⃣ Criando agendamento para próxima inspeção...');
    const proximaInspecao = new Date(agora);
    proximaInspecao.setFullYear(proximaInspecao.getFullYear() + 1);

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: `Inspeção Anual - ${jangada.numeroSerie}`,
        descricao: `Inspeção anual da jangada ${jangada.numeroSerie} com substituição de ${itensASubstituir.length} itens`,
        dataInicio: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
        dataFim: new Date(agora.getTime() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'alta',
        responsavel: 'Julio Correia',
        jangadaId: jangada.id
      }
    });

    console.log(`   ✅ Agendamento criado para ${proximaInspecao.toLocaleDateString('pt-PT')}`);

    // 8. RESUMO FINAL
    console.log('\n🎉 Inspeção Concluída!\n');
    console.log('📊 Relatório Final:');
    console.log(`   📅 Data inspeção: ${agora.toLocaleDateString('pt-PT')}`);
    console.log(`   🛳️  Jangada: ${jangada.numeroSerie}`);
    console.log(`   👥 Capacidade: ${jangada.capacidade} pessoas`);
    console.log(`   📋 Total componentes: ${componentes.length}`);
    console.log(`   ✅ Componentes OK: ${totalItensOK}`);
    console.log(`   ⚠️  Com Alerta: ${totalItensAlerta}`);
    console.log(`   ❌ Expirados: ${totalItensExpirados}`);
    console.log(`   🔄 Itens substituídos: ${itensASubstituir.length}`);
    console.log(`   📅 Próxima inspeção: ${proximaInspecao.toLocaleDateString('pt-PT')}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
inspecionarJangada()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
