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

// FUNÇÃO PARA CALCULAR TESTES SOLAS
function calcularTestesSOLAS(dataFabricacao, dataInspecao = new Date()) {
  const idadeAnos = Math.floor((dataInspecao - dataFabricacao) / (1000 * 60 * 60 * 24 * 365.25));
  
  const testes = [];
  
  // Sempre obrigatórios
  testes.push({
    nome: 'Inspeção Visual Completa',
    custo: 150.00,
    norma: 'SOLAS III/20, IMO MSC.218(82)'
  });
  
  testes.push({
    nome: 'Teste de Pressão (Pressure Test)',
    custo: 200.00,
    norma: 'SOLAS III/20.8, IMO MSC.48(66)'
  });
  
  // A partir do 10º ano
  if (idadeAnos >= 10) {
    testes.push({
      nome: 'FS Test (Fabric Strength Test)',
      custo: 350.00,
      norma: 'IMO MSC.81(70) Annex 1'
    });
    
    testes.push({
      nome: 'NAP Test (Necessary Additional Pressure)',
      custo: 300.00,
      norma: 'IMO MSC.81(70) Annex 2'
    });
  }
  
  // Quinquenal (5, 10, 15, 20 anos)
  if (idadeAnos >= 5 && idadeAnos % 5 === 0) {
    testes.push({
      nome: 'Gas Insuflation Test',
      custo: 450.00,
      norma: 'SOLAS III/20.11, IMO MSC.218(82)'
    });
  }
  
  return testes;
}

async function inspecaoAcidenteTotal() {
  console.log('🚨 INSPEÇÃO DE EMERGÊNCIA - ACIDENTE TOTAL\n');
  console.log('Cenário: Jangada caiu do navio durante mau tempo');
  console.log('Necessário: Substituição completa de todos os componentes + contentor novo\n');
  console.log('═'.repeat(120));

  try {
    // 1. OBTER JANGADA E COMPONENTES
    console.log('\n1️⃣ Carregando jangada e componentes atuais...\n');
    
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      include: {
        navio: {
          include: {
            cliente: true
          }
        },
        marca: true,
        modelo: true,
        lotacao: true,
        tipoPackRef: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada não encontrada');
      process.exit(1);
    }

    const componentesAtuais = await prisma.inspecaoComponente.findMany({
      where: { jangadaId: jangada.id },
      orderBy: { id: 'asc' }
    });

    console.log(`✅ Jangada: ${jangada.numeroSerie}`);
    console.log(`   Navio: ${jangada.navio.nome}`);
    console.log(`   Cliente: ${jangada.navio.cliente.nome}`);
    console.log(`   Capacidade: ${jangada.capacidade} pessoas`);
    console.log(`   Fabricação: ${jangada.dataFabricacao.toLocaleDateString('pt-PT')}`);
    console.log(`   Componentes Instalados: ${componentesAtuais.length}`);

    // 2. CRIAR INSPEÇÃO DE EMERGÊNCIA
    console.log('\n2️⃣ Criando inspeção de emergência...\n');
    
    const dataInspecao = new Date();
    const tipoInspecao = 'Inspeção de Emergência - Acidente';
    
    console.log(`   📅 Data: ${dataInspecao.toLocaleDateString('pt-PT')}`);
    console.log(`   🚨 Tipo: ${tipoInspecao}`);
    console.log(`   ⚠️  Motivo: Queda do navio durante mau tempo - Danos graves em todos os componentes`);

    // 3. QUADRO DE COMPONENTES A SUBSTITUIR
    console.log('\n3️⃣ Análise de componentes danificados...\n');
    console.log('─'.repeat(120));
    console.log('COMPONENTE                               | QUANTIDADE | STATUS ATUAL       | AÇÃO');
    console.log('─'.repeat(120));

    let componentesParaSubstituir = [];
    let totalItensSubstituir = 0;

    for (const comp of componentesAtuais) {
      const status = '❌ DANIFICADO';
      const acao = 'SUBSTITUIR';
      
      console.log(
        `${comp.nome.padEnd(40)} | ${comp.quantidade.toString().padEnd(10)} | ${status.padEnd(18)} | ${acao}`
      );
      
      componentesParaSubstituir.push({
        ...comp,
        motivo: 'Danificado no acidente - Substituição obrigatória'
      });
      
      totalItensSubstituir += comp.quantidade;
    }

    console.log('─'.repeat(120));
    console.log(`\n   📦 Total de Componentes: ${componentesParaSubstituir.length}`);
    console.log(`   🔢 Total de Unidades: ${totalItensSubstituir}`);
    console.log(`   ➕ Contentor Novo: 1 unidade\n`);

    // 4. VERIFICAR/CRIAR STOCK
    console.log('4️⃣ Verificando disponibilidade no stock...\n');
    
    let stockInsuficiente = [];
    let stockMovimentos = [];
    let custoComponentes = 0;

    for (const comp of componentesParaSubstituir) {
      let stockItem = await prisma.stock.findFirst({
        where: {
          OR: [
            { nome: { contains: comp.nome } },
            { nome: { equals: comp.nome } }
          ]
        }
      });

      // Se não existe, criar com quantidade suficiente
      if (!stockItem) {
        const precoEstimado = comp.nome.includes('Cilindro') ? 450.00 :
                             comp.nome.includes('Válvula') ? 85.00 :
                             comp.nome.includes('Tubo Alta') ? 120.00 :
                             comp.nome.includes('Adaptador') ? 45.00 :
                             comp.nome.includes('Ração') ? 8.50 :
                             comp.nome.includes('Água') ? 3.20 :
                             comp.nome.includes('Comprimido') ? 25.00 :
                             comp.nome.includes('Sinal') ? 18.00 :
                             comp.nome.includes('Foguete') ? 35.00 :
                             comp.nome.includes('Luz') ? 65.00 :
                             comp.nome.includes('Bateria') ? 42.00 :
                             comp.nome.includes('Lanterna') ? 28.00 :
                             comp.nome.includes('Espelho') ? 15.00 :
                             comp.nome.includes('Faca') ? 22.00 :
                             comp.nome.includes('Bomba') ? 95.00 :
                             12.50;

        stockItem = await prisma.stock.create({
          data: {
            nome: comp.nome,
            descricao: `${comp.nome} - SOLAS Pack A`,
            categoria: comp.nome.includes('Cilindro') ? 'cilindro' :
                      comp.nome.includes('Válvula') ? 'valvula' :
                      comp.nome.includes('Tubo') ? 'tubo' :
                      comp.nome.includes('Ração') || comp.nome.includes('Água') || comp.nome.includes('Comprimido') ? 'provisao' :
                      comp.nome.includes('Sinal') || comp.nome.includes('Foguete') ? 'pirotecnico' :
                      'componente',
            quantidade: Math.max(comp.quantidade * 3, 50),
            quantidadeMinima: comp.quantidade,
            precoUnitario: precoEstimado,
            refOrey: `REF-${comp.nome.substring(0, 10).toUpperCase().replace(/\s/g, '')}-${Date.now()}`,
            status: 'ativo'
          }
        });
        
        console.log(`   ✅ Criado stock: ${comp.nome} (${stockItem.quantidade} unidades)`);
      }

      // Verificar se há quantidade suficiente
      if (stockItem.quantidade < comp.quantidade) {
        stockInsuficiente.push({
          nome: comp.nome,
          necessario: comp.quantidade,
          disponivel: stockItem.quantidade,
          falta: comp.quantidade - stockItem.quantidade
        });
        console.log(`   ⚠️  ${comp.nome}: Faltam ${comp.quantidade - stockItem.quantidade} unidades`);
      } else {
        console.log(`   ✅ ${comp.nome}: ${stockItem.quantidade} disponíveis (necessário: ${comp.quantidade})`);
      }

      custoComponentes += stockItem.precoUnitario * comp.quantidade;
      
      stockMovimentos.push({
        stockItem,
        componente: comp,
        quantidade: comp.quantidade,
        precoUnitario: stockItem.precoUnitario,
        custoTotal: stockItem.precoUnitario * comp.quantidade
      });
    }

    // CONTENTOR NOVO
    let stockContentor = await prisma.stock.findFirst({
      where: { nome: { contains: 'Contentor' } }
    });

    if (!stockContentor) {
      stockContentor = await prisma.stock.create({
        data: {
          nome: 'Contentor Jangada SOLAS',
          descricao: 'Contentor novo para jangada salva-vidas - Fibra de vidro',
          categoria: 'contentor',
          quantidade: 10,
          quantidadeMinima: 2,
          precoUnitario: 850.00,
          refOrey: `CONT-NEW-${Date.now()}`,
          status: 'ativo'
        }
      });
      console.log(`\n   ✅ Criado stock: Contentor (${stockContentor.quantidade} unidades)`);
    }

    custoComponentes += stockContentor.precoUnitario;
    
    stockMovimentos.push({
      stockItem: stockContentor,
      componente: { nome: 'Contentor Novo', quantidade: 1 },
      quantidade: 1,
      precoUnitario: stockContentor.precoUnitario,
      custoTotal: stockContentor.precoUnitario
    });

    console.log(`\n   💰 Custo Total dos Componentes: €${custoComponentes.toFixed(2)}`);

    if (stockInsuficiente.length > 0) {
      console.log('\n   ⚠️  ATENÇÃO: Alguns itens precisam ser encomendados!');
      console.log('   Procedendo com os itens disponíveis...');
    }

    // 5. CALCULAR TESTES SOLAS
    console.log('\n5️⃣ Calculando testes SOLAS obrigatórios...\n');
    
    const testesSOLAS = calcularTestesSOLAS(jangada.dataFabricacao);
    let custoTestes = 0;

    console.log('   TESTES OBRIGATÓRIOS:');
    testesSOLAS.forEach(teste => {
      console.log(`   • ${teste.nome.padEnd(45)} €${teste.custo.toFixed(2).padStart(8)} - ${teste.norma}`);
      custoTestes += teste.custo;
    });
    
    console.log(`\n   💰 Custo Total dos Testes: €${custoTestes.toFixed(2)}`);

    // 6. SERVIÇOS ADICIONAIS
    console.log('\n6️⃣ Serviços adicionais...\n');
    
    const servicosAdicionais = [
      { nome: 'Limpeza Completa', custo: 120.00, horas: 0 },
      { nome: 'Reparação Cilindro (recarga)', custo: 180.00, horas: 0 },
      { nome: 'Pintura Contentor Novo', custo: 150.00, horas: 0 },
      { nome: 'Marcação e Etiquetagem', custo: 85.00, horas: 0 },
      { nome: 'Embalagem e Acondicionamento', custo: 95.00, horas: 0 },
      { nome: 'Mão de Obra Técnica', custo: 75.00, horas: 12 }
    ];

    let custoServicos = 0;
    servicosAdicionais.forEach(servico => {
      const custoTotal = servico.horas > 0 ? servico.custo * servico.horas : servico.custo;
      const detalhes = servico.horas > 0 ? `(${servico.horas}h × €${servico.custo}/h)` : '';
      console.log(`   • ${servico.nome.padEnd(40)} €${custoTotal.toFixed(2).padStart(8)} ${detalhes}`);
      custoServicos += custoTotal;
    });

    console.log(`\n   💰 Custo Total dos Serviços: €${custoServicos.toFixed(2)}`);

    // 7. CRIAR MOVIMENTAÇÕES DE STOCK
    console.log('\n7️⃣ Retirando componentes do stock...\n');

    let movimentacoesCriadas = [];
    
    for (const movimento of stockMovimentos) {
      // Atualizar quantidade no stock
      await prisma.stock.update({
        where: { id: movimento.stockItem.id },
        data: {
          quantidade: movimento.stockItem.quantidade - movimento.quantidade
        }
      });

      // Criar movimentação
      const movimentacao = await prisma.movimentacaoStock.create({
        data: {
          stockId: movimento.stockItem.id,
          tipo: 'saida',
          quantidade: movimento.quantidade,
          motivo: `Substituição Total - Acidente Jangada ${jangada.numeroSerie}`,
          data: new Date()
        }
      });

      movimentacoesCriadas.push(movimentacao);

      console.log(
        `   ✅ ${movimento.componente.nome.padEnd(45)} ${movimento.quantidade}× €${movimento.precoUnitario.toFixed(2)} = €${movimento.custoTotal.toFixed(2)}`
      );
      console.log(
        `      Stock: ${movimento.stockItem.quantidade} → ${movimento.stockItem.quantidade - movimento.quantidade} unidades`
      );
    }

    console.log(`\n   📦 Total de Movimentações: ${movimentacoesCriadas.length}`);

    // 8. ATUALIZAR COMPONENTES DA JANGADA
    console.log('\n8️⃣ Atualizando componentes da jangada com novas validades...\n');

    const novaValidade = new Date();
    novaValidade.setFullYear(novaValidade.getFullYear() + 2); // +2 anos para componentes novos
    const novaValidadePirotecnicos = new Date();
    novaValidadePirotecnicos.setFullYear(novaValidadePirotecnicos.getFullYear() + 3); // +3 anos para pirotécnicos

    let componentesAtualizados = 0;
    for (const comp of componentesParaSubstituir) {
      const validadeAUsar = comp.nome.includes('Sinal') || comp.nome.includes('Foguete') 
        ? novaValidadePirotecnicos 
        : novaValidade;

      await prisma.inspecaoComponente.update({
        where: { id: comp.id },
        data: {
          validade: validadeAUsar,
          notas: `Substituído em ${dataInspecao.toLocaleDateString('pt-PT')} - Acidente total. NOVO.`,
          estado: 'novo'
        }
      });
      
      componentesAtualizados++;
    }

    console.log(`   ✅ ${componentesAtualizados} componentes atualizados com novas validades`);
    console.log(`   📅 Nova validade (componentes): ${novaValidade.toLocaleDateString('pt-PT')}`);
    console.log(`   📅 Nova validade (pirotécnicos): ${novaValidadePirotecnicos.toLocaleDateString('pt-PT')}`);

    // 9. CRIAR OBRA
    console.log('\n9️⃣ Criando obra e fatura...\n');

    const custoTotal = custoComponentes + custoTestes + custoServicos;

    const obra = await prisma.obra.create({
      data: {
        titulo: `Reparação Total - Acidente Jangada ${jangada.numeroSerie}`,
        clienteId: jangada.navio.clienteId,
        status: 'em_curso',
        dataInicio: dataInspecao,
        descricao: `Reparação Total - Acidente: Jangada ${jangada.numeroSerie} caiu do navio ${jangada.navio.nome}. Substituição completa de todos os componentes + contentor novo.\n\nINSPEÇÃO DE EMERGÊNCIA\nMotivo: Queda do navio durante mau tempo\nDanos: Totais - todos os componentes danificados\nAção: Substituição completa + testes SOLAS\n\nComponentes substituídos: ${componentesAtualizados}\nMovimentações stock: ${movimentacoesCriadas.length}\nTestes realizados: ${testesSOLAS.length}\n\nCusto Componentes: €${custoComponentes.toFixed(2)}\nCusto Testes: €${custoTestes.toFixed(2)}\nCusto Serviços: €${custoServicos.toFixed(2)}\nCusto Total: €${custoTotal.toFixed(2)}`
      }
    });

    console.log(`   ✅ Obra criada: ${obra.id}`);
    console.log(`   📋 Status: ${obra.status}`);
    console.log(`   💰 Valor Total (estimado): €${custoTotal.toFixed(2)}`);

    // Criar Fatura
    const fatura = await prisma.fatura.create({
      data: {
        numero: `FAT-${Date.now()}`,
        dataEmissao: dataInspecao,
        dataVencimento: new Date(dataInspecao.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 dias
        valor: custoTotal,
        status: 'pendente',
        descricao: `Fatura de reparação total - Acidente jangada ${jangada.numeroSerie}. Componentes: €${custoComponentes.toFixed(2)} | Testes: €${custoTestes.toFixed(2)} | Serviços: €${custoServicos.toFixed(2)}`,
        clienteId: jangada.navio.clienteId,
        navioId: jangada.navio.id,
        jangadaId: jangada.id
      }
    });

    console.log(`   ✅ Fatura criada: ${fatura.id}`);
    console.log(`   📅 Emissão: ${fatura.dataEmissao.toLocaleDateString('pt-PT')}`);
    console.log(`   📅 Vencimento: ${fatura.dataVencimento.toLocaleDateString('pt-PT')}`);
    console.log(`   💳 Status: ${fatura.status}`);

    // 10. CRIAR AGENDAMENTO PARA PRÓXIMA INSPEÇÃO
    console.log('\n🔟 Agendando próxima inspeção...\n');

    const proximaInspecao = new Date(dataInspecao);
    proximaInspecao.setFullYear(proximaInspecao.getFullYear() + 1); // +1 ano

    const agendamento = await prisma.agendamento.create({
      data: {
        jangadaId: jangada.id,
        navioId: jangada.navio.id,
        titulo: `Inspeção Anual - ${jangada.numeroSerie}`,
        descricao: 'Inspeção anual regular após reparação completa por acidente',
        dataInicio: proximaInspecao,
        dataFim: new Date(proximaInspecao.getTime() + 2 * 60 * 60 * 1000),
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'normal'
      }
    });

    console.log(`   ✅ Próxima inspeção agendada para: ${proximaInspecao.toLocaleDateString('pt-PT')}`);

    // RESUMO FINAL
    console.log('\n' + '═'.repeat(120));
    console.log('✅ INSPEÇÃO DE EMERGÊNCIA CONCLUÍDA');
    console.log('═'.repeat(120));
    console.log(`\n📋 RESUMO DA REPARAÇÃO:\n`);
    console.log(`   Jangada:              ${jangada.numeroSerie}`);
    console.log(`   Navio:                ${jangada.navio.nome}`);
    console.log(`   Cliente:              ${jangada.navio.cliente.nome}`);
    console.log(`   Tipo:                 ${tipoInspecao}`);
    console.log(`   Data:                 ${dataInspecao.toLocaleDateString('pt-PT')}\n`);
    
    console.log(`📦 SUBSTITUIÇÕES:\n`);
    console.log(`   Componentes:          ${componentesAtualizados} itens`);
    console.log(`   Total Unidades:       ${totalItensSubstituir + 1} (+ 1 contentor)`);
    console.log(`   Movimentações Stock:  ${movimentacoesCriadas.length}`);
    console.log(`   Custo Componentes:    €${custoComponentes.toFixed(2)}\n`);
    
    console.log(`🔬 TESTES SOLAS/IMO:\n`);
    console.log(`   Testes Realizados:    ${testesSOLAS.length}`);
    console.log(`   Custo Testes:         €${custoTestes.toFixed(2)}\n`);
    
    console.log(`🛠️  SERVIÇOS:\n`);
    console.log(`   Serviços Prestados:   ${servicosAdicionais.length}`);
    console.log(`   Custo Serviços:       €${custoServicos.toFixed(2)}\n`);
    
    console.log(`💰 FATURAÇÃO:\n`);
    console.log(`   Obra:                 ${obra.id}`);
    console.log(`   Fatura:               ${fatura.id}`);
    console.log(`   VALOR TOTAL:          €${custoTotal.toFixed(2)}`);
    console.log(`   Status:               ${fatura.status.toUpperCase()}\n`);
    
    console.log(`📅 PRÓXIMA INSPEÇÃO:\n`);
    console.log(`   Data:                 ${proximaInspecao.toLocaleDateString('pt-PT')}`);
    console.log(`   Tipo:                 Inspeção Anual\n`);
    
    console.log('═'.repeat(120));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
inspecaoAcidenteTotal()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
