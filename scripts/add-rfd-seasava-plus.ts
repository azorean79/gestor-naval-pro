import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('⚙️  Adicionando RFD SEASAVA PLUS com especificações completas...\n');

  // Buscar marca RFD
  const rfd = await prisma.marcaJangada.findUnique({
    where: { nome: 'RFD' }
  });

  if (!rfd) {
    throw new Error('Marca RFD não encontrada! Execute o seed primeiro.');
  }

  // Buscar ou criar modelo SEASAVA PLUS
  const seasavaPlus = await prisma.modeloJangada.upsert({
    where: { 
      nome_marcaId: { 
        nome: 'SEASAVA PLUS', 
        marcaId: rfd.id 
      } 
    },
    update: {
      sistemaInsuflacao: 'THANNER',
      valvulasPadrao: 'OTS65, A10, B10'
    },
    create: { 
      nome: 'SEASAVA PLUS', 
      marcaId: rfd.id, 
      sistemaInsuflacao: 'THANNER', 
      valvulasPadrao: 'OTS65, A10, B10' 
    },
  });

  console.log(`✅ Modelo SEASAVA PLUS: ${seasavaPlus.id}`);

  // Definir todas as capacidades disponíveis (4-12P)
  // Valores corrigidos: 4P=1.400kg CO2, 8P=2.500kg CO2
  // N2 calculado como ~3% do CO2 (padrão THANNER)
  const capacidades = [
    { pessoas: 4, cilindros: 1, co2: 1.400, n2: 0.04, ref: '08719009' },
    { pessoas: 6, cilindros: 1, co2: 1.980, n2: 0.06, ref: '08719009' },
    { pessoas: 8, cilindros: 1, co2: 2.500, n2: 0.08, ref: '08719009' },
    { pessoas: 10, cilindros: 1, co2: 3.960, n2: 0.12, ref: '08719009' },
    { pessoas: 12, cilindros: 1, co2: 9.380, n2: 0.29, ref: '08719009' },
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
          modeloId: seasavaPlus.id, 
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
        modeloId: seasavaPlus.id, 
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
  
  // SEASAVA PLUS usa sistema THANNER - mesma pressão do MKIII (2.8 PSI)
  const pressoes = {
    psi: 2.8,
    mmwg: 1968.59,
    inh2o: 77.51,
    milibares: 193
  };

  console.log(`  ✓ Pressão: ${pressoes.psi} PSI / ${pressoes.mmwg} mmWG / ${pressoes.inh2o} inH2O / ${pressoes.milibares} mb`);

  // Especificações de Weak Link
  console.log('\n⚙️  Especificações Weak Link...');
  
  // Weak Link típico para sistema THANNER
  const weakLink = {
    throw_over_kn: 1.8,
    throw_over_lbf: 404.66
  };

  console.log(`  ✓ Throw-over: ${weakLink.throw_over_kn} kN (${weakLink.throw_over_lbf} lbf)`);

  // Adicionar testes de checklist (WP, NAP, B)
  console.log('\n⚙️  Adicionando testes de checklist...');

  const testes = [
    {
      nome: 'WP - Working Pressure Test (SEASAVA PLUS)',
      descricao: `Teste de pressão de trabalho a ${pressoes.psi} PSI (${pressoes.milibares} mb). Inflar até pressão nominal e verificar vedação por 60 minutos.`,
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 1
    },
    {
      nome: 'NAP - Additional Pressure Test (SEASAVA PLUS)',
      descricao: `Teste de sobrepressão a ${(pressoes.psi * 1.5).toFixed(2)} PSI (${(pressoes.milibares * 1.5).toFixed(0)} mb). Manter por 3 horas sem perda superior a 5%.`,
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 2
    },
    {
      nome: 'FS - Floor Seam Test (SEASAVA PLUS)',
      descricao: 'Teste de vedação das costuras do piso. Inspeção visual e teste de pressão nas costuras do piso com ${pressoes.psi} PSI.',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 3
    }
  ];

  for (const teste of testes) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: { 
        nome: teste.nome,
        aplicavelModeloId: seasavaPlus.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...teste,
          aplicavelModeloId: seasavaPlus.id
        }
      });
      console.log(`  ✓ ${teste.nome}`);
    }
  }

  // Adicionar configurações de Contentor
  console.log('\n⚙️  Adicionando especificações de Contentor...');
  
  const contentorChecklist = [
    {
      nome: 'Inspeção Visual Contentor (SEASAVA PLUS)',
      descricao: 'Verificar integridade do contentor de fibra de vidro. Sem rachaduras, corrosão ou danos estruturais.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 10
    },
    {
      nome: 'Sistema de Abertura Automática (SEASAVA PLUS)',
      descricao: 'Testar mecanismo de abertura automática do contentor. Verificar weak link e sistema de ativação por imersão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 11
    },
    {
      nome: 'Vedação do Contentor (SEASAVA PLUS)',
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
        aplicavelModeloId: seasavaPlus.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...item,
          aplicavelModeloId: seasavaPlus.id
        }
      });
      console.log(`  ✓ ${item.nome}`);
    }
  }

  // Adicionar configurações de Cintas de Fixação
  console.log('\n⚙️  Adicionando especificações de Cintas de Fixação...');
  
  const cintasChecklist = [
    {
      nome: 'Inspeção de Cintas de Fixação (SEASAVA PLUS)',
      descricao: 'Verificar estado das cintas de nylon/poliéster. Sem cortes, desgaste excessivo ou degradação UV.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 13
    },
    {
      nome: 'Fivelas e Tensores das Cintas (SEASAVA PLUS)',
      descricao: 'Inspecionar fivelas, argolas e tensores das cintas. Verificar funcionamento e ausência de corrosão.',
      categoria: 'INSPEÇÃO',
      frequencia: 'ANUAL',
      ordem: 14
    },
    {
      nome: 'Resistência das Cintas (SEASAVA PLUS)',
      descricao: 'Teste de tração das cintas conforme SOLAS. Resistência mínima de 2.5 kN (250 kg) por cinta.',
      categoria: 'TESTE',
      frequencia: 'BIENAL',
      ordem: 15
    },
    {
      nome: 'Fixação ao Convés (SEASAVA PLUS)',
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
        aplicavelModeloId: seasavaPlus.id
      }
    });

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: {
          ...item,
          aplicavelModeloId: seasavaPlus.id
        }
      });
      console.log(`  ✓ ${item.nome}`);
    }
  }

  // Adicionar Spares ao Armazém
  console.log('\n⚙️  Adicionando Spares ao Armazém...');
  
  const spares = [
    // Válvulas THANNER
    {
      nome: 'Válvula OTS65 (SEASAVA PLUS)',
      categoria: 'Válvulas',
      refFabricante: 'OTS65',
      quantidade: 20,
      quantidadeMinima: 5,
      precoUnitario: 120.00
    },
    {
      nome: 'Válvula A10 (SEASAVA PLUS)',
      categoria: 'Válvulas',
      refFabricante: 'A10',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 85.00
    },
    {
      nome: 'Válvula B10 (SEASAVA PLUS)',
      categoria: 'Válvulas',
      refFabricante: 'B10',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 75.00
    },
    
    // Cilindros CO2
    {
      nome: 'Cilindro CO2 1.400kg (SEASAVA PLUS 4P)',
      categoria: 'Cilindros',
      refFabricante: '08719009-1.4',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 145.00
    },
    {
      nome: 'Cilindro CO2 1.980kg (SEASAVA PLUS 6P)',
      categoria: 'Cilindros',
      refFabricante: '08719009-2.0',
      quantidade: 10,
      quantidadeMinima: 3,
      precoUnitario: 155.00
    },
    {
      nome: 'Cilindro CO2 2.500kg (SEASAVA PLUS 8P)',
      categoria: 'Cilindros',
      refFabricante: '08719009-2.5',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 165.00
    },
    {
      nome: 'Cilindro CO2 3.960kg (SEASAVA PLUS 10P)',
      categoria: 'Cilindros',
      refFabricante: '08719009-4.0',
      quantidade: 6,
      quantidadeMinima: 2,
      precoUnitario: 185.00
    },
    {
      nome: 'Cilindro CO2 9.380kg (SEASAVA PLUS 12P)',
      categoria: 'Cilindros',
      refFabricante: '08719009-9.4',
      quantidade: 5,
      quantidadeMinima: 2,
      precoUnitario: 285.00
    },
    
    // Kits de Reparo
    {
      nome: 'Kit Reparo SEASAVA PLUS (Geral)',
      categoria: 'Reparação',
      refFabricante: 'R-SEASAVA-01',
      quantidade: 25,
      quantidadeMinima: 8,
      precoUnitario: 65.00
    },
    {
      nome: 'Patches Reparo SEASAVA (Tubo Principal)',
      categoria: 'Reparação',
      refFabricante: 'R-PATCH-TUBE',
      quantidade: 50,
      quantidadeMinima: 15,
      precoUnitario: 4.50
    },
    {
      nome: 'Patches Reparo SEASAVA (Piso)',
      categoria: 'Reparação',
      refFabricante: 'R-PATCH-FLOOR',
      quantidade: 40,
      quantidadeMinima: 12,
      precoUnitario: 3.80
    },
    
    // O-rings e Vedações
    {
      nome: 'O-Ring Válvula OTS65',
      categoria: 'Vedações',
      refFabricante: 'OR-OTS65',
      quantidade: 100,
      quantidadeMinima: 25,
      precoUnitario: 2.50
    },
    {
      nome: 'O-Ring Válvula A10',
      categoria: 'Vedações',
      refFabricante: 'OR-A10',
      quantidade: 80,
      quantidadeMinima: 20,
      precoUnitario: 2.20
    },
    {
      nome: 'O-Ring Válvula B10',
      categoria: 'Vedações',
      refFabricante: 'OR-B10',
      quantidade: 80,
      quantidadeMinima: 20,
      precoUnitario: 2.20
    },
    
    // Componentes Estruturais
    {
      nome: 'Weak Link 1.8kN (SEASAVA PLUS)',
      categoria: 'Segurança',
      refFabricante: 'WL-1.8KN',
      quantidade: 15,
      quantidadeMinima: 5,
      precoUnitario: 45.00
    },
    {
      nome: 'Cinta de Fixação SEASAVA (Nylon)',
      categoria: 'Fixação',
      refFabricante: 'STRAP-NYLON-25',
      quantidade: 20,
      quantidadeMinima: 8,
      precoUnitario: 28.00
    },
    {
      nome: 'Fivela para Cinta SEASAVA',
      categoria: 'Fixação',
      refFabricante: 'BUCKLE-STD',
      quantidade: 40,
      quantidadeMinima: 15,
      precoUnitario: 8.50
    },
    
    // Ferramentas Específicas
    {
      nome: 'Chave Válvula OTS65',
      categoria: 'Ferramentas',
      refFabricante: 'TOOL-OTS65',
      quantidade: 5,
      quantidadeMinima: 2,
      precoUnitario: 35.00
    },
    {
      nome: 'Adaptador Insuflação THANNER',
      categoria: 'Ferramentas',
      refFabricante: 'ADAPT-THANNER',
      quantidade: 8,
      quantidadeMinima: 3,
      precoUnitario: 42.00
    },
    
    // Cola e Adesivos
    {
      nome: 'Cola Reparo SEASAVA (Tubo 120ml)',
      categoria: 'Reparação',
      refFabricante: 'GLUE-SEASAVA-120',
      quantidade: 30,
      quantidadeMinima: 10,
      precoUnitario: 18.00
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

  console.log('\n✅ RFD SEASAVA PLUS configurado com sucesso!');
  console.log(`   - 5 capacidades (4-12P)`);
  console.log(`   - Sistema THANNER com válvulas OTS65, A10, B10`);
  console.log(`   - Pressão: ${pressoes.psi} PSI`);
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
