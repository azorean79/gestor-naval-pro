import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const navioId = searchParams.get('navioId')
    const jangadaId = searchParams.get('jangadaId')
    const cilindroId = searchParams.get('cilindroId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const where: any = {}
    if (navioId) where.navioId = navioId
    if (jangadaId) where.jangadaId = jangadaId
    if (cilindroId) where.cilindroId = cilindroId
    if (status) where.status = status

    const [inspecoes, total] = await Promise.all([
      prisma.inspecao.findMany({
        where,
        include: {
          navio: true,
          jangada: true,
          cilindro: true,
          custos: true,
          historicos: true,
        },
        orderBy: { dataInspecao: 'desc' },
        take: limit,
        skip,
      }),
      prisma.inspecao.count({ where }),
    ])

    return NextResponse.json({
      data: inspecoes,
      total,
      limit,
      skip,
    })
  } catch (error) {
    console.error('Erro ao buscar inspeções:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar inspeções' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tipoInspecao,
      resultado,
      observacoes,
      tecnicoResponsavel,
      navioId,
      jangadaId,
      cilindroId,
      dataProxima,
      criarCronograma,
      frequenciaManutencao,
      tipoManutencao,
      tituloCronograma,
      custoEstimado,
      responsavelManutencao,
    } = body

    // Gerar número único
    const ultimaInspecao = await prisma.inspecao.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    })

    const proximoNumero = ultimaInspecao
      ? (parseInt(ultimaInspecao.numero.split('-')[1]) + 1).toString().padStart(6, '0')
      : '000001'
    const numero = `INS-${proximoNumero}`

    const inspecao = await prisma.$transaction(async (tx) => {
      const criada = await tx.inspecao.create({
        data: {
          numero,
          tipoInspecao,
          resultado: resultado || 'aprovada',
          observacoes,
          tecnico: tecnicoResponsavel,
          navioId: navioId || null,
          jangadaId: jangadaId || null,
          cilindroId: cilindroId || null,
          dataInspecao: new Date(),
          dataProxima: dataProxima ? new Date(dataProxima) : null,
          status: 'realizada',
        },
        include: {
          navio: true,
          jangada: true,
          cilindro: true,
        },
      })

      const deveCriarCronograma = criarCronograma !== false && dataProxima
      if (deveCriarCronograma) {
        const recurso = criada.navio?.nome || criada.jangada?.numeroSerie || criada.cilindro?.numeroSerie
        await tx.agendamento.create({
          data: {
            titulo: tituloCronograma || `Manutenção automática - ${recurso || 'Equipamento'}`,
            descricao: `Gerado automaticamente a partir da inspeção ${criada.numero}.`,
            tipo: tipoManutencao || 'preventiva',
            dataInicio: new Date(dataProxima),
            dataFim: new Date(dataProxima), // same day
            prioridade: 'normal',
            navioId: criada.navioId,
            jangadaId: criada.jangadaId,
            cilindroId: criada.cilindroId,
            responsavel: responsavelManutencao || tecnicoResponsavel,
            status: 'agendado',
          },
        })
      }

      return criada
    })

    return NextResponse.json(inspecao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao criar inspeção' },
      { status: 500 }
    )
  }
}
