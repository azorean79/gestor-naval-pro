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

async function criarBaseDadosCompleta() {
  console.log('🚀 CRIANDO BASE DE DADOS COMPLETA COM EXEMPLOS REAIS\n');

  try {
    // 1. CRIAR CLIENTES BASEADOS NOS EXEMPLOS
    console.log('1️⃣ Criando clientes...');

    const clientes = [
      {
        nome: 'Pescas do Atlântico',
        email: 'operacoes@pescasatlantico.pt',
        telefone: '+351 291 555 123',
        endereco: 'Zona Industrial, Horta, Açores',
        nif: '501234567',
        tipo: 'cliente',
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      },
      {
        nome: 'Transportes Açores',
        email: 'contacto@transportesacores.pt',
        telefone: '+351 296 123 456',
        endereco: 'Rua da Marina, 123, Ponta Delgada, Açores',
        nif: '512345678',
        tipo: 'cliente',
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      },
      {
        nome: 'Naviera Açor',
        email: 'operacoes@naviera-acor.pt',
        telefone: '+351 295 987 654',
        endereco: 'Avenida do Porto, 456, Angra do Heroísmo, Açores',
        nif: '523456789',
        tipo: 'cliente',
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      }
    ];

    const clientesCriados = [];
    for (const cliente of clientes) {
      const clienteCriado = await prisma.cliente.create({
        data: cliente
      });
      clientesCriados.push(clienteCriado);
      console.log(`   ✅ ${clienteCriado.nome}`);
    }

    // 2. CRIAR NAVIOS BASEADOS NOS EXEMPLOS
    console.log('\n2️⃣ Criando navios...');

    const navios = [
      {
        nome: 'ESPIRITO SANTO',
        tipo: 'Pesca',
        matricula: 'PT-ES-001',
        bandeira: 'Portugal',
        comprimento: 25.5,
        largura: 8.2,
        calado: 3.5,
        capacidade: 150,
        anoConstrucao: 2018,
        status: 'ativo',
        dataInspecao: new Date('2025-01-15'),
        dataProximaInspecao: new Date('2026-01-15'),
        clienteId: clientesCriados[0].id,
        delegacao: 'Açores',
        ilha: 'Faial'
      },
      {
        nome: 'MESTRE MIGUEL',
        tipo: 'Pesca',
        matricula: 'PT-MM-002',
        bandeira: 'Portugal',
        comprimento: 22.3,
        largura: 7.8,
        calado: 3.2,
        capacidade: 120,
        anoConstrucao: 2015,
        status: 'ativo',
        dataInspecao: new Date('2025-02-20'),
        dataProximaInspecao: new Date('2026-02-20'),
        clienteId: clientesCriados[1].id,
        delegacao: 'Açores',
        ilha: 'São Miguel'
      },
      {
        nome: 'SANTA MARIA EXPRESS',
        tipo: 'Ferry de Passageiros',
        matricula: 'PT-SME-003',
        bandeira: 'Portugal',
        comprimento: 45.7,
        largura: 12.5,
        calado: 4.8,
        capacidade: 450,
        anoConstrucao: 2020,
        status: 'ativo',
        dataInspecao: new Date('2025-03-10'),
        dataProximaInspecao: new Date('2026-03-10'),
        clienteId: clientesCriados[2].id,
        delegacao: 'Açores',
        ilha: 'Santa Maria'
      }
    ];

    const naviosCriados = [];
    for (const navio of navios) {
      const navioCriado = await prisma.navio.create({
        data: navio
      });
      naviosCriados.push(navioCriado);
      console.log(`   ✅ ${navioCriado.nome} (${navioCriado.tipo})`);
    }

    // 3. CRIAR MARCAS E MODELOS
    console.log('\n3️⃣ Criando marcas e modelos...');

    const marcas = [
      { nome: 'RFD', ativo: true },
      { nome: 'Zodiac', ativo: true },
      { nome: 'Viking', ativo: true }
    ];

    for (const marca of marcas) {
      await prisma.marcaJangada.upsert({
        where: { nome: marca.nome },
        update: {},
        create: marca
      });
    }

    const modelos = [
      { nome: 'SEASAVE PLUS R', marcaId: (await prisma.marcaJangada.findFirst({ where: { nome: 'RFD' } })).id },
      { nome: 'MKIV', marcaId: (await prisma.marcaJangada.findFirst({ where: { nome: 'RFD' } })).id },
      { nome: 'TO SR 25P', marcaId: (await prisma.marcaJangada.findFirst({ where: { nome: 'Zodiac' } })).id }
    ];

    for (const modelo of modelos) {
      await prisma.modeloJangada.upsert({
        where: { nome: modelo.nome },
        update: {},
        create: modelo
      });
    }

    // 4. CRIAR JANGADAS BASEADAS NOS EXEMPLOS
    console.log('\n4️⃣ Criando jangadas...');

    const jangadas = [
      {
        numeroSerie: 'RFD-MKIV-ESP-001',
        tipo: 'Balsa Salva-Vidas',
        tipoPack: 'Pack SOLAS A',
        dataInspecao: new Date('2025-01-15'),
        dataProximaInspecao: new Date('2026-01-15'),
        status: 'Instalada',
        estado: 'instalada',
        clienteId: clientesCriados[0].id,
        navioId: naviosCriados[0].id,
        tecnico: 'Julio Correia',
        hruAplicavel: true,
        hruModelo: 'HAMMAR H20'
      },
      {
        numeroSerie: '6017330300330',
        tipo: 'Balsa Salva-Vidas',
        tipoPack: 'Pack SOLAS A',
        dataInspecao: new Date('2025-01-07'),
        dataProximaInspecao: new Date('2026-01-07'),
        status: 'Instalada',
        estado: 'instalada',
        clienteId: clientesCriados[1].id,
        navioId: naviosCriados[1].id,
        tecnico: 'Julio Correia',
        hruAplicavel: true,
        hruModelo: 'HAMMAR H20'
      },
      {
        numeroSerie: 'ZODIAC-TO-SR-25-001',
        tipo: 'Balsa Salva-Vidas',
        tipoPack: 'Pack SOLAS A',
        dataInspecao: new Date('2025-02-01'),
        dataProximaInspecao: new Date('2026-02-01'),
        status: 'Aguardando Inspeção',
        estado: 'removida',
        clienteId: clientesCriados[2].id,
        navioId: naviosCriados[2].id,
        tecnico: 'Julio Correia',
        hruAplicavel: true,
        hruModelo: 'HAMMAR H20'
      }
    ];

    const jangadasCriadas = [];
    for (const jangada of jangadas) {
      const jangadaCriada = await prisma.jangada.upsert({
        where: { numeroSerie: jangada.numeroSerie },
        update: {},
        create: jangada
      });
      jangadasCriadas.push(jangadaCriada);
      console.log(`   ✅ ${jangadaCriada.numeroSerie} - ${jangadaCriada.status}`);
    }

    // 5. CRIAR ITENS DE STOCK BASEADOS NOS EXEMPLOS DA OBRA FO102600001
    console.log('\n5️⃣ Criando itens de stock da Obra FO102600001...');

    const itensStock = [
      // Componentes mencionados na obra FO102600001
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
      },
      // Outros componentes essenciais
      {
        nome: 'Coletes Salva-Vidas SOLAS',
        descricao: 'Coletes salva-vidas aprovados SOLAS',
        categoria: 'Coletes',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 85.00,
        fornecedor: 'Secumar',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'EPIRB - Baliza Pessoal',
        descricao: 'EPIRB - Baliza Pessoal de Emergência',
        categoria: 'EPIRBs',
        quantidade: 15,
        quantidadeMinima: 3,
        precoUnitario: 3500.00,
        fornecedor: 'McMurdo',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'HAMMAR H20',
        descricao: 'Sistema HRU HAMMAR H20',
        categoria: 'HRU',
        quantidade: 8,
        quantidadeMinima: 2,
        precoUnitario: 1200.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'Kit de Reparação Balsa',
        descricao: 'Kit completo de reparação para balsas salva-vidas',
        categoria: 'Kits Reparação',
        quantidade: 12,
        quantidadeMinima: 3,
        precoUnitario: 350.00,
        fornecedor: 'Zodiac Maritime',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'Manual de Instruções SOLAS',
        descricao: 'Manual de instruções da balsa salva-vidas',
        categoria: 'Documentação',
        quantidade: 25,
        quantidadeMinima: 5,
        precoUnitario: 5.00,
        fornecedor: 'RFD',
        localizacao: 'Armazém Documentação',
        status: 'ativo'
      }
    ];

    let contadorStock = 0;
    for (const item of itensStock) {
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
      contadorStock++;
    }
    console.log(`   ✅ ${contadorStock} itens de stock criados`);

    // 6. CRIAR OBRA BASEADA NO EXEMPLO
    console.log('\n6️⃣ Criando obra de exemplo...');

    const obra = await prisma.obra.create({
      data: {
        titulo: `Manutenção e Inspeção - ${naviosCriados[0].nome}`,
        descricao: `Inspeção anual da jangada ${jangadasCriadas[0].numeroSerie}, renovação de certificado SOLAS e substituição de componentes vencidos`,
        status: 'em_curso',
        dataInicio: new Date('2026-02-03'),
        dataFim: new Date('2026-02-10'),
        orcamento: 2500.00,
        clienteId: clientesCriados[0].id,
        responsavel: 'Julio Correia'
      }
    });

    console.log(`   ✅ Obra criada: ${obra.titulo}`);

    // 7. CRIAR CERTIFICADO BASEADO NO EXEMPLO
    console.log('\n7️⃣ Criando certificado de exemplo...');

    const certificado = await prisma.certificado.create({
      data: {
        numero: 'AZ25-002',
        tipo: 'SOLAS',
        dataEmissao: new Date('2025-01-07'),
        dataValidade: new Date('2026-01-07'),
        status: 'ativo',
        descricao: `Certificado SOLAS para jangada ${jangadasCriadas[1].numeroSerie}`,
        clienteId: clientesCriados[1].id,
        navioId: naviosCriados[1].id,
        jangadaId: jangadasCriadas[1].id,
        tecnico: 'Julio Correia'
      }
    });

    console.log(`   ✅ Certificado criado: ${certificado.numero}`);

    // 8. CRIAR INSPEÇÃO BASEADA NO EXEMPLO
    console.log('\n8️⃣ Criando inspeção de exemplo...');

    const inspecao = await prisma.inspecao.create({
      data: {
        tipo: 'anual',
        dataInspecao: new Date('2025-01-07'),
        dataProximaInspecao: new Date('2026-01-07'),
        status: 'concluida',
        resultado: 'aprovada',
        observacoes: 'Inspeção anual realizada com sucesso. Todos os componentes em bom estado.',
        recomendacoes: 'Substituir sinalizadores fumígenos próximos do vencimento.',
        clienteId: clientesCriados[1].id,
        navioId: naviosCriados[1].id,
        jangadaId: jangadasCriadas[1].id,
        tecnico: 'Julio Correia'
      }
    });

    console.log(`   ✅ Inspeção criada: ${inspecao.tipo} - ${inspecao.resultado}`);

    // 9. CRIAR FATURA BASEADA NO EXEMPLO
    console.log('\n9️⃣ Criando fatura de exemplo...');

    const numeroFatura = `FAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);

    const fatura = await prisma.fatura.create({
      data: {
        numero: numeroFatura,
        dataEmissao: new Date(),
        dataVencimento: dataVencimento,
        valor: 1850.00,
        status: 'pendente',
        descricao: `Inspeção anual jangada ${jangadasCriadas[0].numeroSerie} com renovação de certificado`,
        clienteId: clientesCriados[0].id,
        navioId: naviosCriados[0].id,
        jangadaId: jangadasCriadas[0].id
      }
    });

    console.log(`   ✅ Fatura criada: ${fatura.numero} - €${fatura.valor.toFixed(2)}`);

    // 10. CRIAR TAREFAS BASEADAS NO EXEMPLO
    console.log('\n🔟 Criando tarefas de exemplo...');

    const tarefas = [
      {
        titulo: 'Inspeção Anual Jangada ESPIRITO SANTO',
        descricao: 'Realizar inspeção completa da jangada RFD-MKIV-ESP-001',
        status: 'concluida',
        prioridade: 'alta',
        dataVencimento: new Date('2026-01-15'),
        clienteId: clientesCriados[0].id,
        navioId: naviosCriados[0].id,
        jangadaId: jangadasCriadas[0].id,
        responsavel: 'Julio Correia'
      },
      {
        titulo: 'Renovar Certificado SOLAS',
        descricao: 'Processar renovação do certificado SOLAS para 2026',
        status: 'pendente',
        prioridade: 'media',
        dataVencimento: new Date('2026-01-10'),
        clienteId: clientesCriados[0].id,
        navioId: naviosCriados[0].id,
        jangadaId: jangadasCriados[0].id,
        responsavel: 'Julio Correia'
      },
      {
        titulo: 'Substituir Sinalizadores Vencidos',
        descricao: 'Substituir sinalizadores fumígenos próximos do vencimento',
        status: 'pendente',
        prioridade: 'baixa',
        dataVencimento: new Date('2026-03-01'),
        clienteId: clientesCriados[1].id,
        navioId: naviosCriados[1].id,
        jangadaId: jangadasCriados[1].id,
        responsavel: 'Julio Correia'
      }
    ];

    for (const tarefa of tarefas) {
      await prisma.tarefa.create({
        data: tarefa
      });
    }

    console.log(`   ✅ ${tarefas.length} tarefas criadas`);

    console.log('\n🎉 BASE DE DADOS COMPLETA CRIADA COM SUCESSO!');
    console.log('\n📊 RESUMO:');
    console.log(`   👥 ${clientesCriados.length} clientes`);
    console.log(`   🚢 ${naviosCriados.length} navios`);
    console.log(`   🛟 ${jangadasCriadas.length} jangadas`);
    console.log(`   📦 ${contadorStock} itens de stock`);
    console.log(`   🏗️  1 obra`);
    console.log(`   📄 1 certificado`);
    console.log(`   🔍 1 inspeção`);
    console.log(`   💰 1 fatura`);
    console.log(`   ✅ ${tarefas.length} tarefas`);

  } catch (error) {
    console.error('❌ Erro durante a criação da base de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
criarBaseDadosCompleta();