import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔄 Adicionando EUROVINIL LEISURE...\n');

  // 1. Encontrar marca EUROVINIL
  const marca = await prisma.marcaJangada.findFirst({
    where: { nome: { contains: 'EUROVINIL', mode: 'insensitive' } }
  });

  if (!marca) {
    throw new Error('❌ Marca EUROVINIL não encontrada! Execute add-marca-eurovinil.ts primeiro.');
  }

  console.log(`✅ Marca encontrada: ${marca.nome} (ID: ${marca.id})\n`);

  // 2. Criar modelo LEISURE
  const modelo = await prisma.modeloJangada.upsert({
    where: {
      nome_marcaId: {
        nome: 'LEISURE',
        marcaId: marca.id
      }
    },
    update: {},
    create: {
      marcaId: marca.id,
      nome: 'LEISURE',
      sistemaInsuflacao: 'VTE/87-PED',
      valvulasPadrao: 'SUPERNOVA, BRAVO 2005, PRV VA70'
    }
  });

  console.log(`✅ Modelo criado: ${modelo.nome} (ID: ${modelo.id})\n`);

  // 3. Capacidades e especificações (Tabela 3.3)
  const capacidades = [
    {
      pessoas: 4,
      cilindros: 1,
      co2_kg: 1.90,
      n2_kg: 0.13,
      thread: '17E',
      cylinder_pn: '10394046',
      valve_pn: '10388044'
    },
    {
      pessoas: 6,
      cilindros: 1,
      co2_kg: 2.20,
      n2_kg:  0.13,
      thread: '17E',
      cylinder_pn: '10394046',
      valve_pn: '10388044'
    },
    {
      pessoas: 8,
      cilindros: 1,
      co2_kg: 3.50,
      n2_kg: 0.20,
      thread: '17E',
      cylinder_pn: '10394046',
      valve_pn: '10388044'
    },
    {
      pessoas: 10,
      cilindros: 1,
      co2_kg: 3.80,
      n2_kg: 0.22,
      thread: '25E',
      cylinder_pn: '10394085',
      valve_pn: '10388044'
    },
    {
      pessoas: 12,
      cilindros: 1,
      co2_kg: 4.25,
      n2_kg: 0.27,
      thread: '25E',
      cylinder_pn: '10394086',
      valve_pn: '10388044'
    }
  ];

  // 4. Adicionar especificações técnicas
  for (const cap of capacidades) {
    const lotacao = await prisma.lotacaoJangada.findUnique({
      where: { capacidade: cap.pessoas }
    });

    if (!lotacao) {
      console.log(`⚠️  Lotação ${cap.pessoas}P não encontrada, pulando...`);
      continue;
    }

    const referenciaDetalhada = {
      cilindros: [
        {
          referencia: cap.cylinder_pn,
          capacidade: `${cap.pessoas}P`,
          peso_co2: cap.co2_kg,
          peso_n2: cap.n2_kg,
          pressao_enchimento: 200
        }
      ],
      valvulas: [
        {
          modelo: 'SUPERNOVA',
          fabricante: 'Eurovinil',
          torques: { aperto: 25, desaperto: 25 }
        },
        {
          modelo: 'BRAVO 2005',
          fabricante: 'Eurovinil',
          torques: { aperto: 25, desaperto: 25 }
        },
        {
          modelo: 'PRV VA70',
          fabricante: 'Eurovinil',
          torques: { aperto: 25, desaperto: 25 }
        }
      ],
      sistema_insuflacao: {
        tipo: 'VTE/87-PED',
        thread: cap.thread,
        operating_head_torque_nm: 40,
        wrench_torque_nm: 100
      }
    };

    await prisma.especificacaoTecnica.upsert({
      where: {
        marcaId_modeloId_lotacaoId: {
          marcaId: marca.id,
          modeloId: modelo.id,
          lotacaoId: lotacao.id
        }
      },
      update: {
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2_kg,
        pesoN2: cap.n2_kg,
        referenciaCilindro: JSON.stringify(referenciaDetalhada),
        sistemaInsuflacao: `VTE/87-PED | Thread ${cap.thread}`,
        tiposValvulas: 'SUPERNOVA (10399310), BRAVO 2005 (99101109), PRV VA70 (10359166)'
      },
      create: {
        marcaId: marca.id,
        modeloId: modelo.id,
        lotacaoId: lotacao.id,
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2_kg,
        pesoN2: cap.n2_kg,
        referenciaCilindro: JSON.stringify(referenciaDetalhada),
        sistemaInsuflacao: `VTE/87-PED | Thread ${cap.thread}`,
        tiposValvulas: 'SUPERNOVA (10399310), BRAVO 2005 (99101109), PRV VA70 (10359166)'
      }
    });

    console.log(`  ✓ ${cap.pessoas}P: ${cap.co2_kg}kg CO2 + ${cap.n2_kg}kg N2 | Thread ${cap.thread} | P/N ${cap.cylinder_pn}`);
  }

  // 5. Checklist items (mesmo padrão SEASAVA)
  console.log('\n📋 Adicionando checklist items...');

  const checklistItems = [
    // TESTES (3 items)
    {
      nome: 'WP - Working Pressure Test (LEISURE)',
      descricao: 'Verificar pressão de trabalho 0.22-0.35 bar (3.19-5.08 PSI)',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 1
    },
    {
      nome: 'NAP - Additional Pressure Test (LEISURE)',
      descricao: 'Teste de pressão adicional necessária conforme ISO',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 2
    },
    {
      nome: 'FS - Floor Seam Test (LEISURE)',
      descricao: 'Teste de resistência das costuras do piso',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 3
    },
    
    // CONTENTOR (3 items)
    {
      nome: 'Inspeção Visual Contentor (LEISURE)',
      descricao: 'Verificar contentor VTR/ABS/Valise - sem danos, rachaduras ou corrosão',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 4
    },
    {
      nome: 'Sistema Abertura Automática (LEISURE)',
      descricao: 'Testar sistema de abertura automática com weak link',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 5
    },
    {
      nome: 'Vedação Contentor (LEISURE)',
      descricao: 'Verificar vedação e estanqueidade (selo intacto)',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 6
    },
    
    // CINTAS (4 items)
    {
      nome: 'Inspeção Cintas (LEISURE)',
      descricao: 'Verificar cintas P/N 10304222 (4P-6P) ou 10304232 (8P-12P) - sem desgaste ou cortes',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 7
    },
    {
      nome: 'Fivelas e Tensores (LEISURE)',
      descricao: 'Verificar fivelas e tensores - funcionamento correto, sem corrosão',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 8
    },
    {
      nome: 'Teste Resistência Cintas (LEISURE)',
      descricao: 'Teste de tração das cintas - mínimo 2.5 kN',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 9
    },
    {
      nome: 'Fixação Convés (LEISURE)',
      descricao: 'Verificar pontos de fixação ao convés - seguros e sem folgas',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 10
    }
  ];

  for (const item of checklistItems) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: {
        nome: item.nome,
        aplicavelModeloId: modelo.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...item,
          aplicavelModeloId: modelo.id
        }
      });
      console.log(`  ✓ ${item.nome}`);
    }
  }

  console.log(`✅ ${checklistItems.length} checklist items adicionados\n`);

  // 6. Spares (baseado no padrão SEASAVA + válvulas EUROVINIL)
  console.log('📦 Adicionando spares ao armazém...\n');

  const spares = [
    // VÁLVULAS EUROVINIL (3 tipos)
    {
      nome: 'Válvula SUPERNOVA Inflation/Deflation',
      partNumber: '10399310',
      categoria: 'Válvulas',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 20,
      precoUnitario: 125.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-V01'
    },
    {
      nome: 'Válvula BRAVO 2005 Inflation/Deflation',
      partNumber: '99101109',
      categoria: 'Válvulas',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 15,
      precoUnitario: 95.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-V02'
    },
    {
      nome: 'Válvula PRV VA70 (Pressure Relief)',
      partNumber: '10359166',
      categoria: 'Válvulas',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 15,
      precoUnitario: 85.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-V03'
    },

    // CILINDROS (por capacidade - 5 tipos)
    {
      nome: 'Cilindro CO2 4P - 1.90kg CO2 + 0.13kg N2 (17E)',
      partNumber: '10394046',
      categoria: 'Cilindros',
      aplicacao: 'EUROVINIL LEISURE 4P/6P',
      quantidade: 8,
      precoUnitario: 180.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-C-C01'
    },
    {
      nome: 'Cilindro CO2 8P - 3.50kg CO2 + 0.20kg N2 (17E)',
      partNumber: '10394046-8P',
      categoria: 'Cilindros',
      aplicacao: 'EUROVINIL LEISURE 8P',
      quantidade: 6,
      precoUnitario: 220.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-C-C02'
    },
    {
      nome: 'Cilindro CO2 10P - 3.80kg CO2 + 0.22kg N2 (25E)',
      partNumber: '10394085',
      categoria: 'Cilindros',
      aplicacao: 'EUROVINIL LEISURE 10P',
      quantidade: 5,
      precoUnitario: 235.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-C-C03'
    },
    {
      nome: 'Cilindro CO2 12P - 4.25kg CO2 + 0.27kg N2 (25E)',
      partNumber: '10394086',
      categoria: 'Cilindros',
      aplicacao: 'EUROVINIL LEISURE 12P',
      quantidade: 5,
      precoUnitario: 250.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-C-C04'
    },

    // OPERATING HEADS E COMPONENTES
    {
      nome: 'Operating Head VTE/87-PED',
      partNumber: '10399424',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 10,
      precoUnitario: 95.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OH01'
    },
    {
      nome: 'Activation Cable VTE/87',
      partNumber: '10399594',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 15,
      precoUnitario: 28.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-CB01'
    },
    {
      nome: 'Obturator VTE/87-PED',
      partNumber: '99201312',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 12,
      precoUnitario: 18.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OB01'
    },

    // KITS DE REPARO
    {
      nome: 'Kit Reparo Geral EUROVINIL',
      partNumber: 'KIT-REP-EUV-001',
      categoria: 'Kits Reparo',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 25,
      precoUnitario: 68.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-R-K01'
    },
    {
      nome: 'Patches Tubo (pack 10 unidades)',
      partNumber: 'KIT-PATCH-TUBE-10',
      categoria: 'Kits Reparo',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 50,
      precoUnitario: 4.80,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-R-P01'
    },
    {
      nome: 'Patches Piso (pack 10 unidades)',
      partNumber: 'KIT-PATCH-FLOOR-10',
      categoria: 'Kits Reparo',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 40,
      precoUnitario: 4.20,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-R-P02'
    },

    // O-RINGS E GASKETS
    {
      nome: 'O-Ring SUPERNOVA (pack 10)',
      partNumber: '10399292-10',
      categoria: 'O-Rings',
      aplicacao: 'Válvula SUPERNOVA',
      quantidade: 100,
      precoUnitario: 2.50,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OR01'
    },
    {
      nome: 'Gasket OR-2087',
      partNumber: '99182145',
      categoria: 'O-Rings',
      aplicacao: 'VTE/87-PED',
      quantidade: 80,
      precoUnitario: 1.80,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OR02'
    },
    {
      nome: 'Gasket OR-106',
      partNumber: '99182147',
      categoria: 'O-Rings',
      aplicacao: 'CVT09 Connector',
      quantidade: 80,
      precoUnitario: 1.50,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OR03'
    },

    // COMPONENTES ESTRUTURAIS
    {
      nome: 'Weak Link 1.5 kN (4P-6P)',
      partNumber: 'WL-1.5KN-EUV',
      categoria: 'Weak Links',
      aplicacao: 'EUROVINIL LEISURE 4P-6P',
      quantidade: 15,
      precoUnitario: 42.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-WL01'
    },
    {
      nome: 'Weak Link 1.8 kN (8P-10P)',
      partNumber: 'WL-1.8KN-EUV',
      categoria: 'Weak Links',
      aplicacao: 'EUROVINIL LEISURE 8P-10P',
      quantidade: 15,
      precoUnitario: 45.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-WL02'
    },
    {
      nome: 'Weak Link 2.0 kN (12P)',
      partNumber: 'WL-2.0KN-EUV',
      categoria: 'Weak Links',
      aplicacao: 'EUROVINIL LEISURE 12P',
      quantidade: 10,
      precoUnitario: 48.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-WL03'
    },
    {
      nome: 'Lashing Straps 4P-6P',
      partNumber: '10304222',
      categoria: 'Cintas',
      aplicacao: 'EUROVINIL LEISURE 4P-6P',
      quantidade: 20,
      precoUnitario: 32.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-ST01'
    },
    {
      nome: 'Lashing Straps 8P-12P',
      partNumber: '10304232',
      categoria: 'Cintas',
      aplicacao: 'EUROVINIL LEISURE 8P-12P',
      quantidade: 20,
      precoUnitario: 38.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-ST02'
    },
    {
      nome: 'Strap Crimps',
      partNumber: '9R41423002',
      categoria: 'Cintas',
      aplicacao: 'EUROVINIL LEISURE',
      quantidade: 50,
      precoUnitario: 8.50,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-E-CR01'
    },

    // FERRAMENTAS ESPECÍFICAS
    {
      nome: 'Chave 27mm para VTE/87-PED',
      partNumber: 'WRENCH-27MM-VTE87',
      categoria: 'Ferramentas',
      aplicacao: 'VTE/87-PED',
      quantidade: 5,
      precoUnitario: 38.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-F-W01'
    },
    {
      nome: 'Rearming Tool VTE/87',
      partNumber: '99990985',
      categoria: 'Ferramentas',
      aplicacao: 'VTE/87-PED',
      quantidade: 3,
      precoUnitario: 125.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-F-RT01'
    },

    // COLA E MATERIAIS
    {
      nome: 'Cola PVC EUROVINIL 120ml',
      partNumber: 'GLUE-PVC-EUV-120',
      categoria: 'Materiais',
      aplicacao: 'Reparos PVC',
      quantidade: 30,
      precoUnitario: 22.00,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-M-G01'
    }
  ];

  let totalValue = 0;
  for (const spare of spares) {
    const stock = await prisma.stock.upsert({
      where: {
        nome_categoria: {
          nome: spare.nome,
          categoria: spare.categoria
        }
      },
      update: {
        descricao: spare.aplicacao,
        quantidade: spare.quantidade,
        precoUnitario: spare.precoUnitario,
        fornecedor: spare.fornecedor,
        localizacao: spare.localizacao,
        refFabricante: spare.partNumber
      },
      create: {
        nome: spare.nome,
        descricao: spare.aplicacao,
        categoria: spare.categoria,
        quantidade: spare.quantidade,
        precoUnitario: spare.precoUnitario,
        fornecedor: spare.fornecedor,
        localizacao: spare.localizacao,
        refFabricante: spare.partNumber
      }
    });
    
    const itemValue = spare.quantidade * spare.precoUnitario;
    totalValue += itemValue;
    
    console.log(`  ✓ ${spare.nome}`);
    console.log(`    P/N: ${spare.partNumber} | Qtd: ${spare.quantidade} | €${spare.precoUnitario} | Total: €${itemValue.toFixed(2)}`);
  }

  console.log(`\n✅ ${spares.length} spares adicionados`);
  console.log(`💰 Valor total em stock: €${totalValue.toFixed(2)}\n`);

  console.log('🎉 EUROVINIL LEISURE adicionado com sucesso!\n');
  console.log('📊 RESUMO:');
  console.log(`   - Modelo: ${modelo.nome}`);
  console.log(`   - Capacidades: 4P, 6P, 8P, 10P, 12P`);
  console.log(`   - Sistema: VTE/87-PED (17E/25E)`);
  console.log(`   - Pressão: 4.0 PSI / 0.276 bar`);
  console.log(`   - Weak Link: 1.5-2.0 kN (throw-over only)`);
  console.log(`   - Checklist: ${checklistItems.length} items`);
  console.log(`   - Spares: ${spares.length} items (€${totalValue.toFixed(2)})`);
}

main()
  .catch(async (e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
