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

async function criarExemploSimples() {
  console.log('🚢 Criando exemplo simples do navio ESPIRITO SANTO...\n');

  try {
    // 1. CRIAR CLIENTE
    console.log('1️⃣ Verificando cliente...');
    let cliente = await prisma.cliente.findFirst({
      where: { nome: { contains: 'Pescas do Atlântico' } }
    });

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nome: 'Pescas do Atlântico, Lda.',
          email: 'geral@pescasatlantico.pt',
          telefone: '+351 296 123 456',
          nif: '512345678',
          tipo: 'armador',
          delegacao: 'São Miguel',
          tecnico: 'Julio Correia',
        }
      });
    }
    console.log('✅ Cliente OK:', cliente.nome);

    // 2. CRIAR NAVIO
    console.log('\n2️⃣ Criando navio...');
    const navioExistente = await prisma.navio.findFirst({
      where: { nome: 'ESPIRITO SANTO' }
    });

    if (navioExistente) {
      await prisma.inspecaoComponente.deleteMany({ where: { jangada: { navioId: navioExistente.id } } });
      await prisma.jangada.deleteMany({ where: { navioId: navioExistente.id } });
      await prisma.agendamento.deleteMany({ where: { navioId: navioExistente.id } });
      await prisma.certificado.deleteMany({ where: { navioId: navioExistente.id } });
      await prisma.navio.delete({ where: { id: navioExistente.id } });
    }

    const navio = await prisma.navio.create({
      data: {
        nome: 'ESPIRITO SANTO',
        matricula: 'PT-SME-2024-001',
        tipo: 'pesca-alto-mar',
        bandeira: 'Portugal',
        comprimento: 24.5,
        largura: 6.8,
        calado: 3.2,
        capacidade: 45.0,
        anoConstrucao: 2018,
        status: 'ativo',
        clienteId: cliente.id,
        delegacao: 'São Miguel',
        ilha: 'São Miguel',
        tecnico: 'Julio Correia',
      }
    });
    console.log('✅ Navio criado:', navio.nome);

    // 3. CRIAR JANGADA RFD SURVIVA MKIV
    console.log('\n3️⃣ Criando jangada RFD SURVIVA MKIV de 20 pessoas...');

    // Criar marca RFD
    let marca = await prisma.marcaJangada.findFirst({
      where: { nome: 'RFD' }
    });
    if (!marca) {
      marca = await prisma.marcaJangada.create({
        data: { nome: 'RFD' }
      });
    }

    // Criar modelo SURVIVA MKIV
    let modelo = await prisma.modeloJangada.findFirst({
      where: { nome: 'SURVIVA MKIV', marcaId: marca.id }
    });
    if (!modelo) {
      modelo = await prisma.modeloJangada.create({
        data: {
          nome: 'SURVIVA MKIV',
          marcaId: marca.id,
          sistemaInsuflacao: 'Leafield CO2',
          valvulasPadrao: 'B10'
        }
      });
    }

    // Criar lotação de 20 pessoas
    let lotacao = await prisma.lotacaoJangada.findFirst({
      where: { capacidade: 20 }
    });
    if (!lotacao) {
      lotacao = await prisma.lotacaoJangada.create({
        data: { capacidade: 20 }
      });
    }

    // Criar tipo de pack SOLAS A
    let tipoPack = await prisma.tipoPack.findFirst({
      where: { nome: 'SOLAS A' }
    });
    if (!tipoPack) {
      tipoPack = await prisma.tipoPack.create({
        data: {
          nome: 'SOLAS A',
          categoria: 'SOLAS A',
          descricao: 'Pack SOLAS A completo para navegação internacional'
        }
      });
    }

    // Criar jangada com dados realistas
    const timestamp = Date.now();
    const jangada = await prisma.jangada.create({
      data: {
        numeroSerie: `RFD-MKIV-ESP-${timestamp}`,
        marcaId: marca.id,
        modeloId: modelo.id,
        lotacaoId: lotacao.id,
        tipoPackId: tipoPack.id,
        tipo: 'jangada-solas',
        tipoPack: 'SOLAS A',
        dataFabricacao: new Date('2014-05-15'),
        dataInspecao: new Date('2024-01-15'),
        dataProximaInspecao: new Date('2025-01-15'),
        capacidade: 20,
        peso: 285.0,
        dimensoes: '3.2m x 2.1m x 0.45m',
        numeroAprovacao: 'SOLAS-MED-2014-RFD-MKIV',
        status: 'instalada',
        estado: 'operacional',
        navioId: navio.id,
        clienteId: cliente.id,
        tecnico: 'Julio Correia',
      }
    });
    console.log(`✅ Jangada RFD SURVIVA MKIV criada: ${jangada.numeroSerie}`);
    console.log(`   📅 Fabricação: Maio 2014`);
    console.log(`   👥 Capacidade: 20 pessoas`);
    console.log(`   📦 Pack: SOLAS A`);

    // 4. CRIAR COMPONENTES DA JANGADA (baseado na lotação de 20 pessoas)
    console.log('\n4️⃣ Criando componentes da jangada (SOLAS Pack A)...');

    const lotacaoPessoas = 20;
    const componentes = [
      // Cilindros e sistema de insuflação
      {
        nome: 'Cilindro CO2 Leafield',
        quantidade: 1,
        tipo: 'cilindro',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: 'Cilindro CO2 8,800 kg - 0,440 kg de CO2 - Sistema Leafield'
      },
      {
        nome: 'Válvula de Alívio B10',
        quantidade: 1,
        tipo: 'valvula',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: 'Válvula de sobre-pressão e alívio B10'
      },
      {
        nome: 'Tubos de Alta Pressão',
        quantidade: 2,
        tipo: 'tubo',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: '2 tubos - 1 para câmara superior e 1 para câmara inferior'
      },
      {
        nome: 'Adaptadores para Câmaras',
        quantidade: 2,
        tipo: 'adaptador',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: '2 adaptadores Leafield tipo A - para encaixe nas câmaras superior e inferior'
      },
      {
        nome: 'Adaptador para Cilindro',
        quantidade: 1,
        tipo: 'adaptador',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: '1 adaptador Leafield tipo B - para encaixe no cilindro CO2'
      },

      // NOTA: Equipamentos EPIRB, SART e Coletes estão associados ao navio

      // Pirotécnicos (baseado em SOLAS Pack A) - Validade mínima 12 meses até próxima inspeção
      {
        nome: 'Foguetes com Paraquedas',
        quantidade: 4,
        tipo: 'pirotecnico',
        estado: 'OK',
        validade: new Date('2027-06-30'),
        notas: 'Sinais luminosos vermelhos de alta altitude - Validade até 06/2027'
      },
      {
        nome: 'Fachos de Mão',
        quantidade: 6,
        tipo: 'pirotecnico',
        estado: 'OK',
        validade: new Date('2027-06-30'),
        notas: 'Sinais luminosos vermelhos manuais - Validade até 06/2027'
      },
      {
        nome: 'Sinais de Fumo Flutuantes',
        quantidade: 2,
        tipo: 'pirotecnico',
        estado: 'OK',
        validade: new Date('2027-06-30'),
        notas: 'Sinais de fumo laranja para dia - Validade até 06/2027'
      },

      // Provisões (calculadas por pessoa) - Validade mínima 12 meses até próxima inspeção
      {
        nome: 'Rações de Emergência',
        quantidade: lotacaoPessoas, // 1 ração por pessoa
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: `${lotacaoPessoas} rações (10.000 kJ cada) - 1 por pessoa - Validade até 05/2029`
      },
      {
        nome: 'Água Potável (embalagens 0,5L)',
        quantidade: lotacaoPessoas * 3, // 3 embalagens de 0.5L por pessoa = 1.5L total
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2029-05-15'),
        notas: `${lotacaoPessoas * 3} embalagens de 0,5L - 3 por pessoa (1,5L total) - Validade até 05/2029`
      },

      // Kit médico
      {
        nome: 'Kit de Primeiros Socorros',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2027-12-31'),
        notas: 'Kit completo SOLAS para 20 pessoas - Validade até 12/2027'
      },
      {
        nome: 'Comprimidos Enjoo (embalagens 60 un)',
        quantidade: 2, // 2 embalagens de 60 comprimidos
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2028-05-15'),
        notas: '2 embalagens de 60 comprimidos (120 total) - 6 por pessoa - Validade até 05/2028'
      },
      {
        nome: 'Sacos Enjoo',
        quantidade: lotacaoPessoas * 2, // 2 por pessoa
        tipo: 'pack',
        estado: 'OK',
        notas: `${lotacaoPessoas * 2} sacos - 2 por pessoa`
      },

      // Equipamentos gerais de sobrevivência
      {
        nome: 'Lanterna Estanque',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Lanterna LED estanque'
      },
      {
        nome: 'Pilhas para Lanterna',
        quantidade: 4,
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2028-05-15'),
        notas: '4 pilhas sobressalentes - Validade até 05/2028'
      },
      {
        nome: 'Heliógrafos (espelhos de sinalização)',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Espelho de sinalização diurna'
      },
      {
        nome: 'Apitos',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Apito de sinalização sonora'
      },
      {
        nome: 'Faca de Segurança',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Faca flutuante com bainha'
      },
      {
        nome: 'Esponjas para Água',
        quantidade: 2,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Esponjas para recolher água da chuva'
      },
      {
        nome: 'Abre-latas',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Abre-latas manual'
      },
      {
        nome: 'Copos Graduados',
        quantidade: 2,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Copos medidores para água'
      },
      {
        nome: 'Mantas Térmicas',
        quantidade: Math.ceil(lotacaoPessoas / 2), // 1 para cada 2 pessoas
        tipo: 'pack',
        estado: 'OK',
        notas: `${Math.ceil(lotacaoPessoas / 2)} mantas - 1 para cada 2 pessoas`
      },

      // Equipamentos de pesca e reparação
      {
        nome: 'Kit de Pesca',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Linhas, anzóis e iscas artificiais'
      },
      {
        nome: 'Manual de Sobrevivência',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Manual ilustrado em português e inglês'
      },
      {
        nome: 'Tabela de Sinais de Salvamento',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Tabela internacional de sinais'
      },

      // Manutenção e reparação
      {
        nome: 'Fole de Enchimento',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Fole manual para manutenção de pressão'
      },
      {
        nome: 'Tampões para Furos',
        quantidade: 3,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Tampões cônicos para vedação de furos'
      },
      {
        nome: 'Kit de Reparação',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Cola e patches para reparação do tecido'
      },

      // Âncoras e cabos
      {
        nome: 'Âncora Flutuante',
        quantidade: 2,
        tipo: 'pack',
        estado: 'OK',
        notas: '2 âncoras para estabilização'
      },
      {
        nome: 'Anel com Linha',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        notas: 'Anel com linha flutuante de 30m'
      },

      // Sistema de iluminação
      {
        nome: 'Luz Interna RL6',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2031-05-15'),
        notas: 'Luz LED RL6 ativação automática por água - Bateria Litium incorporada - Validade até 05/2031'
      },
      {
        nome: 'Luz Externa RL6',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2031-05-15'),
        notas: 'Luz estroboscópica RL6 no dossel - Validade até 05/2031'
      },
      {
        nome: 'Bateria Litium RL6',
        quantidade: 1,
        tipo: 'pack',
        estado: 'OK',
        validade: new Date('2031-05-15'),
        notas: 'Bateria sobressalente RL6 para iluminação - Validade até 05/2031'
      }
    ];

    let componentesCount = 0;
    for (const comp of componentes) {
      await prisma.inspecaoComponente.create({
        data: {
          jangadaId: jangada.id,
          ...comp
        }
      });
      componentesCount++;
      console.log(`   ✓ ${comp.nome}: ${comp.quantidade} unidade(s)`);
    }
    console.log(`✅ ${componentesCount} componentes criados para a jangada`);

    // 5. CRIAR AGENDAMENTO
    console.log('\n5️⃣ Criando agendamento...');
    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: 'Inspeção Anual - ESPIRITO SANTO',
        descricao: 'Inspeção anual das jangadas',
        dataInicio: new Date('2025-01-10T09:00:00'),
        dataFim: new Date('2025-01-10T12:00:00'),
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'media',
        responsavel: 'Julio Correia',
        navioId: navio.id,
      }
    });
    console.log('✅ Agendamento criado');

    // 6. CRIAR CERTIFICADO
    console.log('\n6️⃣ Criando certificado...');
    const certificado = await prisma.certificado.create({
      data: {
        tipo: 'SOLAS',
        numero: `SOLAS-ESP-${timestamp}`,
        dataEmissao: new Date('2024-01-15'),
        dataValidade: new Date('2025-01-15'),
        entidadeEmissora: 'DGRM',
        status: 'ativo',
        navioId: navio.id,
      }
    });
    console.log('✅ Certificado criado');

    console.log('\n🎉 Exemplo criado com sucesso!');
    console.log('\n📊 Resumo Completo:');
    console.log(`   🛳️  Navio: ${navio.nome}`);
    console.log(`   🚣 Jangada: RFD SURVIVA MKIV - ${lotacaoPessoas} pessoas`);
    console.log(`   📅 Fabricação: Maio 2014`);
    console.log(`   📦 Pack: SOLAS A com ${componentesCount} componentes`);
    console.log(`   `);
    console.log(`   🔧 SISTEMA INSUFLAÇÃO LEAFIELD:`);
    console.log(`      • 1 Cilindro CO2 Leafield (8,800 kg - 0,440 kg CO2)`);
    console.log(`      • 1 Válvula de Alívio B10`);
    console.log(`      • 2 Tubos de Alta Pressão (câmara superior e inferior)`);
    console.log(`      • 2 Adaptadores para Câmaras (tipo A)`);
    console.log(`      • 1 Adaptador para Cilindro (tipo B)`);
    console.log(`   `);
    console.log(`   🎆 PIROTÉCNICOS (Validade: 06/2027):`);
    console.log(`      • 4 Foguetes paraquedas`);
    console.log(`      • 6 Fachos de mão`);
    console.log(`      • 2 Sinais de fumo`);
    console.log(`   `);
    console.log(`   🍽️  PROVISÕES (calculadas para ${lotacaoPessoas} pessoas):`);
    console.log(`      • ${lotacaoPessoas} Rações emergência (1 por pessoa) - Validade: 05/2029`);
    console.log(`      • ${lotacaoPessoas * 3} Embalagens água 0,5L (3 por pessoa = 1,5L total) - Validade: 05/2029`);
    console.log(`      • 2 Embalagens comprimidos enjoo (60 un cada = 120 total, 6 por pessoa) - Validade: 05/2028`);
    console.log(`      • ${lotacaoPessoas * 2} Sacos enjoo (2 por pessoa)`);
    console.log(`      • ${Math.ceil(lotacaoPessoas / 2)} Mantas térmicas (1 para cada 2 pessoas)`);
    console.log(`   `);
    console.log(`   ⚠️  NOTA: EPIRB, SART e Coletes salva-vidas estão associados ao navio`);
    console.log(`   `);
    console.log(`   📅 Agendamentos: 1`);
    console.log(`   📜 Certificados: 1`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  }
}

// Executar
criarExemploSimples()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });