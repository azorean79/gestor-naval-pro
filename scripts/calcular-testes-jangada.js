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

async function calcularTestesJangada() {
  console.log('🧪 CÁLCULO DE TESTES OBRIGATÓRIOS - JANGADA SOLAS/IMO\n');

  try {
    // 1. OBTER JANGADA
    console.log('1️⃣ Carregando jangada...');
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'SV-12P-2024-012' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada não encontrada');
      process.exit(1);
    }

    console.log(`✅ Jangada: ${jangada.numeroSerie}`);
    console.log(`   Modelo: ${jangada.modelo || 'Não especificado'}`);
    console.log(`   Capacidade: ${jangada.capacidade || 'Não especificada'} pessoas`);

    // 2. CALCULAR IDADE DA JANGADA
    const dataFabricacao = jangada.dataFabricacao;
    const agora = new Date();
    const idadeAnos = Math.floor((agora - dataFabricacao) / (1000 * 60 * 60 * 24 * 365.25));
    const idadeMeses = Math.floor((agora - dataFabricacao) / (1000 * 60 * 60 * 24 * 30.44));

    console.log(`   Fabricação: ${dataFabricacao.toLocaleDateString('pt-PT')}`);
    console.log(`   Idade: ${idadeAnos} anos e ${idadeMeses % 12} meses`);

    // 3. DEFINIR TESTES OBRIGATÓRIOS SOLAS/IMO
    console.log('\n2️⃣ Testes Obrigatórios SOLAS/IMO\n');
    console.log('═'.repeat(130));

    const testes = [
      {
        codigo: 'PRESS-TEST',
        nome: 'Teste de Pressão',
        descricao: 'Teste de pressurização das câmaras superior e inferior',
        norma: 'SOLAS III/20 + IMO MSC.81(70)',
        frequenciaAnos: 2,
        custoUnitario: 350.00,
        duracao: '2-3 horas',
        procedimento: 'Insuflação a 3.0 kPa, manter 24h, perda máx 5%'
      },
      {
        codigo: 'FS-TEST',
        nome: 'Factory Seal Test',
        descricao: 'Teste de integridade de vedação em fábrica',
        norma: 'SOLAS III/26 + IMO LSA Code IV',
        frequenciaAnos: 5,
        custoUnitario: 500.00,
        duracao: '4-6 horas',
        procedimento: 'Verificação de vedação, teste submersão, inspeção visual completa'
      },
      {
        codigo: 'NAP-TEST',
        nome: 'NAP - Necessary Additional Pressure',
        descricao: 'Teste de pressão adicional necessária para compensação',
        norma: 'SOLAS III/20.11 + IMO Res.A.689(17)',
        frequenciaAnos: 2,
        custoUnitario: 250.00,
        duracao: '1-2 horas',
        procedimento: 'Medição pressão, cálculo NAP, ajuste sistema Leafield'
      },
      {
        codigo: 'INSP-ANUAL',
        nome: 'Inspeção Anual',
        descricao: 'Inspeção visual e funcional de todos os componentes',
        norma: 'SOLAS III/20.8',
        frequenciaAnos: 1,
        custoUnitario: 500.00,
        duracao: '3-4 horas',
        procedimento: 'Verificação componentes, validades, pirotécnicos, sistema insuflação'
      },
      {
        codigo: 'LEAK-TEST',
        nome: 'Leak Test (Teste de Vazamento)',
        descricao: 'Teste de detecção de vazamentos nas câmaras',
        norma: 'IMO MSC.81(70) Annex 1',
        frequenciaAnos: 3,
        custoUnitario: 300.00,
        duracao: '2-3 horas',
        procedimento: 'Insuflação, imersão parcial, detecção de bolhas'
      }
    ];

    console.log('CÓDIGO      | TESTE                                    | NORMA                      | FREQUÊNCIA | CUSTO     | DURAÇÃO');
    console.log('═'.repeat(130));

    for (const teste of testes) {
      console.log(
        `${teste.codigo.padEnd(11)} | ${teste.nome.padEnd(40)} | ${teste.norma.padEnd(26)} | ${String(teste.frequenciaAnos).padEnd(10)} | €${String(teste.custoUnitario.toFixed(2)).padEnd(8)} | ${teste.duracao}`
      );
    }

    console.log('═'.repeat(130));

    // 4. CALCULAR TESTES NECESSÁRIOS BASEADO NA IDADE
    console.log('\n3️⃣ Testes Necessários (baseado na idade da jangada)\n');
    console.log('═'.repeat(130));

    const testesNecessarios = [];
    let custoTotal = 0;
    let duracaoTotalHoras = 0;

    // Inspeção Anual - SEMPRE
    testesNecessarios.push({ ...testes.find(t => t.codigo === 'INSP-ANUAL'), motivo: 'Obrigatória anualmente' });

    // Teste de Pressão - A cada 2 anos
    if (idadeAnos % 2 === 0 || idadeAnos > 10) {
      testesNecessarios.push({ 
        ...testes.find(t => t.codigo === 'PRESS-TEST'), 
        motivo: idadeAnos > 10 ? 'Jangada > 10 anos (obrigatório)' : 'Ciclo de 2 anos'
      });
    }

    // FS Test - A cada 5 anos ou quando jangada é nova (< 1 ano)
    if (idadeAnos % 5 === 0 || idadeAnos < 1) {
      testesNecessarios.push({ 
        ...testes.find(t => t.codigo === 'FS-TEST'), 
        motivo: idadeAnos < 1 ? 'Jangada nova (teste inicial)' : 'Ciclo de 5 anos'
      });
    }

    // NAP Test - A cada 2 anos (alternado com Teste de Pressão)
    if (idadeAnos % 2 === 0) {
      testesNecessarios.push({ 
        ...testes.find(t => t.codigo === 'NAP-TEST'), 
        motivo: 'Ciclo de 2 anos'
      });
    }

    // Leak Test - A cada 3 anos ou se jangada > 8 anos
    if (idadeAnos % 3 === 0 || idadeAnos > 8) {
      testesNecessarios.push({ 
        ...testes.find(t => t.codigo === 'LEAK-TEST'), 
        motivo: idadeAnos > 8 ? 'Jangada > 8 anos (verificação reforçada)' : 'Ciclo de 3 anos'
      });
    }

    console.log('TESTE                                    | MOTIVO                                | CUSTO     | STATUS');
    console.log('═'.repeat(130));

    for (const teste of testesNecessarios) {
      console.log(
        `${teste.nome.padEnd(40)} | ${teste.motivo.padEnd(37)} | €${String(teste.custoUnitario.toFixed(2)).padEnd(8)} | ✅ OBRIGATÓRIO`
      );
      custoTotal += teste.custoUnitario;
      
      // Extrair horas da duração (ex: "2-3 horas" -> média 2.5)
      const horasMatch = teste.duracao.match(/(\d+)-?(\d+)?/);
      if (horasMatch) {
        const min = parseInt(horasMatch[1]);
        const max = horasMatch[2] ? parseInt(horasMatch[2]) : min;
        duracaoTotalHoras += (min + max) / 2;
      }
    }

    console.log('═'.repeat(130));
    console.log(`${'TOTAL'.padEnd(40)} | ${' '.padEnd(37)} | €${String(custoTotal.toFixed(2)).padEnd(8)} | ${testesNecessarios.length} testes`);
    console.log('═'.repeat(130));

    // 5. DETALHES DOS TESTES
    console.log('\n4️⃣ Detalhes dos Procedimentos\n');

    for (const teste of testesNecessarios) {
      console.log('─'.repeat(130));
      console.log(`📋 ${teste.nome.toUpperCase()} (${teste.codigo})`);
      console.log('─'.repeat(130));
      console.log(`   Descrição: ${teste.descricao}`);
      console.log(`   Norma: ${teste.norma}`);
      console.log(`   Procedimento: ${teste.procedimento}`);
      console.log(`   Duração estimada: ${teste.duracao}`);
      console.log(`   Custo: €${teste.custoUnitario.toFixed(2)}`);
      console.log(`   Motivo: ${teste.motivo}`);
      console.log('');
    }

    // 6. RESUMO EXECUTIVO
    console.log('═'.repeat(130));
    console.log('📊 RESUMO EXECUTIVO DA INSPEÇÃO');
    console.log('═'.repeat(130));
    console.log(`\n   🛳️  JANGADA: ${jangada.numeroSerie}`);
    console.log(`   📅 Fabricação: ${dataFabricacao.toLocaleDateString('pt-PT')}`);
    console.log(`   ⏱️  Idade: ${idadeAnos} anos e ${idadeMeses % 12} meses`);
    console.log(`   👥 Capacidade: ${jangada.capacidade} pessoas`);
    console.log(`\n   🧪 TESTES OBRIGATÓRIOS: ${testesNecessarios.length}`);

    testesNecessarios.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.nome} (${t.codigo})`);
    });

    console.log(`\n   💰 CUSTO TOTAL ESTIMADO: €${custoTotal.toFixed(2)}`);
    console.log(`   ⏰ DURAÇÃO TOTAL ESTIMADA: ${Math.ceil(duracaoTotalHoras)} horas`);
    console.log(`   📅 Data Inspeção: ${agora.toLocaleDateString('pt-PT')}`);
    console.log(`   👨‍🔧 Responsável: Julio Correia`);

    // 7. REGRAS DE IDADE
    console.log('\n5️⃣ Regras de Testes por Idade da Jangada\n');
    console.log('═'.repeat(130));
    console.log('IDADE                | TESTES OBRIGATÓRIOS');
    console.log('═'.repeat(130));
    console.log('0-1 anos            | Inspeção Anual + FS Test (teste inicial)');
    console.log('2 anos              | Inspeção Anual + Teste Pressão + NAP Test');
    console.log('3 anos              | Inspeção Anual + Leak Test');
    console.log('4 anos              | Inspeção Anual + Teste Pressão + NAP Test');
    console.log('5 anos              | Inspeção Anual + FS Test + Leak Test');
    console.log('6 anos              | Inspeção Anual + Teste Pressão + NAP Test + Leak Test');
    console.log('8+ anos             | Inspeção Anual + Leak Test (verificação reforçada)');
    console.log('10+ anos            | Inspeção Anual + Teste Pressão (obrigatório) + NAP + Leak Test');
    console.log('═'.repeat(130));

    console.log('\n💡 NOTA: Jangadas com mais de 10 anos requerem testes mais frequentes e rigorosos.');
    console.log('📋 Conforme SOLAS III/20 e IMO MSC.81(70)');

    console.log('\n✅ Cálculo de Testes Concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
calcularTestesJangada()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
