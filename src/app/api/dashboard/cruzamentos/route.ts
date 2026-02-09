import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Buscar todas as relações
    const [
      clientes,
      navios,
      jangadas,
      obras,
      inspecoes,
      cilindros
    ] = await Promise.all([
      prisma.cliente.findMany(),
      prisma.navio.findMany({ include: { cliente: true } }),
      prisma.jangada.findMany({ include: { navio: true, cliente: true } }),
      prisma.obra.findMany({ include: { cliente: true } }),
      prisma.inspecao.findMany({ include: { navio: true, jangada: true } }),
      prisma.cilindro.findMany()
    ])

    // Calcular cruzamentos
    const dashboard = {
      totais: {
        clientes: clientes.length,
        navios: navios.length,
        jangadas: jangadas.length,
        obras: obras.length,
        inspecoes: inspecoes.length,
        cilindros: cilindros.length
      },
      cruzamentos: {
        navioPorCliente: navios.reduce((acc: Record<string, number>, n) => {
          if (!n.clienteId) return acc
          if (!acc[n.clienteId]) acc[n.clienteId] = 0
          acc[n.clienteId]++
          return acc
        }, {}),
        jangadaPorNavio: jangadas.reduce((acc: Record<string, number>, j) => {
          if (!j.navioId) return acc
          if (!acc[j.navioId]) acc[j.navioId] = 0
          acc[j.navioId]++
          return acc
        }, {}),
        jangadaPorCliente: jangadas.reduce((acc: Record<string, number>, j) => {
          if (!j.clienteId) return acc
          if (!acc[j.clienteId]) acc[j.clienteId] = 0
          acc[j.clienteId]++
          return acc
        }, {}),
        obraPorCliente: obras.reduce((acc: Record<string, number>, o) => {
          if (!o.clienteId) return acc
          if (!acc[o.clienteId]) acc[o.clienteId] = 0
          acc[o.clienteId]++
          return acc
        }, {}),
        inspecaoPorNavio: inspecoes.reduce((acc: Record<string, number>, i) => {
          if (!i.navioId) return acc
          if (!acc[i.navioId]) acc[i.navioId] = 0
          acc[i.navioId]++
          return acc
        }, {}),
        inspecaoPorJangada: inspecoes.reduce((acc: Record<string, number>, i) => {
          if (!i.jangadaId) return acc
          if (!acc[i.jangadaId]) acc[i.jangadaId] = 0
          acc[i.jangadaId]++
          return acc
        }, {})
      },
      status: {
        inspecoesAprovadas: inspecoes.filter(i => i.resultado === 'aprovada').length,
        inspecoesReprovadas: inspecoes.filter(i => i.resultado === 'reprovada').length,
        inspecoesPendentes: inspecoes.filter(i => i.resultado === 'pendente').length,
        obrasEmCurso: obras.filter(o => o.status === 'em-curso').length,
        obrasConcluidas: obras.filter(o => o.status === 'concluida').length,
        obrasPlaneadas: obras.filter(o => o.status === 'planejada').length,
        naviosAtivos: navios.filter(n => n.status === 'ativo').length,
        naviosManutencao: navios.filter(n => n.status === 'manutencao').length
      },
      alertas: {
        jangadasProximasVencimento: jangadas.filter(j => {
          if (!j.dataProximaInspecao) return false
          const diasRestantes = Math.ceil((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          return diasRestantes > 0 && diasRestantes <= 90
        }).length,
        jangadasExpiradas: jangadas.filter(j => {
          if (!j.dataProximaInspecao) return false
          const diasRestantes = Math.ceil((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          return diasRestantes < 0
        }).length,
        cilindrosExpirados: cilindros.filter(c => {
          if (!c.dataProximoTeste) return false
          const diasRestantes = Math.ceil((new Date(c.dataProximoTeste).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          return diasRestantes < 0
        }).length
      }
    }

    return NextResponse.json({ data: dashboard })
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar dashboard' },
      { status: 500 }
    )
  }
}
