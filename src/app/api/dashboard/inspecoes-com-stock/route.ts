import { prisma } from '@/lib/prisma'
import type { Prisma } from '../../../../../prisma/app/generated-prisma-client'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar todas as jangadas com inspeções
    type JangadaComInspecoes = Prisma.JangadaGetPayload<{
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
          take: 1,
          include: {
            custos: true
          }
        }
      }
    }) as JangadaComInspecoes[]

    // Processar dados para o painel
    const inspecoes = jangadas
      .filter(j => j.dataProximaInspecao)
      .map(jangada => {
        const dataProxima = new Date(jangada.dataProximaInspecao!)
        const hoje = new Date()
        const diasRestantes = Math.ceil((dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

        // Determinar status
        let status: 'expirada' | 'urgente' | 'proximo' | 'pendente' = 'pendente'
        if (diasRestantes < 0) {
          status = 'expirada'
        } else if (diasRestantes <= 7) {
          status = 'urgente'
        } else if (diasRestantes <= 30) {
          status = 'proximo'
        }

        // Listar componentes que precisam ser repostos
        const componentes: string[] = []

        // Componentes padrão a verificar para uma jangada
        const componentesInspecao = [
          'Coletes Salva-Vidas',
          'EPIRB',
          'Sinalizadores Fumígenos',
          'Sinalizadores Luminosos',
          'Espelhos de Sinalização',
          'Dinghies Infláveis',
          'Remos',
          'Âncoras Flutuantes',
          'Kits de Sobrevivência',
          'Mochilas de Sobrevivência',
          'Água Destilada',
          'Rações de Emergência',
          'Kits de Pesca',
          'Livros de Instruções',
          'Kits de Reparação'
        ]

        // Adicionar componentes que estão próximos de vencer (simulado)
        if (status === 'expirada' || status === 'urgente') {
          componentesInspecao.slice(0, 5).forEach(comp => {
            componentes.push(comp)
          })
        } else if (status === 'proximo') {
          componentesInspecao.slice(0, 3).forEach(comp => {
            componentes.push(comp)
          })
        }

        return {
          id: jangada.id,
          jangadaId: jangada.id,
          numeroSerie: jangada.numeroSerie,
          navio: jangada.navio?.nome || 'Desconhecido',
          cliente: jangada.cliente?.nome || jangada.navio?.cliente?.nome || 'Sem cliente',
          dataProximaInspecao: dataProxima,
          diasRestantes,
          status,
          cilindros: [],
          componentes: [...new Set(componentes)], // Remove duplicatas
          ultimaInspecao: jangada.inspecoes[0]?.dataInspecao || null,
          totalComponentesSubstituidos: jangada.inspecoes[0]?.custos?.length || 0
        }
      })
      .sort((a, b) => {
        // Ordenar por urgência
        const prioridades = { expirada: 0, urgente: 1, proximo: 2, pendente: 3 }
        const prioA = prioridades[a.status]
        const prioB = prioridades[b.status]
        if (prioA !== prioB) return prioA - prioB
        return a.diasRestantes - b.diasRestantes
      })

    // Calcular resumo
    const resumo = {
      total: inspecoes.length,
      expiradas: inspecoes.filter(i => i.status === 'expirada').length,
      urgentes: inspecoes.filter(i => i.status === 'urgente').length,
      proximas: inspecoes.filter(i => i.status === 'proximo').length,
      pendentes: inspecoes.filter(i => i.status === 'pendente').length,
      totalCilindros: inspecoes.reduce((sum, i) => sum + i.cilindros.length, 0),
      totalComponentes: inspecoes.reduce((sum, i) => sum + i.componentes.length, 0)
    }

    return NextResponse.json({
      data: inspecoes,
      resumo
    })

  } catch (error) {
    console.error('Erro ao buscar inspeções com stock:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar inspeções', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
