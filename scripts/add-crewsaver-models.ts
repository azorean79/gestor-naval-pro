import { prisma } from '../src/lib/prisma'

type Capacidade = {
  pessoas: number
  cilindros: number
  co2_kg: number
  n2_kg: number
  thread?: string
  cylinder_pn?: string
  valve_pn?: string
  strap_pn?: string
  sistema: 'VTE/99-ISO' | 'VTE/87-PED'
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
      descricao: 'Verificar cintas P/N 9R41423003 - sem desgaste ou cortes',
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
          referencia: cap.cylinder_pn || null,
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
      sistema_insuflacao: cap.sistema === 'VTE/99-ISO'
        ? { tipo: 'VTE/99-ISO', thread: cap.thread || null, wrench_torque_nm: 130 }
        : { tipo: 'VTE/87-PED', thread: cap.thread || null, wrench_torque_nm: 100, operating_head_torque_nm: 40 },
      strap_pn: cap.strap_pn || '9R41423003'
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
        sistemaInsuflacao: `${cap.sistema} | Thread ${cap.thread || 'N/A'}`,
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
        sistemaInsuflacao: `${cap.sistema} | Thread ${cap.thread || 'N/A'}`,
        tiposValvulas: params.valvulasPadrao
      }
    })

    console.log(`  ✓ ${cap.pessoas}P: ${cap.co2_kg}kg CO2 + ${cap.n2_kg}kg N2 | ${cap.sistema}`)
  }

  await addChecklist(modelo.id, params.nome)
}

async function addSpares() {
  const spares = [
    {
      nome: 'Lashing Straps CREWSAVER',
      partNumber: '9R41423003',
      categoria: 'Cintas',
      aplicacao: 'CREWSAVER ISO/MARINER',
      quantidade: 30,
      precoUnitario: 38.0,
      fornecedor: 'Crewsaver',
      localizacao: 'ARMAZEM-E-ST03'
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
  console.log('🔄 Adicionando modelos CREWSAVER...\n')

  const marca = await prisma.marcaJangada.findFirst({
    where: { nome: { contains: 'CREWSAVER', mode: 'insensitive' } }
  })

  if (!marca) {
    throw new Error('❌ Marca CREWSAVER nao encontrada! Execute add-marca-crewsaver.ts primeiro.')
  }

  const isoType1: Capacidade[] = [
    { pessoas: 4, cilindros: 1, co2_kg: 1.90, n2_kg: 0.13, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 6, cilindros: 1, co2_kg: 3.10, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 8, cilindros: 1, co2_kg: 3.50, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 10, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10394085', valve_pn: '10388045', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 12, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10382074', valve_pn: '10388045', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' }
  ]

  const isoType2: Capacidade[] = [
    { pessoas: 4, cilindros: 1, co2_kg: 1.90, n2_kg: 0.13, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 6, cilindros: 1, co2_kg: 3.10, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 8, cilindros: 1, co2_kg: 3.50, n2_kg: 0.20, thread: '1 NGT', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' },
    { pessoas: 10, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10394085', valve_pn: '10388045', strap_pn: '9R41423003', sistema: 'VTE/99-ISO' }
  ]

  const mariner: Capacidade[] = [
    { pessoas: 4, cilindros: 1, co2_kg: 1.90, n2_kg: 0.13, thread: '17E', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/87-PED' },
    { pessoas: 6, cilindros: 1, co2_kg: 2.20, n2_kg: 0.13, thread: '17E', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/87-PED' },
    { pessoas: 8, cilindros: 1, co2_kg: 3.50, n2_kg: 0.20, thread: '17E', cylinder_pn: '10394046', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/87-PED' },
    { pessoas: 10, cilindros: 1, co2_kg: 3.80, n2_kg: 0.22, thread: '25E', cylinder_pn: '10394085', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/87-PED' },
    { pessoas: 12, cilindros: 1, co2_kg: 4.25, n2_kg: 0.27, thread: '25E', cylinder_pn: '10394086', valve_pn: '10388044', strap_pn: '9R41423003', sistema: 'VTE/87-PED' }
  ]

  await addModel({
    marcaId: marca.id,
    nome: 'ISO TYPE 1 SYNTESY',
    sistemaInsuflacao: 'VTE/99-ISO/V1',
    valvulasPadrao: 'SUPERNOVA (10399310), PRV VA70 (10359166)',
    capacidades: isoType1
  })

  await addModel({
    marcaId: marca.id,
    nome: 'ISO TYPE 2 SYNTESY',
    sistemaInsuflacao: 'VTE/99-ISO',
    valvulasPadrao: 'SUPERNOVA (10399310), PRV VA70 (10359166)',
    capacidades: isoType2
  })

  await addModel({
    marcaId: marca.id,
    nome: 'MARINER MK 2',
    sistemaInsuflacao: 'VTE/87-PED',
    valvulasPadrao: 'SUPERNOVA (10399310), PRV VA70 (10359166)',
    capacidades: mariner
  })

  await addSpares()

  console.log('\n✅ CREWSAVER modelos adicionados com sucesso!')
}

main().catch((e) => {
  console.error('❌ Erro:', e)
  process.exit(1)
})
