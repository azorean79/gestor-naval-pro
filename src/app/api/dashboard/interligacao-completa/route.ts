import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

/**
 * Mapeamento de componentes da FO102600001 para cada tipo de inspeção
 */
const MAPEAMENTO_COMPONENTES_INSPECAO = {
  'inspecacao_jangadas': [
    { nome: 'Sinais de Fumo Flutuantes', quantidade: 2, categoria: 'Comunicações' },
    { nome: 'Foguetes com Paraquedas', quantidade: 4, categoria: 'Comunicações' },
    { nome: 'Fachos de Mão', quantidade: 2, categoria: 'Comunicações' },
    { nome: 'Cilindro CO2', quantidade: 1, categoria: 'Cilindros Gás' },
    { nome: 'Pilhas Alcalinas AA', quantidade: 4, categoria: 'Baterias' }
  ],
  'coletes': [
    { nome: 'Pilhas Alcalinas AA', quantidade: 2, categoria: 'Baterias' }
  ],
  'epirbs': [
    { nome: 'Pilhas Alcalinas AA', quantidade: 6, categoria: 'Baterias' }
  ]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'todas'

    // Buscar todas as jangadas com inspeções próximas
    type JangadaComDados = Prisma.JangadaGetPayload<{
      include: {
        navio: { include: { cliente: true } }
        cliente: true
        marca: true
        modelo: true
        inspecoes: { include: { custos: true } }
      }
    }>

    const jangadas = await prisma.jangada.findMany({
      include: {
        navio: { include: { cliente: true } },
        cliente: true,
        marca: true,
        modelo: true,
        inspecoes: {
          orderBy: { dataInspecao: 'desc' },
          take: 3,
          include: { custos: true }
        }
      }
    }) as JangadaComDados[]

    // Buscar stock disponível
    const stock = await prisma.stock.findMany()
    const stockMap = new Map(stock.map(s => [`${s.nome}|${s.categoria}`, s]))

    // Processar jangadas com necessidades de stock
    const jangadasComDados = jangadas
      .filter(j => j.dataProximaInspecao)
      .map(jangada => {
        const dataProxima = new Date(jangada.dataProximaInspecao!)
        const hoje = new Date()
        const diasRestantes = Math.ceil((dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

        // Determinar tipo de inspeção (baseado em regras SOLAS)
        let tipoInspecao = 'inspecacao_jangadas'
        const agora = new Date()
        const dataFabricacao = jangada.dataFabricacao ? new Date(jangada.dataFabricacao) : agora
        const idade = Math.floor((agora.getTime() - dataFabricacao.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        
        // Determinar status
        let status = 'pendente'
        if (diasRestantes < 0) status = 'expirada'
        else if (diasRestantes <= 7) status = 'urgente'
        else if (diasRestantes <= 30) status = 'proximo'

        // Componentes necessários para esta inspeção
        const componentesNecessarios = MAPEAMENTO_COMPONENTES_INSPECAO[tipoInspecao as keyof typeof MAPEAMENTO_COMPONENTES_INSPECAO] || []

        // Verificar disponibilidade e custos
        const componentesComDisponibilidade = componentesNecessarios.map(comp => {
          const key = `${comp.nome}|${comp.categoria}`
          const itemStock = stockMap.get(key)
          const disponivel = itemStock?.quantidade || 0
          const emAlerta = disponivel < comp.quantidade

          return {
            nome: comp.nome,
            categoria: comp.categoria,
            necessario: comp.quantidade,
            disponivel,
            emAlerta,
            faltam: Math.max(0, comp.quantidade - disponivel),
            precoUnitario: itemStock?.precoUnitario || 0,
            custoTotal: (itemStock?.precoUnitario || 0) * comp.quantidade
          }
        })

        // Custo total da inspeção
        const custoEstimado = componentesComDisponibilidade.reduce((sum, c) => sum + c.custoTotal, 0)
        const componentesCriticos = componentesComDisponibilidade.filter(c => c.emAlerta).length

        return {
          id: jangada.id,
          numeroSerie: jangada.numeroSerie,
          navio: jangada.navio?.nome || 'Desconhecido',
          cliente: jangada.cliente?.nome || jangada.navio?.cliente?.nome || 'Sem cliente',
          marca: jangada.marca?.nome,
          modelo: jangada.modelo?.nome,
          dataProximaInspecao: dataProxima,
          diasRestantes,
          status,
          tipoInspecao,
          componentesNecessarios: componentesComDisponibilidade,
          custoEstimado,
          componentesCriticos,
          cilindrosParaTeste: 0,
          ultimaInspecao: jangada.inspecoes[0]?.dataInspecao || null
        }
      })
      .sort((a, b) => {
        // Ordenar por urgência
        const prioridades = { expirada: 0, urgente: 1, proximo: 2, pendente: 3 }
        return prioridades[a.status as keyof typeof prioridades] - prioridades[b.status as keyof typeof prioridades]
      })

    // Filtrar conforme solicitado
    let resultado = jangadasComDados
    if (filtro === 'criticas') {
      resultado = jangadasComDados.filter(j => j.status === 'expirada' || j.status === 'urgente')
    } else if (filtro === 'stock-alerta') {
      resultado = jangadasComDados.filter(j => j.componentesCriticos > 0)
    }

    // Resumo geral
    const resumo = {
      totalJangadas: jangadasComDados.length,
      expiradas: jangadasComDados.filter(j => j.status === 'expirada').length,
      urgentes: jangadasComDados.filter(j => j.status === 'urgente').length,
      proximas: jangadasComDados.filter(j => j.status === 'proximo').length,
      custoTotalEstimado: jangadasComDados.reduce((sum, j) => sum + j.custoEstimado, 0),
      componentesCriticosTotal: jangadasComDados.reduce((sum, j) => sum + j.componentesCriticos, 0),
      stockAlertaTotal: stock.filter(s => s.quantidade < s.quantidadeMinima).length
    }

    return NextResponse.json({
      data: resultado,
      resumo,
      mapeamento: MAPEAMENTO_COMPONENTES_INSPECAO
    })
  } catch (error) {
    console.error('Erro ao buscar interligação:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { acao, jangadaId, tipoInspecao } = body

    if (acao === 'realizar-inspecao' && jangadaId && tipoInspecao) {
      // Buscar componentes necessários
      const componentesNecessarios = MAPEAMENTO_COMPONENTES_INSPECAO[tipoInspecao as keyof typeof MAPEAMENTO_COMPONENTES_INSPECAO] || []

      // Deduzir stock
      for (const componente of componentesNecessarios) {
        await prisma.stock.updateMany({
          where: {
            nome: componente.nome,
            categoria: componente.categoria
          },
          data: {
            quantidade: {
              decrement: componente.quantidade
            }
          }
        })
      }

      // Registar inspecção realizada
      await prisma.inspecao.create({
        data: {
          jangadaId,
          numero: `INS-${Date.now()}`,
          tipoInspecao: tipoInspecao,
          resultado: 'aprovada',
          dataInspecao: new Date(),
          dataProxima: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          status: 'realizada',
          tecnico: 'Julio Correia'
        }
      })

      // Atualizar jangada
      await prisma.jangada.update({
        where: { id: jangadaId },
        data: {
          dataInspecao: new Date(),
          dataProximaInspecao: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }
      })

      return NextResponse.json({
        message: 'Inspeção realizada com sucesso',
        componentesRetirados: componentesNecessarios
      })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao realizar inspeção:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar inspeção' },
      { status: 500 }
    )
  }
}
