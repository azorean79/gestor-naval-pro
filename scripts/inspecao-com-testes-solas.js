const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });


const { PrismaClient } = require('@prisma/client');


// Inicializar PrismaClient puro para ambiente local
const prisma = new PrismaClient();

// FUNÇÃO PARA CALCULAR TESTES OBRIGATÓRIOS
function calcularTestesObrigatorios(dataFabricacao, dataInspecao = new Date()) {
  const idadeAnos = Math.floor((dataInspecao - dataFabricacao) / (1000 * 60 * 60 * 24 * 365.25));
  const anosFabrico = Math.floor((dataInspecao - dataFabricacao) / (1000 * 60 * 60 * 24 * 365.25));

  const testes = {
    // SERVIÇO DE LIMPEZA (sempre disponível)
    limpezaServico: {
      nome: 'Serviço de Limpeza da Jangada',
      obrigatorio: false,
      frequencia: 'Opcional',
      norma: 'Manutenção preventiva',
      custo: 20.00,
      motivo: 'Serviço opcional de limpeza e manutenção preventiva',
      opcional: true
    },

    // SEMPRE OBRIGATÓRIO (toda inspeção anual)
    visualInspection: {
      nome: 'Inspeção Visual Completa',
      obrigatorio: true,
      frequencia: 'Anual',
      norma: 'SOLAS III/20, IMO MSC.218(82)',
      custo: 30.00,
      motivo: 'Obrigatório em todas as inspeções anuais'
    },

    pressureTest: {
      nome: 'Teste de Pressão (Pressure Test)',
      obrigatorio: true,
      frequencia: 'Anual',
      norma: 'SOLAS III/20.8, IMO MSC.48(66)',
      custo: 30.00,
      motivo: 'Obrigatório - verificação de estanquicidade e integridade estrutural'
    },

    // A PARTIR DO 10º ANO
    fsTest: {
      nome: 'FS Test (Fabric Strength Test)',
      obrigatorio: idadeAnos >= 10,
      frequencia: idadeAnos >= 10 ? 'Anual' : 'Não aplicável',
      norma: 'IMO MSC.81(70) Annex 1',
      custo: 30.00,
      motivo: idadeAnos >= 10
        ? `OBRIGATÓRIO - Jangada com ${idadeAnos} anos (≥10 anos)`
        : `Não obrigatório - Jangada com ${idadeAnos} anos (<10 anos)`,
      idadeMinima: 10
    },

    napTest: {
      nome: 'NAP Test (Necessary Additional Pressure)',
      obrigatorio: idadeAnos >= 10,
      frequencia: idadeAnos >= 10 ? 'Anual' : 'Não aplicável',
      norma: 'IMO MSC.81(70) Annex 2',
      custo: 30.00,
      motivo: idadeAnos >= 10
        ? `OBRIGATÓRIO - Jangada com ${idadeAnos} anos (≥10 anos)`
        : `Não obrigatório - Jangada com ${idadeAnos} anos (<10 anos)`,
      idadeMinima: 10
    },

    // A CADA 5 ANOS DESDE O FABRICO
    gasInsufflationTest: {
      nome: 'Gas Insuflation Test',
      obrigatorio: anosFabrico % 5 === 0 || anosFabrico >= 5,
      frequencia: 'Quinquenal (5 em 5 anos)',
      norma: 'SOLAS III/20.11, IMO MSC.218(82)',
      custo: 30.00,
      motivo: anosFabrico >= 5 && anosFabrico % 5 === 0
        ? `OBRIGATÓRIO - Teste quinquenal (${anosFabrico} anos desde fabrico)`
        : anosFabrico < 5
        ? `Não obrigatório - Próximo teste aos 5 anos (faltam ${5 - anosFabrico} anos)`
        : `Próximo teste aos ${Math.ceil(anosFabrico / 5) * 5} anos`,
      proximoTeste: Math.ceil(anosFabrico / 5) * 5
    }
  };

  return { idadeAnos, anosFabrico, testes };
}

async function inspecaoComTestesSOLAS() {
  console.log('🔍 INSPEÇÃO JANGADA - CÁLCULO AUTOMÁTICO DE TESTES SOLAS/IMO\n');

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
    console.log(`   Fabricação: ${jangada.dataFabricacao.toLocaleDateString('pt-PT')}`);
    console.log(`   Capacidade: ${jangada.capacidade} pessoas`);

    // 2. CALCULAR TESTES NECESSÁRIOS
    console.log('\n2️⃣ Calculando testes obrigatórios baseado na idade...\n');

    const dataInspecao = new Date();
    const { idadeAnos, anosFabrico, testes } = calcularTestesObrigatorios(
      jangada.dataFabricacao,
      dataInspecao
    );

    console.log(`   📅 Data Inspeção: ${dataInspecao.toLocaleDateString('pt-PT')}`);
    console.log(`   🕐 Idade da Jangada: ${idadeAnos} anos`);
    console.log(`   📆 Anos desde Fabrico: ${anosFabrico} anos\n`);

    // 3. QUADRO DE TESTES
    console.log('═'.repeat(140));
    console.log('📋 QUADRO DE TESTES SOLAS/IMO');
    console.log('═'.repeat(140));
    console.log('TESTE                                    | OBRIGATÓRIO | FREQUÊNCIA         | NORMA                      | CUSTO      | STATUS');
    console.log('═'.repeat(140));

    let testesObrigatorios = [];
    let testesOpcionais = [];
    let custoTotal = 0;

    for (const [key, teste] of Object.entries(testes)) {
      const status = teste.obrigatorio ? '✅ SIM' : '❌ NÃO';
      const custoStr = `€${teste.custo.toFixed(2)}`;

      console.log(
        `${teste.nome.padEnd(38)} | ${status.padEnd(11)} | ${teste.frequencia.padEnd(18)} | ${teste.norma.padEnd(26)} | ${custoStr.padEnd(10)} | ${teste.motivo}`
      );

      if (teste.obrigatorio) {
        testesObrigatorios.push(teste);
        custoTotal += teste.custo;
      } else {
        testesOpcionais.push(teste);
      }
    }

    console.log('═'.repeat(140));

    // 4. RESUMO DE TESTES OBRIGATÓRIOS
    console.log('\n3️⃣ Resumo de Testes Obrigatórios\n');
    console.log('─'.repeat(140));
    console.log(`📋 TESTES A REALIZAR NESTA INSPEÇÃO: ${testesObrigatorios.length}`);
    console.log('─'.repeat(140));

    testesObrigatorios.forEach((teste, index) => {
      console.log(`\n   ${index + 1}. ${teste.nome}`);
      console.log(`      • Norma: ${teste.norma}`);
      console.log(`      • Frequência: ${teste.frequencia}`);
      console.log(`      • Custo: €${teste.custo.toFixed(2)}`);
      console.log(`      • Motivo: ${teste.motivo}`);
    });

    console.log('\n─'.repeat(140));
    console.log(`💰 CUSTO TOTAL DOS TESTES: €${custoTotal.toFixed(2)}`);
    console.log('─'.repeat(140));

    // 5. PRÓXIMOS TESTES
    console.log('\n4️⃣ Calendário de Próximos Testes\n');
    console.log('─'.repeat(140));

    if (testesOpcionais.length > 0) {
      console.log('📅 TESTES FUTUROS (não obrigatórios nesta inspeção):\n');

      testesOpcionais.forEach(teste => {
        if (teste.proximoTeste) {
          const anoProximoTeste = jangada.dataFabricacao.getFullYear() + teste.proximoTeste;
          console.log(`   • ${teste.nome}: ${anoProximoTeste} (faltam ${teste.proximoTeste - anosFabrico} anos)`);
        } else if (teste.idadeMinima) {
          const anosRestantes = teste.idadeMinima - idadeAnos;
          const anoObrigatorio = new Date().getFullYear() + anosRestantes;
          console.log(`   • ${teste.nome}: ${anoObrigatorio} (quando completar ${teste.idadeMinima} anos)`);
        }
      });
    }

    // 6. CRIAR SERVIÇOS DE TESTE NO STOCK (se não existirem)
    console.log('\n5️⃣ Criando serviços de teste no stock...\n');

    let servicosCriados = 0;
    for (const teste of testesObrigatorios) {
      const servicoExiste = await prisma.stock.findFirst({
        where: { nome: { contains: teste.nome.split('(')[0].trim() } }
      });

      if (!servicoExiste) {
        const refBase = teste.nome.split(' ')[0].toUpperCase();
        await prisma.stock.create({
          data: {
            nome: teste.nome,
            descricao: `${teste.nome} - Conforme norma ${teste.norma}`,
            categoria: 'servico_teste',
            quantidade: 999999, // Ilimitado para serviços
            quantidadeMinima: 0,
            precoUnitario: teste.custo,
            refOrey: `TST-${refBase}-${Date.now()}`,
            status: 'ativo'
          }
        });
        console.log(`   ✅ Criado: ${teste.nome}`);
        servicosCriados++;
      } else {
        console.log(`   ℹ️  Já existe: ${teste.nome}`);
      }
    }

    if (servicosCriados === 0) {
      console.log(`   ℹ️  Todos os serviços já existem no stock`);
    }

    // 7. RECOMENDAÇÕES
    console.log('\n6️⃣ Recomendações de Implementação\n');
    console.log('═'.repeat(140));
    console.log('✅ MELHORES PRÁTICAS:');
    console.log('═'.repeat(140));
    console.log(`\n   1. CÁLCULO AUTOMÁTICO:`);
    console.log(`      • Calcular testes na abertura da inspeção baseado na data de fabrico`);
    console.log(`      • Mostrar alertas para testes obrigatórios`);
    console.log(`      • Incluir automaticamente custos na fatura`);

    console.log(`\n   2. ALERTAS PREVENTIVOS:`);
    console.log(`      • Notificar 30 dias antes de testes quinquenais (Gas Insuflation)`);
    console.log(`      • Alertar quando jangada completar 9 anos (preparar FS/NAP Test)`);
    console.log(`      • Lembrete anual para jangadas ≥10 anos (FS/NAP obrigatório)`);

    console.log(`\n   3. DOCUMENTAÇÃO:`);
    console.log(`      • Anexar certificados de teste à inspeção`);
    console.log(`      • Registrar resultados (pressão medida, resistência do tecido, etc.)`);
    console.log(`      • Manter histórico completo de testes realizados`);

    console.log(`\n   4. FATURAÇÃO:`);
    console.log(`      • Adicionar testes obrigatórios automaticamente à obra`);
    console.log(`      • Sugerir testes opcionais (preventivos) ao cliente`);
    console.log(`      • Descontos para pacotes de testes múltiplos`);

    // 8. RESUMO FINAL
    console.log('\n' + '═'.repeat(140));
    console.log('🎉 ANÁLISE DE TESTES CONCLUÍDA');
    console.log('═'.repeat(140));
    console.log(`   📅 Jangada: ${jangada.numeroSerie}`);
    console.log(`   🕐 Idade: ${idadeAnos} anos`);
    console.log(`   ✅ Testes obrigatórios: ${testesObrigatorios.length}`);
    console.log(`   💰 Custo total: €${custoTotal.toFixed(2)}`);
    console.log(`   📋 Normas: SOLAS III/20, IMO MSC.218(82), MSC.81(70)`);
    console.log('═'.repeat(140));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
inspecaoComTestesSOLAS()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });