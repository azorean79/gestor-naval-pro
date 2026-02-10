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

async function criarObraComFaturacao() {
  console.log('🏗️  CRIANDO OBRA COM FATURAÇÃO - INSPEÇÃO E CERTIFICADO\n');

  try {
    // 1. OBTER DADOS
    console.log('1️⃣ Carregando dados...');

    const cliente = await prisma.cliente.findFirst({
      where: { nome: { contains: 'Pescas do Atlântico' } }
    });

    const navio = await prisma.navio.findFirst({
      where: { nome: 'ESPIRITO SANTO' }
    });

    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!cliente || !navio || !jangada) {
      console.error('❌ Dados não encontrados');
      process.exit(1);
    }

    console.log(`✅ Cliente: ${cliente.nome}`);
    console.log(`✅ Navio: ${navio.nome}`);
    console.log(`✅ Jangada: ${jangada.numeroSerie}`);

    // 2. CRIAR OBRA
    console.log('\n2️⃣ Criando Obra...');

    const dataInicio = new Date('2026-02-03');
    const dataFim = new Date('2026-02-10');

    const obra = await prisma.obra.create({
      data: {
        titulo: `Manutenção e Inspeção - ${navio.nome}`,
        descricao: `Inspeção anual da jangada ${jangada.numeroSerie}, renovação de certificado SOLAS e substituição de componentes vencidos`,
        status: 'em_curso',
        dataInicio: dataInicio,
        dataFim: dataFim,
        orcamento: 2500.00,
        clienteId: cliente.id,
        responsavel: 'Julio Correia'
      }
    });

    console.log(`✅ Obra criada: ${obra.titulo}`);
    console.log(`   ID: ${obra.id}`);
    console.log(`   Status: ${obra.status}`);
    console.log(`   Orçamento: €${obra.orcamento.toFixed(2)}`);

    // 3. DEFINIR ITENS A FATURAR
    console.log('\n3️⃣ Itens de Faturação para a Obra\n');
    console.log('─'.repeat(100));
    console.log('DESCRIÇÃO                                           | QUANTIDADE | VALOR UNIT. | TOTAL      | MOTIVO');
    console.log('─'.repeat(100));

    const itens = [
      {
        descricao: 'Inspeção Anual - Jangada RFD SURVIVA MKIV',
        quantidade: 1,
        valorUnitario: 500.00,
        motivo: 'Inspeção obrigatória - Validade certificado'
      },
      {
        descricao: 'Renovação Certificado SOLAS - Ano 2026',
        quantidade: 1,
        valorUnitario: 400.00,
        motivo: 'Certificado SOLAS necessário para navegação'
      },
      {
        descricao: 'Substituição Sinais de Fumo (2 un)',
        quantidade: 2,
        valorUnitario: 45.50,
        motivo: 'Componentes expirados (< 12 meses)'
      },
      {
        descricao: 'Mão de obra - Técnico Inspetor',
        quantidade: 8, // 8 horas
        valorUnitario: 75.00,
        motivo: 'Inspeção e documentação'
      },
      {
        descricao: 'Testes e Validação de Segurança',
        quantidade: 1,
        valorUnitario: 300.00,
        motivo: 'Testes obrigatórios do sistema Leafield'
      }
    ];

    let totalOra = 0;

    for (const item of itens) {
      const total = item.quantidade * item.valorUnitario;
      totalOra += total;

      console.log(
        `${item.descricao.padEnd(49)} | ${String(item.quantidade).padEnd(10)} | €${String(item.valorUnitario.toFixed(2)).padEnd(10)} | €${String(total.toFixed(2)).padEnd(10)} | ${item.motivo}`
      );
    }

    console.log('─'.repeat(100));
    console.log(`${'TOTAL'.padEnd(49)} | ${' '.padEnd(10)} | ${' '.padEnd(11)} | €${String(totalOra.toFixed(2)).padEnd(9)} |`);
    console.log('─'.repeat(100));

    // 4. CRIAR FATURA
    console.log('\n4️⃣ Criando Fatura...\n');

    const numeroFatura = `FAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const dataVencimento = new Date(dataFim);
    dataVencimento.setDate(dataVencimento.getDate() + 30);

    const fatura = await prisma.fatura.create({
      data: {
        numero: numeroFatura,
        dataEmissao: new Date(),
        dataVencimento: dataVencimento,
        valor: totalOra,
        status: 'pendente',
        descricao: `Inspeção anual jangada ${jangada.numeroSerie} com renovação de certificado`,
        clienteId: cliente.id,
        navioId: navio.id,
        jangadaId: jangada.id
      }
    });

    console.log(`   ✅ Fatura gerada: ${fatura.numero}`);
    console.log(`   📅 Data Emissão: ${fatura.dataEmissao.toLocaleDateString('pt-PT')}`);
    console.log(`   📅 Data Vencimento: ${fatura.dataVencimento.toLocaleDateString('pt-PT')}`);
    console.log(`   💰 Valor Total: €${fatura.valor.toFixed(2)}`);
    console.log(`   ⏱️  Status: ${fatura.status}`);

    // 5. RESUMO DA OBRA
    console.log('\n5️⃣ Resumo da Obra com Faturação\n');
    console.log('═'.repeat(100));
    console.log('📋 INFORMAÇÕES DA OBRA');
    console.log('═'.repeat(100));
    console.log(`   ID Obra: ${obra.id}`);
    console.log(`   Título: ${obra.titulo}`);
    console.log(`   Cliente: ${cliente.nome} (NIF: ${cliente.nif})`);
    console.log(`   Navio: ${navio.nome} (Matrícula: ${navio.matricula})`);
    console.log(`   Jangada: ${jangada.numeroSerie}`);
    console.log(`   Período: ${dataInicio.toLocaleDateString('pt-PT')} a ${dataFim.toLocaleDateString('pt-PT')}`);
    console.log(`   Status Obra: ${obra.status}`);

    console.log('\n' + '═'.repeat(100));
    console.log('📄 INFORMAÇÕES DA FATURA');
    console.log('═'.repeat(100));
    console.log(`   Nº Fatura: ${fatura.numero}`);
    console.log(`   Valor Fatura: €${fatura.valor.toFixed(2)}`);
    console.log(`   Descrição: ${fatura.descricao}`);
    console.log(`   Status: ${fatura.status.toUpperCase()}`);
    console.log(`   Vencimento: ${fatura.dataVencimento.toLocaleDateString('pt-PT')}`);

    console.log('\n' + '═'.repeat(100));
    console.log('📋 ITENS FATURADOS');
    console.log('═'.repeat(100));

    itens.forEach((item, index) => {
      const total = item.quantidade * item.valorUnitario;
      console.log(`\n   ${index + 1}. ${item.descricao}`);
      console.log(`      • Quantidade: ${item.quantidade}${item.quantidade > 1 && !item.descricao.includes('horas') ? ' un.' : item.descricao.includes('horas') ? ' h' : ''}`);
      console.log(`      • Valor unitário: €${item.valorUnitario.toFixed(2)}`);
      console.log(`      • Valor total: €${total.toFixed(2)}`);
      console.log(`      • Motivo: ${item.motivo}`);
    });

    console.log('\n' + '═'.repeat(100));
    console.log('💼 RESUMO FINANCEIRO');
    console.log('═'.repeat(100));
    console.log(`   Subtotal: €${totalOra.toFixed(2)}`);
    console.log(`   IVA (23%): €${(totalOra * 0.23).toFixed(2)}`);
    console.log(`   TOTAL c/ IVA: €${(totalOra * 1.23).toFixed(2)}`);
    console.log(`   Orçamento previsto: €${obra.orcamento?.toFixed(2) || 'N/A'}`);
    console.log(`   Diferença: €${obra.orcamento ? (obra.orcamento - totalOra).toFixed(2) : 'N/A'}`);

    console.log('\n' + '═'.repeat(100));
    console.log('✅ INSPEÇÃO ASSOCIADA À OBRA');
    console.log('═'.repeat(100));
    console.log(`   • Inspeção de Jangada: SIM - €500.00`);
    console.log(`   • Renovação Certificado SOLAS: SIM - €400.00`);
    console.log(`   • Substituição Componentes: SIM - €91.00 (2 Sinais de Fumo)`);
    console.log(`   • Mão de obra inspetor: SIM - €600.00 (8 horas @ €75/h)`);
    console.log(`   • Testes de segurança: SIM - €300.00`);
    console.log(`\n   TOTAL INSPEÇÃO E CERTIFICADO: €${(500 + 400).toFixed(2)}`);

    console.log('\n' + '═'.repeat(100));
    console.log('🎉 Obra e Fatura criadas com sucesso!');
    console.log('═'.repeat(100));

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
criarObraComFaturacao()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
