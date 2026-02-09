import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('⚙️  Adicionando RFD SEASAVA X E R com especificações completas...\n');

  // Buscar marca RFD
  const rfd = await prisma.marcaJangada.findUnique({
    where: { nome: 'RFD' }
  });

  if (!rfd) {
    throw new Error('Marca RFD não encontrada! Execute o seed primeiro.');
  }

  // Buscar ou criar modelo SEASAVA X E R
  const seasavaXER = await prisma.modeloJangada.upsert({
    where: { 
      nome_marcaId: { 
        nome: 'SEASAVA X E R', 
        marcaId: rfd.id 
      } 
    },
    update: {
      sistemaInsuflacao: 'LEAFIELD',
      valvulasPadrao: 'A6, A7, A5, C7, D7, B10'
    },
    create: { 
      nome: 'SEASAVA X E R', 
      marcaId: rfd.id, 
      sistemaInsuflacao: 'LEAFIELD', 
      valvulasPadrao: 'A6, A7, A5, C7, D7, B10' 
    },
  });

  console.log(`✅ Modelo SEASAVA X E R: ${seasavaXER.id}`);

  // Definir todas as capacidades disponíveis (4-12P)
  // Sistema LEAFIELD com válvulas A6, A7, A5, C7, D7, B10
  // N2 calculado como ~3% do CO2 (padrão)
  const capacidades = [
    { pessoas: 4, cilindros: 1, co2: 1.580, n2: 0.05, ref: 'LEAF-4P' },
    { pessoas: 6, cilindros: 1, co2: 2.100, n2: 0.06, ref: 'LEAF-6P' },
    { pessoas: 8, cilindros: 1, co2: 2.800, n2: 0.08, ref: 'LEAF-8P' },
    { pessoas: 10, cilindros: 1, co2: 3.500, n2: 0.11, ref: 'LEAF-10P' },
    { pessoas: 12, cilindros: 1, co2: 4.170, n2: 0.13, ref: 'LEAF-12P' },
  ];

  // Adicionar especificações para cada capacidade
  for (const cap of capacidades) {
    const lotacao = await prisma.lotacaoJangada.findUnique({
      where: { capacidade: cap.pessoas }
    });

    if (!lotacao) {
      console.log(`⚠️  Lotação ${cap.pessoas}P não encontrada, pulando...`);
      continue;
    }

    await prisma.especificacaoTecnica.upsert({
      where: { 
        marcaId_modeloId_lotacaoId: { 
          marcaId: rfd.id, 
          modeloId: seasavaXER.id, 
          lotacaoId: lotacao.id 
        } 
      },
      update: {
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2,
        pesoN2: cap.n2,
        referenciaCilindro: cap.ref
      },
      create: { 
        marcaId: rfd.id, 
        modeloId: seasavaXER.id, 
        lotacaoId: lotacao.id, 
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2,
        pesoN2: cap.n2,
        referenciaCilindro: cap.ref
      },
    });

    console.log(`  ✓ ${cap.pessoas}P: ${cap.cilindros} cilindro(s), ${cap.co2} kg CO2, ${cap.n2} kg N2`);
  }

  // Adicionar pressões de trabalho
  console.log('\n⚙️  Configurando especificações de pressão...');
  
  // SEASAVA X E R usa sistema LEAFIELD - pressão similar ao MKIV (3.75 PSI)
  const pressoes = {
    psi: 3.75,
    mmwg: 2609.65,
    inh2o: 102.76,
    milibares: 510
  };

  console.log(`  ✓ Pressão: ${pressoes.psi} PSI / ${pressoes.mmwg} mmWG / ${pressoes.inh2o} inH2O / ${pressoes.milibares} mb`);

  // Especificações de Weak Link
  console.log('\n⚙️  Especificações Weak Link...');
  
  // Weak Link para sistema LEAFIELD (pressão mais alta)
  const weakLink = {
    throw_over_kn: 2.0,
    throw_over_lbf: 449.62
  };

  console.log(`  ✓ Throw-over: ${weakLink.throw_over_kn} kN (${weakLink.throw_over_lbf} lbf)`);

  // Adicionar testes de checklist (WP, NAP, FS)
  console.log('\n⚙️  Adicionando testes de checklist...');

  const testes = [
    {
      nome: 'WP - Working Pressure Test (SEASAVA X E R)',
      descricao: `Teste de pressão de trabalho a ${pressoes.psi} PSI (${pressoes.milibares} mb). Inflar até pressão nominal e verificar vedação por 60 minutos.`,
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 1
    },
    {
      nome: 'NAP - Additional Pressure Test (SEASAVA X E R)',
      descricao: `Teste de sobrepressão a ${(pressoes.psi * 1.5).toFixed(2)} PSI (${(pressoes.milibares * 1.5).toFixed(0)} mb). Manter por 3 horas sem perda superior a 5%.`,
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 2
    },
    {
      nome: 'FS - Floor Seam Test (SEASAVA X E R)',
      descricao: `Teste de vedação das costuras do piso. Inspeção visual e teste de pressão nas costuras do piso com ${pressoes.psi} PSI.`,
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 3
    }
  ];

  for (const teste of testes) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: { 
        nome: teste.nome,
        aplicavelModeloId: seasavaXER.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...teste,
          aplicavelModeloId: seasavaXER.id
        }
      });
      console.log(`  ✓ ${teste.nome}`);
    }
  }

  // Adicionar configurações de Contentor
  console.log('\n⚙️  Adicionando especificações de Contentor...');
  
  const contentorChecklist = [
    {
      nome: 'Inspeção Visual Contentor (SEASAVA X E R)',
      descricao: 'Verificar integridade do contentor de fibra de vidro. Sem rachaduras, corrosão ou danos estruturais.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 10
    },
    {
      nome: 'Sistema de Abertura Automática (SEASAVA X E R)',
      descricao: 'Testar mecanismo de abertura automática do contentor. Verificar weak link e sistema de ativação por imersão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 11
    },
    {
      nome: 'Vedação do Contentor (SEASAVA X E R)',
      descricao: 'Verificar vedação e estanquidade do contentor. Garantir proteção contra água e corrosão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 12
    }
  ];

  for (const item of contentorChecklist) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: { 
        nome: item.nome,
        aplicavelModeloId: seasavaXER.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...item,
          aplicavelModeloId: seasavaXER.id
        }
      });
      console.log(`  ✓ ${item.nome}`);
    }
  }

  // Adicionar configurações de Cintas de Fixação
  console.log('\n⚙️  Adicionando especificações de Cintas de Fixação...');
  
  const cintasChecklist = [
    {
      nome: 'Inspeção de Cintas de Fixação (SEASAVA X E R)',
      descricao: 'Verificar estado das cintas de nylon/poliéster. Sem cortes, desgaste excessivo ou degradação UV.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 13
    },
    {
      nome: 'Fivelas e Tensores das Cintas (SEASAVA X E R)',
      descricao: 'Inspecionar fivelas, argolas e tensores das cintas. Verificar funcionamento e ausência de corrosão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 14
    },
    {
      nome: 'Resistência das Cintas (SEASAVA X E R)',
      descricao: 'Teste de tração das cintas conforme SOLAS. Resistência mínima de 2.5 kN (250 kg) por cinta.',
      categoria: 'TESTE',
      frequencia: 'BIENAL',
      ordem: 15
    },
    {
      nome: 'Fixação ao Convés (SEASAVA X E R)',
      descricao: 'Verificar sistema de fixação das cintas ao convés ou berço. Ponteiras, olhais e parafusos sem corrosão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 16
    }
  ];

  for (const item of cintasChecklist) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: { 
        nome: item.nome,
        aplicavelModeloId: seasavaXER.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...item,
          aplicavelModeloId: seasavaXER.id
        }
      });
      console.log(`  ✓ ${item.nome}`);
    }
  }

  // Adicionar Spares ao Armazém
  console.log('\n⚙️  Adicionando Spares ao Armazém...');
  
  const spares = [
    // Válvulas LEAFIELD
    {
      nome: 'Válvula A6 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'A6',
      quantidade: 20,
      quantidadeMinima: 5,
      precoUnitario: 95.00
    },
    {
      nome: 'Válvula A7 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'A7',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 98.00
    },
    {
      nome: 'Válvula A5 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'A5',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 92.00
    },
    {
      nome: 'Válvula C7 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'C7',
      quantidade: 12,
      quantidadeMinima: 4,
      precoUnitario: 105.00
    },
    {
      nome: 'Válvula D7 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'D7',
      quantidade: 12,
      quantidadeMinima: 4,
      precoUnitario: 105.00
    },
    {
      nome: 'Válvula B10 (SEASAVA X E R)',
      categoria: 'Válvulas',
      refFabricante: 'B10-LEAF',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 75.00
    },
    
    // Cilindros CO2 LEAFIELD
    {
      nome: 'Cilindro CO2 1.580kg (SEASAVA X E R 4P)',
      categoria: 'Cilindros',
      refFabricante: 'LEAF-1.6',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 150.00
    },
    {
      nome: 'Cilindro CO2 2.100kg (SEASAVA X E R 6P)',
      categoria: 'Cilindros',
      refFabricante: 'LEAF-2.1',
      quantidade: 10,
      quantidadeMinima: 3,
      precoUnitario: 160.00
    },
    {
      nome: 'Cilindro CO2 2.800kg (SEASAVA X E R 8P)',
      categoria: 'Cilindros',
      refFabricante: 'LEAF-2.8',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 170.00
    },
    {
      nome: 'Cilindro CO2 3.500kg (SEASAVA X E R 10P)',
      categoria: 'Cilindros',
      refFabricante: 'LEAF-3.5',
      quantidade: 6,
      quantidadeMinima: 2,
      precoUnitario: 190.00
    },
    {
      nome: 'Cilindro CO2 4.170kg (SEASAVA X E R 12P)',
      categoria: 'Cilindros',
      refFabricante: 'LEAF-4.2',
      quantidade: 5,
      quantidadeMinima: 2,
      precoUnitario: 210.00
    },
    
    // Kits de Reparo
    {
      nome: 'Kit Reparo SEASAVA X E R (Geral)',
      categoria: 'Reparação',
      refFabricante: 'R-SEASAVA-XER',
      quantidade: 25,
      quantidadeMinima: 8,
      precoUnitario: 70.00
    },
    {
      nome: 'Patches Reparo SEASAVA XER (Tubo Principal)',
      categoria: 'Reparação',
      refFabricante: 'R-PATCH-TUBE-XER',
      quantidade: 50,
      quantidadeMinima: 15,
      precoUnitario: 5.00
    },
    {
      nome: 'Patches Reparo SEASAVA XER (Piso)',
      categoria: 'Reparação',
      refFabricante: 'R-PATCH-FLOOR-XER',
      quantidade: 40,
      quantidadeMinima: 12,
      precoUnitario: 4.20
    },
    
    // O-rings e Vedações LEAFIELD
    {
      nome: 'O-Ring Válvula A6',
      categoria: 'Vedações',
      refFabricante: 'OR-A6',
      quantidade: 100,
      quantidadeMinima: 25,
      precoUnitario: 2.80
    },
    {
      nome: 'O-Ring Válvula A7',
      categoria: 'Vedações',
      refFabricante: 'OR-A7',
      quantidade: 80,
      quantidadeMinima: 20,
      precoUnitario: 2.80
    },
    {
      nome: 'O-Ring Válvula C7/D7',
      categoria: 'Vedações',
      refFabricante: 'OR-C7D7',
      quantidade: 80,
      quantidadeMinima: 20,
      precoUnitario: 3.00
    },
    
    // Componentes Estruturais
    {
      nome: 'Weak Link 2.0kN (SEASAVA X E R)',
      categoria: 'Segurança',
      refFabricante: 'WL-2.0KN',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 50.00
    },
    {
      nome: 'Cinta de Fixação SEASAVA XER (Nylon)',
      categoria: 'Fixação',
      refFabricante: 'STRAP-NYLON-XER',
      quantidade: 20,
      quantidadeMinima: 8,
      precoUnitario: 32.00
    },
    {
      nome: 'Fivela para Cinta SEASAVA XER',
      categoria: 'Fixação',
      refFabricante: 'BUCKLE-XER',
      quantidade: 40,
      quantidadeMinima: 15,
      precoUnitario: 9.50
    },
    
    // Ferramentas Específicas LEAFIELD
    {
      nome: 'Chave Multiválvula LEAFIELD',
      categoria: 'Ferramentas',
      refFabricante: 'TOOL-LEAF-MULTI',
      quantidade: 5,
      quantidadeMinima: 2,
      precoUnitario: 45.00
    },
    {
      nome: 'Adaptador Insuflação LEAFIELD',
      categoria: 'Ferramentas',
      refFabricante: 'ADAPT-LEAFIELD',
      quantidade: 8,
      quantidadeMinima: 3,
      precoUnitario: 48.00
    },
    
    // Cola e Adesivos
    {
      nome: 'Cola Reparo SEASAVA XER (Tubo 120ml)',
      categoria: 'Reparação',
      refFabricante: 'GLUE-XER-120',
      quantidade: 30,
      quantidadeMinima: 10,
      precoUnitario: 20.00
    }
  ];

  let totalSpares = 0;
  let totalValor = 0;

  for (const spare of spares) {
    const existing = await prisma.stock.findFirst({
      where: {
        nome: spare.nome,
        categoria: spare.categoria
      }
    });

    if (!existing) {
      await prisma.stock.create({
        data: spare
      });
      totalSpares++;
      totalValor += spare.quantidade * spare.precoUnitario;
      console.log(`  ✓ ${spare.nome} - ${spare.quantidade} un. (€${spare.precoUnitario})`);
    }
  }

  console.log(`\n📦 Total: ${totalSpares} spares adicionados (€${totalValor.toFixed(2)})`);

  console.log('\n✅ RFD SEASAVA X E R configurado com sucesso!');
  console.log(`   - 5 capacidades (4-12P)`);
  console.log(`   - Sistema LEAFIELD com válvulas A6, A7, A5, C7, D7, B10`);
  console.log(`   - Pressão: ${pressoes.psi} PSI (maior que SEASAVA PLUS)`);
  console.log(`   - Weak Link: ${weakLink.throw_over_kn} kN (throw-over only)`);
  console.log(`   - 3 testes de pressão/vedação (WP, NAP, FS)`);
  console.log(`   - 3 inspeções de contentor`);
  console.log(`   - 4 inspeções/testes de cintas de fixação`);
  console.log(`   - ${totalSpares} spares adicionados ao armazém (€${totalValor.toFixed(2)})`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
