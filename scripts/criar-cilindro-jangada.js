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

async function criarCilindroJangada() {
  console.log('🔧 Criando cilindro CO2 Leafield para jangada ESPIRITO SANTO...\n');

  try {
    // 1. OBTER JANGADA
    console.log('1️⃣ Procurando jangada RFD SURVIVA MKIV...');
    const jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
      orderBy: { createdAt: 'desc' }
    });

    if (!jangada) {
      console.error('❌ Jangada RFD SURVIVA MKIV não encontrada');
      process.exit(1);
    }
    console.log(`✅ Jangada encontrada: ${jangada.numeroSerie}`);

    // 2. CRIAR/VERIFICAR SISTEMA CILINDRO LEAFIELD
    console.log('\n2️⃣ Verificando sistema cilindro Leafield...');
    let sistemaCilindro = await prisma.sistemaCilindro.findFirst({
      where: { nome: 'Leafield' }
    });

    if (!sistemaCilindro) {
      sistemaCilindro = await prisma.sistemaCilindro.create({
        data: {
          nome: 'Leafield',
          descricao: 'Sistema automático de insuflação Leafield',
          ativo: true
        }
      });
      console.log('✅ Sistema Leafield criado');
    } else {
      console.log('✅ Sistema Leafield encontrado');
    }

    // 3. CRIAR/VERIFICAR TIPO CILINDRO CO2
    console.log('\n3️⃣ Verificando tipo cilindro CO2...');
    let tipoCilindro = await prisma.tipoCilindro.findFirst({
      where: { nome: 'CO2' }
    });

    if (!tipoCilindro) {
      tipoCilindro = await prisma.tipoCilindro.create({
        data: {
          nome: 'CO2',
          descricao: 'Cilindro de dióxido de carbono para insuflação de jangadas',
          ativo: true
        }
      });
      console.log('✅ Tipo CO2 criado');
    } else {
      console.log('✅ Tipo CO2 encontrado');
    }

    // 4. CRIAR/VERIFICAR TIPO VÁLVULA B10
    console.log('\n4️⃣ Verificando tipo válvula B10...');
    let tipoValvula = await prisma.tipoValvula.findFirst({
      where: { nome: 'B10' }
    });

    if (!tipoValvula) {
      tipoValvula = await prisma.tipoValvula.create({
        data: {
          nome: 'B10',
          descricao: 'Válvula de alívio de pressão modelo B10 - 1 para câmara inferior e 1 para câmara superior',
          ativo: true
        }
      });
      console.log('✅ Tipo válvula B10 criado');
    } else {
      console.log('✅ Tipo válvula B10 encontrado');
    }

    // 5. CRIAR CILINDRO CO2 LEAFIELD
    console.log('\n5️⃣ Criando cilindro CO2 Leafield...');
    const numeroSerieCilindro = `LEAFIELD-CO2-${Date.now()}`;
    
    // Cálculos de peso
    const capacidadeCO2 = 8.8; // kg
    const capacidadeN2 = 0.44; // kg
    const tara = 12.4; // Peso do cilindro vazio em kg
    const pesoBruto = tara + capacidadeCO2 + capacidadeN2; // Peso total com gases
    
    const cilindro = await prisma.cilindro.create({
      data: {
        numeroSerie: numeroSerieCilindro,
        tipo: 'CO2/N2',
        sistemaId: sistemaCilindro.id,
        tipoCilindroId: tipoCilindro.id,
        tipoValvulaId: tipoValvula.id,
        capacidade: capacidadeCO2,
        dataFabricacao: new Date('2014-05-15'),
        dataTeste: new Date('2024-01-15'),
        dataProximoTeste: new Date('2026-01-15'),
        status: 'ativo',
        pressaoTrabalho: 58.0, // bar (pressão típica CO2)
        pressaoTeste: 87.0 // bar (1.5x pressão trabalho)
      }
    });

    console.log(`✅ Cilindro criado: ${cilindro.numeroSerie}`);
    console.log(`   Capacidade CO2: ${capacidadeCO2} kg`);
    console.log(`   Capacidade N2: ${capacidadeN2} kg`);
    console.log(`   Tara (vazio): ${tara} kg`);
    console.log(`   Peso Bruto (com gases): ${pesoBruto} kg`);
    console.log(`   Fabricação: Maio 2014`);
    console.log(`   Próximo teste: Janeiro 2026`);
    console.log(`   Válvulas B10 associadas: 2 (1 câmara inferior + 1 câmara superior)`);

    // 6. CRIAR INSPEÇÃO CILINDRO - ASSOCIADO À JANGADA
    console.log('\n6️⃣ Criando inspeção de cilindro...');
    const inspecao = await prisma.inspecao.create({
      data: {
        numero: `INSP-CIL-${Date.now()}`,
        tipoInspecao: 'inicial',
        dataInspecao: new Date('2024-01-15'),
        dataProxima: new Date('2026-01-15'),
        resultado: 'aprovada',
        status: 'realizada',
        tecnico: 'Julio Correia',
        cilindroId: cilindro.id,
        jangadaId: jangada.id,
        observacoes: 'Cilindro CO2 Leafield 0,440 kg associado à jangada RFD SURVIVA MKIV'
      }
    });

    console.log(`✅ Inspeção criada: ${inspecao.numero}`);

    // 7. RESUMO
    console.log('\n🎉 Cilindro criado e associado com sucesso!\n');
    console.log('📊 Resumo do Cilindro CO2/N2 Leafield:');
    console.log(`   🔢 Número série: ${cilindro.numeroSerie}`);
    console.log(`   🛳️  Jangada: ${jangada.numeroSerie}`);
    console.log(`   📏 Capacidade CO2: ${capacidadeCO2} kg`);
    console.log(`   📏 Capacidade N2: ${capacidadeN2} kg`);
    console.log(`   ⚖️  Tara (cilindro vazio): ${tara} kg`);
    console.log(`   ⚖️  Peso Bruto (com gases): ${pesoBruto} kg`);
    console.log(`   🏭 Fabricação: Maio 2014`);
    console.log(`   🔧 Sistema: Leafield`);
    console.log(`   ⚙️  Válvulas: B10 (1 câmara inferior + 1 câmara superior)`);
    console.log(`   📅 Próximo teste: Janeiro 2026`);
    console.log(`   ✅ Status: Ativo`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
criarCilindroJangada()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
