const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function criarItensStockObraFO102600001() {
  console.log('📦 CRIANDO ITENS DE STOCK DA OBRA FO102600001\n');

  try {
    // Itens específicos mencionados na obra FO102600001
    const itensStock = [
      {
        nome: 'Sinais de Fumo Flutuantes',
        descricao: 'Sinais de fumo laranja para durante o dia - Pack SOLAS A',
        categoria: 'Comunicações',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 45.50,
        fornecedor: 'Pains Wessex',
        localizacao: 'Armazém Secundário',
        status: 'ativo'
      },
      {
        nome: 'Foguetes com Paraquedas',
        descricao: 'Foguetes sinalizadores com paraquedas vermelho',
        categoria: 'Comunicações',
        quantidade: 30,
        quantidadeMinima: 5,
        precoUnitario: 22.00,
        fornecedor: 'Pains Wessex',
        localizacao: 'Armazém Secundário',
        status: 'ativo'
      },
      {
        nome: 'Fachos de Mão',
        descricao: 'Fachos de mão para sinalização noturna',
        categoria: 'Comunicações',
        quantidade: 40,
        quantidadeMinima: 8,
        precoUnitario: 18.50,
        fornecedor: 'Switlik',
        localizacao: 'Armazém Secundário',
        status: 'ativo'
      },
      {
        nome: 'Cilindro CO2',
        descricao: 'Cilindro de CO2 para inflação de balsa',
        categoria: 'Cilindros Gás',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 450.00,
        fornecedor: 'Carburos Metálicos',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'Pilhas Alcalinas AA',
        descricao: 'Pilhas alcalinas AA para equipamentos de emergência',
        categoria: 'Baterias',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 1.50,
        fornecedor: 'Duracell',
        localizacao: 'Armazém Consumíveis',
        status: 'ativo'
      }
    ];

    console.log('Inserindo itens de stock...');
    let contador = 0;

    for (const item of itensStock) {
      try {
        await prisma.stock.upsert({
          where: {
            nome_categoria: {
              nome: item.nome,
              categoria: item.categoria
            }
          },
          update: {
            quantidade: item.quantidade,
            quantidadeMinima: item.quantidadeMinima,
            status: item.status
          },
          create: item
        });
        console.log(`   ✅ ${item.nome} (${item.quantidade} unidades)`);
        contador++;
      } catch (error) {
        console.log(`   ⚠️  ${item.nome} já existe, pulando...`);
      }
    }

    console.log(`\n🎉 ${contador} ITENS DE STOCK DA OBRA FO102600001 CRIADOS/ATUALIZADOS!`);

    // Verificar total de itens
    const totalItens = await prisma.stock.count();
    console.log(`📊 Total de itens em stock: ${totalItens}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função
criarItensStockObraFO102600001();