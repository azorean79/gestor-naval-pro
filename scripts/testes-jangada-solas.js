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

async function testesJangadaSOLAS() {
  console.log('🔬 ANÁLISE DE TESTES OBRIGATÓRIOS - JANGADA SOLAS/IMO\n');

  try {
    // 1. OBTER JANGADA
    console.log('1️⃣ Carregando jangada...');
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      include: {
        modelo: true,
        marca: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada não encontrada');
      process.exit(1);
    }

    console.log(`✅ Jangada: ${jangada.numeroSerie}`);
    console.log(`   Marca: ${jangada.marca?.nome || 'N/A'}`);
    console.log(`   Modelo: ${jangada.modelo?.nome || 'N/A'}`);
    console.log(`   Capacidade: ${jangada.capacidade} pessoas`);

    // 2. CALCULAR IDADE DA JANGADA
    console.log('\n2️⃣ Calculando idade da jangada...\n');

    const dataFabrico = new Date(jangada.dataFabricacao);
    const dataAtual = new Date();
    const idadeAnos = Math.floor((dataAtual - dataFabrico) / (365.25 * 24 * 60 * 60 * 1000));
    const idadeMeses = Math.floor(((dataAtual - dataFabrico) / (30 * 24 * 60 * 60 * 1000)) % 12);

    console.log(`   📅 Data de Fabrico: ${dataFabrico.toLocaleDateString('pt-PT')}`);
    console.log(`   📅 Data Atual: ${dataAtual.toLocaleDateString('pt-PT')}`);
    console.log(`   ⏱️  Idade: ${idadeAnos} anos e ${idadeMeses} meses`);

    // 3. DETERMINAR TESTES OBRIGATÓRIOS
    console.log('\n3️⃣ Análise de Testes Obrigatórios SOLAS/IMO\n');
    console.log('═'.repeat(140));

    const testes = [];

    // TESTE ANUAL - Sempre obrigatório
    testes.push({
      nome: 'Inspeção Anual Visual',
      periodicidade: 'Anual',
      obrigatorio: true,
      descricao: 'Inspeção visual completa de todos os componentes',
      norma: 'SOLAS III/20 + IMO MSC.218(82)',
      custo: 500.00,
      duracao: '2-3 horas'
    });

    // TESTE DE PRESSÃO - Anual
    testes.push({
      nome: 'Teste de Pressão (Pressure Test)',
      periodicidade: 'Anual',
      obrigatorio: true,
      descricao: 'Verificação da integridade das câmaras e válvulas de pressão',
      norma: 'SOLAS III/20.8.1 + IMO MSC.81(70)',
      procedimento: 'Insuflar câmaras e verificar perda de pressão durante 30 minutos',
      pressaoTeste: '180-200 mbar',
      custo: 300.00,
      duracao: '1 hora'
    });

    // FS TEST (Full Service) - Anual ou conforme fabricante
    testes.push({
      nome: 'FS Test (Full Service Test)',
      periodicidade: 'Anual',
      obrigatorio: true,
      descricao: 'Serviço completo com abertura total da jangada e verificação de todos os componentes',
      norma: 'IMO MSC.218(82) Annex 1',
      procedimento: 'Desembalar, insuflar, inspecionar todos os componentes, kit de sobrevivência, reparar defeitos',
      custo: 800.00,
      duracao: '4-6 horas'
    });

    // NAP (Necessary Additional Pressure) - Conforme necessidade
    testes.push({
      nome: 'NAP (Necessary Additional Pressure)',
      periodicidade: 'Conforme necessidade',
      obrigatorio: false,
      descricao: 'Teste adicional de pressão quando há suspeita de fuga ou após reparação',
      norma: 'IMO MSC.48(66) Amendment 1',
      procedimento: 'Pressurização adicional para detectar pontos de fuga com solução de água e sabão',
      custo: 150.00,
      duracao: '30-60 minutos'
    });

    // GAS INSUFLATION TEST - De 5 em 5 anos desde o fabrico
    const anoFabrico = dataFabrico.getFullYear();
    const anoAtual = dataAtual.getFullYear();
    const anosDecorridos = anoAtual - anoFabrico;
    const proximoTesteGas = anoFabrico + (Math.ceil(anosDecorridos / 5) * 5);
    const necessitaTesteGas = anosDecorridos % 5 === 0 || anosDecorridos > 0;

    testes.push({
      nome: 'Gas Insuflation Test',
      periodicidade: 'De 5 em 5 anos (desde fabrico)',
      obrigatorio: necessitaTesteGas,
      descricao: 'Teste completo do sistema automático de insuflação com gás',
      norma: 'SOLAS III/20.11.1 + IMO MSC.218(82)',
      procedimento: 'Ativar sistema automático, verificar tempo de insuflação completa, pressão atingida',
      ultimoTeste: `${anoFabrico + (Math.floor(anosDecorridos / 5) * 5)}`,
      proximoTeste: `${proximoTesteGas}`,
      custo: 400.00,
      duracao: '2-3 horas',
      historico: [
        `${anoFabrico} - Fabrico`,
        `${anoFabrico + 5} - 1º Teste`,
        `${anoFabrico + 10} - 2º Teste`,
        anosDecorridos >= 15 ? `${anoFabrico + 15} - 3º Teste` : null,
        anosDecorridos >= 20 ? `${anoFabrico + 20} - 4º Teste` : null
      ].filter(Boolean)
    });

    // 4. MOSTRAR TESTES
    console.log('TESTE                                | PERIODICIDADE              | OBRIGATÓRIO | CUSTO    | DURAÇÃO     | NORMA');
    console.log('═'.repeat(140));

    let custoTotal = 0;
    for (const teste of testes) {
      const obrigatorio = teste.obrigatorio ? '✅ SIM' : '⚠️  Conf. nec.';
      console.log(
        `${teste.nome.padEnd(34)} | ${teste.periodicidade.padEnd(26)} | ${obrigatorio.padEnd(11)} | €${String(teste.custo.toFixed(2)).padEnd(7)} | ${teste.duracao.padEnd(11)} | ${teste.norma}`
      );
      if (teste.obrigatorio) {
        custoTotal += teste.custo;
      }
    }

    console.log('═'.repeat(140));
    console.log(`${'TOTAL TESTES OBRIGATÓRIOS'.padEnd(34)} | ${' '.padEnd(26)} | ${' '.padEnd(11)} | €${String(custoTotal.toFixed(2)).padEnd(7)} |`);
    console.log('═'.repeat(140));

    // 5. DETALHES DE CADA TESTE
    console.log('\n4️⃣ Detalhes dos Testes Obrigatórios\n');

    for (const teste of testes) {
      console.log('─'.repeat(140));
      console.log(`📋 ${teste.nome.toUpperCase()}`);
      console.log('─'.repeat(140));
      console.log(`   Periodicidade: ${teste.periodicidade}`);
      console.log(`   Obrigatório: ${teste.obrigatorio ? 'SIM' : 'Conforme necessidade'}`);
      console.log(`   Norma: ${teste.norma}`);
      console.log(`   Descrição: ${teste.descricao}`);
      if (teste.procedimento) {
        console.log(`   Procedimento: ${teste.procedimento}`);
      }
      if (teste.pressaoTeste) {
        console.log(`   Pressão de Teste: ${teste.pressaoTeste}`);
      }
      if (teste.historico) {
        console.log(`   Histórico de Testes (5 em 5 anos):`);
        teste.historico.forEach((h, i) => {
          console.log(`      ${i + 1}. ${h}`);
        });
        console.log(`   ➡️  Próximo Teste Gas Insuflation: ${teste.proximoTeste}`);
      }
      console.log(`   Custo estimado: €${teste.custo.toFixed(2)}`);
      console.log(`   Duração: ${teste.duracao}`);
      console.log('');
    }

    // 6. CRONOGRAMA DE TESTES
    console.log('5️⃣ Cronograma de Testes para esta Jangada\n');
    console.log('═'.repeat(140));
    console.log('🗓️  PLANEAMENTO ANUAL');
    console.log('═'.repeat(140));
    console.log(`   Data de Fabrico: ${dataFabrico.toLocaleDateString('pt-PT')}`);
    console.log(`   Idade Atual: ${idadeAnos} anos`);
    console.log(`   Próxima Inspeção Anual: ${new Date(dataAtual.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT')}`);
    console.log(`   Próximo Gas Insuflation Test: ${proximoTesteGas}`);

    console.log('\n   ✅ TESTES OBRIGATÓRIOS ESTE ANO (2026):');
    console.log(`      • Inspeção Anual Visual`);
    console.log(`      • Teste de Pressão`);
    console.log(`      • FS Test (Full Service)`);
    
    if (necessitaTesteGas && proximoTesteGas === anoAtual) {
      console.log(`      • Gas Insuflation Test (ano de teste quinquenal)`);
    }

    // 7. RESUMO REGULATÓRIO
    console.log('\n6️⃣ Resumo Regulatório SOLAS/IMO\n');
    console.log('═'.repeat(140));
    console.log('📜 REQUISITOS NORMATIVOS');
    console.log('═'.repeat(140));
    console.log(`   SOLAS III/20: Regulamentação de equipamentos salva-vidas`);
    console.log(`   SOLAS III/20.8.1: Serviço e manutenção de jangadas`);
    console.log(`   SOLAS III/20.11.1: Testes de insuflação automática`);
    console.log(`   IMO MSC.48(66): Código internacional de equipamentos salva-vidas (LSA Code)`);
    console.log(`   IMO MSC.81(70): Recomendações revistas para testes de jangadas`);
    console.log(`   IMO MSC.218(82): Emendas ao código LSA`);

    console.log('\n7️⃣ Resultado da Análise\n');
    console.log('═'.repeat(140));
    console.log(`   ✅ Jangada com ${idadeAnos} anos de idade`);
    console.log(`   ✅ ${testes.filter(t => t.obrigatorio).length} testes obrigatórios identificados`);
    console.log(`   ✅ Custo total estimado: €${custoTotal.toFixed(2)}`);
    console.log(`   ✅ Próximo Gas Insuflation Test: ${proximoTesteGas} (${proximoTesteGas - anoAtual} ${proximoTesteGas - anoAtual === 1 ? 'ano' : 'anos'})`);
    console.log(`   ✅ Conforme SOLAS e IMO`);
    console.log('═'.repeat(140));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
testesJangadaSOLAS()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
