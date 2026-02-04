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

async function criarServicosStock() {
  console.log('🔧 CRIANDO SERVIÇOS NO STOCK - INSPEÇÃO E MANUTENÇÃO\n');

  try {
    // 1. OBTER JANGADA
    console.log('1️⃣ Carregando jangada...');
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada não encontrada');
      process.exit(1);
    }
    console.log(`✅ Jangada encontrada: ${jangada.numeroSerie}`);

    // 2. DEFINIR SERVIÇOS
    console.log('\n2️⃣ Definindo serviços...\n');

    const servicos = [
      {
        nome: 'Inspeção Anual Jangada',
        descricao: 'Inspeção completa da jangada - verificação de todos os componentes, estrutura e sistemas',
        categoria: 'servico-inspecao',
        quantidade: 0, // Serviços não têm "quantidade em stock"
        quantidadeMinima: 0,
        precoUnitario: 500.00,
        refOrey: 'SERV-INSP-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Limpeza e Desinfeção',
        descricao: 'Limpeza profissional e desinfeção da jangada, câmaras e equipamentos',
        categoria: 'servico-limpeza',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 250.00,
        refOrey: 'SERV-LIMP-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Reparação Conector Leafield',
        descricao: 'Reparação ou substituição de conectores do sistema Leafield de insuflação',
        categoria: 'servico-reparacao',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 180.00,
        refOrey: 'SERV-RPAR-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Pintura e Proteção do Cilindro',
        descricao: 'Pintura anti-corrosão e proteção do cilindro CO2 Leafield',
        categoria: 'servico-pintura',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 220.00,
        refOrey: 'SERV-PINT-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Marcação e Etiquetagem',
        descricao: 'Marcação de identificação, etiquetagem e documentação de componentes',
        categoria: 'servico-marcacao',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 85.00,
        refOrey: 'SERV-MARC-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Teste de Pressão Sistema',
        descricao: 'Teste de pressão e validação do sistema de insuflação Leafield',
        categoria: 'servico-teste',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 300.00,
        refOrey: 'SERV-TEST-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Certificação SOLAS',
        descricao: 'Emissão e renovação de certificado SOLAS para navegação',
        categoria: 'servico-certificacao',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 400.00,
        refOrey: 'SERV-CERT-001',
        localizacao: 'Serviço',
        status: 'ativo'
      },
      {
        nome: 'Documentação e Relatório',
        descricao: 'Elaboração de relatório técnico completo e documentação da inspeção',
        categoria: 'servico-documentacao',
        quantidade: 0,
        quantidadeMinima: 0,
        precoUnitario: 150.00,
        refOrey: 'SERV-DOC-001',
        localizacao: 'Serviço',
        status: 'ativo'
      }
    ];

    // 3. CRIAR SERVIÇOS NO STOCK
    console.log('3️⃣ Criando serviços no stock...\n');
    console.log('─'.repeat(120));
    console.log('SERVIÇO                                  | CATEGORIA            | PREÇO UNIT. | REFERÊNCIA');
    console.log('─'.repeat(120));

    const servicosCriados = [];

    for (const servico of servicos) {
      const servicoExistente = await prisma.stock.findFirst({
        where: {
          nome: servico.nome,
          categoria: servico.categoria
        }
      });

      if (!servicoExistente) {
        const novoServico = await prisma.stock.create({
          data: servico
        });
        servicosCriados.push(novoServico);

        console.log(
          `${servico.nome.padEnd(38)} | ${servico.categoria.padEnd(20)} | €${String(servico.precoUnitario.toFixed(2)).padEnd(10)} | ${servico.refOrey}`
        );
      } else {
        console.log(
          `${servico.nome.padEnd(38)} | ${servico.categoria.padEnd(20)} | €${String(servico.precoUnitario.toFixed(2)).padEnd(10)} | ${servico.refOrey} (EXISTENTE)`
        );
        servicosCriados.push(servicoExistente);
      }
    }

    console.log('─'.repeat(120));
    console.log(`Total: ${servicosCriados.length} serviços\n`);

    // 4. REGISTRAR MOVIMENTAÇÕES DE SERVIÇOS
    console.log('4️⃣ Registrando movimentações de serviços utilizados...\n');
    console.log('─'.repeat(120));
    console.log('SERVIÇO                                  | TIPO | QUANTIDADE | MOTIVO');
    console.log('─'.repeat(120));

    const servicosUtilizados = [
      { indice: 0, quantidade: 1, motivo: 'Inspeção anual realizada' }, // Inspeção
      { indice: 1, quantidade: 1, motivo: 'Limpeza executada durante manutenção' }, // Limpeza
      { indice: 2, quantidade: 1, motivo: 'Reparação de conectores identificada' }, // Reparação conector
      { indice: 3, quantidade: 1, motivo: 'Proteção e pintura do cilindro realizada' }, // Pintura
      { indice: 4, quantidade: 1, motivo: 'Marcação e etiquetagem completa' }, // Marcação
      { indice: 5, quantidade: 1, motivo: 'Teste de pressão e validação' }, // Teste
      { indice: 6, quantidade: 1, motivo: 'Certificado SOLAS renovado' }, // Certificação
      { indice: 7, quantidade: 1, motivo: 'Relatório técnico elaborado' } // Documentação
    ];

    for (const utilizado of servicosUtilizados) {
      const servico = servicosCriados[utilizado.indice];

      const movimentacao = await prisma.movimentacaoStock.create({
        data: {
          stockId: servico.id,
          tipo: 'saida',
          quantidade: utilizado.quantidade,
          motivo: `[Obra Inspeção ${jangada.numeroSerie}] ${utilizado.motivo}`,
          responsavel: 'Julio Correia'
        }
      });

      console.log(
        `${servico.nome.padEnd(38)} | SAÍDA | ${String(utilizado.quantidade).padEnd(10)} | ${utilizado.motivo}`
      );
    }

    console.log('─'.repeat(120));
    console.log(`Total movimentações: ${servicosUtilizados.length}\n`);

    // 5. RESUMO FINANCEIRO
    console.log('5️⃣ Resumo Financeiro - Serviços Faturados\n');
    console.log('═'.repeat(120));
    console.log('SERVIÇO                                  | QTDE | VALOR UNIT. | TOTAL');
    console.log('═'.repeat(120));

    let totalServicos = 0;

    for (const utilizado of servicosUtilizados) {
      const servico = servicosCriados[utilizado.indice];
      const total = servico.precoUnitario * utilizado.quantidade;
      totalServicos += total;

      console.log(
        `${servico.nome.padEnd(38)} | ${String(utilizado.quantidade).padEnd(4)} | €${String(servico.precoUnitario.toFixed(2)).padEnd(10)} | €${String(total.toFixed(2))}`
      );
    }

    console.log('═'.repeat(120));
    console.log(`${'TOTAL SERVIÇOS'.padEnd(38)} | ${' '.padEnd(4)} | ${' '.padEnd(11)} | €${String(totalServicos.toFixed(2))}`);
    console.log('═'.repeat(120));

    // 6. DETALHAMENTO POR CATEGORIA
    console.log('\n6️⃣ Serviços por Categoria\n');

    const categorias = {};
    for (const utilizado of servicosUtilizados) {
      const servico = servicosCriados[utilizado.indice];
      if (!categorias[servico.categoria]) {
        categorias[servico.categoria] = [];
      }
      categorias[servico.categoria].push({
        nome: servico.nome,
        valor: servico.precoUnitario
      });
    }

    let contador = 1;
    for (const [categoria, items] of Object.entries(categorias)) {
      const valorSubtotal = items.reduce((sum, item) => sum + item.valor, 0);
      console.log(`${contador}. ${categoria.toUpperCase()}`);
      for (const item of items) {
        console.log(`   • ${item.nome}: €${item.valor.toFixed(2)}`);
      }
      console.log(`   Subtotal: €${valorSubtotal.toFixed(2)}\n`);
      contador++;
    }

    // 7. INFORMAÇÕES PARA FATURA
    console.log('═'.repeat(120));
    console.log('📋 INFORMAÇÕES PARA FATURA - SERVIÇOS E COMPONENTES\n');
    console.log('Jangada: ' + jangada.numeroSerie);
    console.log('Capacidade: ' + jangada.capacidade + ' pessoas');
    console.log('Data Fabricação: ' + jangada.dataFabricacao.toLocaleDateString('pt-PT'));
    console.log('\nServiços inclusos na obra:');
    console.log('✅ Inspeção Anual - €500.00');
    console.log('✅ Limpeza e Desinfeção - €250.00');
    console.log('✅ Reparação Conector Leafield - €180.00');
    console.log('✅ Pintura e Proteção Cilindro - €220.00');
    console.log('✅ Marcação e Etiquetagem - €85.00');
    console.log('✅ Teste de Pressão - €300.00');
    console.log('✅ Certificação SOLAS - €400.00');
    console.log('✅ Documentação e Relatório - €150.00');
    console.log('\nComponentes substituídos:');
    console.log('✅ Sinais de Fumo (2 un) - €91.00');
    console.log(`\nTOTAL SERVIÇOS: €${totalServicos.toFixed(2)}`);
    console.log(`TOTAL COMPONENTES: €91.00`);
    console.log(`MANO DE OBRA TÉCNICO (8h @ €75/h): €600.00`);
    console.log(`\nTOTAL GERAL: €${(totalServicos + 91 + 600).toFixed(2)}`);
    console.log('═'.repeat(120));

    // 8. VISUALIZAÇÃO DO STOCK
    console.log('\n7️⃣ Stock Atualizado - Serviços Disponíveis\n');

    const todoStock = await prisma.stock.findMany({
      where: {
        categoria: { contains: 'servico' }
      }
    });

    console.log(`Total serviços no sistema: ${todoStock.length}`);
    console.log('\nTodos os serviços de manutenção estão agora disponíveis no stock para:');
    console.log('  • Retirada quando utilizados em obras');
    console.log('  • Registro de movimentação com motivo');
    console.log('  • Inclusão automática em faturas');
    console.log('  • Rastreamento de custos por serviço');

    console.log('\n🎉 Serviços criados e movimentações registradas com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
criarServicosStock()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
