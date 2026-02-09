import { prisma } from '../src/lib/prisma'

type Capacidade = {
  pessoas: number
  cilindros: number
  co2_kg: number
  n2_kg: number
  thread: string
  cylinder_pn: string
  valve_pn: string
}

async function addChecklist(modeloId: string, modeloNome: string) {
  const checklistItems = [
    {
      nome: `WP - Working Pressure Test (${modeloNome})`,
      descricao: 'Verificar pressao de trabalho 0.22-0.35 bar (3.19-5.08 PSI)',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 1
    },
    {
      nome: `NAP - Additional Pressure Test (${modeloNome})`,
      descricao: 'Teste de pressao adicional necessaria conforme ISO',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 2
    },
    {
      nome: `FS - Floor Seam Test (${modeloNome})`,
      descricao: 'Teste de resistencia das costuras do piso',
      categoria: 'TESTE',
      frequencia: 'ANUAL',
      ordem: 3
    },
    {
      nome: `Inspecao Visual Contentor (${modeloNome})`,
      descricao: 'Verificar contentor VTR/ABS/Valise - sem danos, rachaduras ou corrosao',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 4
    },
    {
      nome: `Sistema Abertura Automatica (${modeloNome})`,
      descricao: 'Testar sistema de abertura automatica com weak link',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 5
    },
    {
      nome: `Vedacao Contentor (${modeloNome})`,
      descricao: 'Verificar vedacao e estanqueidade (selo intacto)',
      categoria: 'CONTENTOR',
      frequencia: 'ANUAL',
      ordem: 6
    },
    {
      nome: `Inspecao Cintas (${modeloNome})`,
      descricao: 'Verificar cintas P/N 10304222 (4P-6P) ou 10304232 (8P-12P) - sem desgaste ou cortes',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 7
    },
    {
      nome: `Fivelas e Tensores (${modeloNome})`,
      descricao: 'Verificar fivelas e tensores - funcionamento correto, sem corrosao',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 8
    },
    {
      nome: `Teste Resistencia Cintas (${modeloNome})`,
      descricao: 'Teste de tracao das cintas - minimo 2.5 kN',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 9
    },
    {
      nome: `Fixacao Conves (${modeloNome})`,
      descricao: 'Verificar pontos de fixacao ao conves - seguros e sem folgas',
      categoria: 'CINTAS',
      frequencia: 'ANUAL',
      ordem: 10
    }
  ]

  for (const item of checklistItems) {
    const existing = await prisma.checklistInspecao.findFirst({
      where: { nome: item.nome, aplicavelModeloId: modeloId }
    })

    if (!existing) {
      await prisma.checklistInspecao.create({
        data: { ...item, aplicavelModeloId: modeloId }
      })
    }
  }
}

async function addModel(params: {
  marcaId: string
  nome: string
  sistemaInsuflacao: string
  valvulasPadrao: string
  capacidades: Capacidade[]
}) {
  const modelo = await prisma.modeloJangada.upsert({
    where: {
      nome_marcaId: { nome: params.nome, marcaId: params.marcaId }
    },
    update: {
      sistemaInsuflacao: params.sistemaInsuflacao,
      valvulasPadrao: params.valvulasPadrao
    },
    create: {
      marcaId: params.marcaId,
      nome: params.nome,
      sistemaInsuflacao: params.sistemaInsuflacao,
      valvulasPadrao: params.valvulasPadrao
    }
  })

  console.log(`✅ Modelo criado: ${modelo.nome} (ID: ${modelo.id})`)

  for (const cap of params.capacidades) {
    const lotacao = await prisma.lotacaoJangada.findUnique({
      where: { capacidade: cap.pessoas }
    })

    if (!lotacao) {
      console.log(`⚠️  Lotacao ${cap.pessoas}P nao encontrada, pulando...`)
      continue
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
        { modelo: 'SUPERNOVA', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } },
        { modelo: 'PRV VA70', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } }
      ],
      sistema_insuflacao: {
        tipo: 'VTE/99-ISO',
        thread: cap.thread,
        wrench_torque_nm: 130
      }
    }

    await prisma.especificacaoTecnica.upsert({
      where: {
        marcaId_modeloId_lotacaoId: {
          marcaId: params.marcaId,
          modeloId: modelo.id,
          lotacaoId: lotacao.id
        }
      },
      update: {
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2_kg,
        pesoN2: cap.n2_kg,
        referenciaCilindro: JSON.stringify(referenciaDetalhada),
        sistemaInsuflacao: `VTE/99-ISO | Thread ${cap.thread}`,
        tiposValvulas: params.valvulasPadrao
      },
      create: {
        marcaId: params.marcaId,
        modeloId: modelo.id,
        lotacaoId: lotacao.id,
        quantidadeCilindros: cap.cilindros,
        pesoCO2: cap.co2_kg,
        pesoN2: cap.n2_kg,
        referenciaCilindro: JSON.stringify(referenciaDetalhada),
        sistemaInsuflacao: `VTE/99-ISO | Thread ${cap.thread}`,
        tiposValvulas: params.valvulasPadrao
      }
    })

    console.log(`  ✓ ${cap.pessoas}P: ${cap.co2_kg}kg CO2 + ${cap.n2_kg}kg N2 | Thread ${cap.thread}`)
  }

  await addChecklist(modelo.id, params.nome)
}

async function addSpares() {
  const spares = [
    {
      nome: 'Operating Head VTE/99-ISO',
      partNumber: '10388043',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 10,
      precoUnitario: 110.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OH02'
    },
    {
      nome: 'Activation Cable VTE/99',
      partNumber: '10399596',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 15,
      precoUnitario: 32.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-CB02'
    },
    {
      nome: 'Obturator VTE/99-ISO',
      partNumber: '99201319',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 12,
      precoUnitario: 20.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-OB02'
    },
    {
      nome: 'Valve V1 (1 NGT)',
      partNumber: '10388044',
      categoria: 'Valvulas',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 12,
      precoUnitario: 120.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-V04'
    },
    {
      nome: 'Valve V1W (25E)',
      partNumber: '10388045',
      categoria: 'Valvulas',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 12,
      precoUnitario: 125.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-V05'
    },
    {
      nome: 'Plummer (cylinders up to 7L)',
      partNumber: '99201015',
      categoria: 'Componentes Sistema',
      aplicacao: 'EUROVINIL SYNTESY',
      quantidade: 10,
      precoUnitario: 22.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-A-PL01'
    },
    {
      nome: 'Chave 35mm para VTE/99',
      partNumber: 'WRENCH-35MM-VTE99',
      categoria: 'Ferramentas',
      aplicacao: 'VTE/99-ISO',
      quantidade: 5,
      precoUnitario: 45.0,
      fornecedor: 'Eurovinil S.p.A.',
      localizacao: 'ARMAZEM-F-W02'
    }
  ]

  for (const spare of spares) {
    await prisma.stock.upsert({
      where: {
        nome_categoria: { nome: spare.nome, categoria: spare.categoria }
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
    })
  }
}

async function main() {
  console.log('🔄 Adicionando EUROVINIL SYNTESY 9650-1 e 9650-2...\n')

  const marca = await prisma.marcaJangada.findFirst({
    where: { nome: { contains: 'EUROVINIL', mode: 'insensitive' } }
  })

  if (!marca) {
    throw new Error('❌ Marca EUROVINIL nao encontrada! Execute add-marca-eurovinil.ts primeiro.')
  }

  const capacidades9650_1: Capacidade[] = [
    { pessoas: 4, cilindros: 1, co2_kg: 1.90, n2_kg: 0.13, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 6, cilindros: 1, co2_kg: 3.10, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 8, cilindros: 1, co2_kg: 3.50, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 10, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10394085', valve_pn: '10388045' },
    { pessoas: 12, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10382074', valve_pn: '10388045' }
  ]

  const capacidades9650_2: Capacidade[] = [
    { pessoas: 4, cilindros: 1, co2_kg: 1.90, n2_kg: 0.13, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 6, cilindros: 1, co2_kg: 3.10, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 8, cilindros: 1, co2_kg: 3.50, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044' },
    { pessoas: 10, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10394085', valve_pn: '10388045' }
  ]

  await addModel({
    marcaId: marca.id,
    nome: 'SYNTESY 9650-1',
    sistemaInsuflacao: 'VTE/99-ISO/V1',
    valvulasPadrao: 'SUPERNOVA (10399310), PRV VA70 (10359166)',
    capacidades: capacidades9650_1
  })

  await addModel({
    marcaId: marca.id,
    nome: 'SYNTESY 9650-2',
    sistemaInsuflacao: 'VTE/99-ISO',
    valvulasPadrao: 'SUPERNOVA (10399310), PRV VA70 (10359166)',
    capacidades: capacidades9650_2
  })

  await addSpares()

  console.log('\n✅ EUROVINIL SYNTESY adicionados com sucesso!')
}

main().catch((e) => {
  console.error('❌ Erro:', e)
  process.exit(1)
})
