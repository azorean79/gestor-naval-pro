import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Componentes padrão da Folha de Obra FO102600001
 * Sempre necessários em qualquer inspeção
 */
const COMPONENTES_FO102600001 = [
  {
    nome: 'Sinais de Fumo Flutuantes',
    categoria: 'Comunicações',
    quantidade: 2,
    precoUnitario: 45.50,
    descricao: 'Sinais de fumo para sinalização diurna SOLAS'
  },
  {
    nome: 'Foguetes com Paraquedas',
    categoria: 'Comunicações',
    quantidade: 4,
    precoUnitario: 22.00,
    descricao: 'Foguetes sinalizadores com paraquedas SOLAS'
  },
  {
    nome: 'Fachos de Mão',
    categoria: 'Comunicações',
    quantidade: 2,
    precoUnitario: 18.50,
    descricao: 'Fachos de mão para sinalização noturna'
  },
  {
    nome: 'Cilindro CO2',
    categoria: 'Cilindros Gás',
    quantidade: 1,
    precoUnitario: 450.00,
    descricao: 'Cilindro CO2 para inflação de balsa'
  },
  {
    nome: 'Pilhas Alcalinas AA',
    categoria: 'Baterias',
    quantidade: 4,
    precoUnitario: 1.50,
    descricao: 'Pilhas para equipamentos de emergência'
  }
]

export async function GET() {
  try {
    // Buscar todos os itens de stock
    const stock = await prisma.stock.findMany()

    // Buscar todas as jangadas e suas inspeções
    const jangadas = await prisma.jangada.findMany({
      include: {
        navio: { include: { cliente: true } },
        cliente: true,
        inspecoes: {
          orderBy: { dataInspecao: 'desc' },
          take: 1
        }
      }
    })

    // Calcular consumo por jangada
    const jangadasComStock = jangadas.map(jangada => {
      const dataProxima = new Date(jangada.dataProximaInspecao || new Date())
      const hoje = new Date()
      const diasRestantes = Math.ceil((dataProxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      // Componentes necessários para esta jangada
      const componentesNecessarios = COMPONENTES_FO102600001.map(comp => ({
        ...comp,
        necessarioParaInspeção: true,
        diasParaVencimento: diasRestantes
      }))

      return {
        jangada,
        componentesNecessarios,
        custoEstimado: componentesNecessarios.reduce((sum, c) => sum + (c.quantidade * c.precoUnitario), 0),
        diasRestantes
      }
    })

    // Alertas de stock
    const alertasStock = stock
      .filter(item => item.quantidade < item.quantidadeMinima)
      .map(item => ({
        item: item.nome,
        disponivel: item.quantidade,
        minimo: item.quantidadeMinima,
        faltam: item.quantidadeMinima - item.quantidade,
        status: item.quantidade === 0 ? 'critico' : 'aviso'
      }))

    return NextResponse.json({
      data: {
        stock,
        jangadasComStock,
        alertasStock,
        componentes_fo102600001: COMPONENTES_FO102600001,
        resumo: {
          totalStock: stock.length,
          itemsComEstoque: stock.filter(i => i.quantidade > 0).length,
          itemsCriticos: alertasStock.filter(a => a.status === 'critico').length,
          itensAviso: alertasStock.filter(a => a.status === 'aviso').length
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar stock com FO102600001:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { acao, jangadaId, componentesRetirados } = body

    if (acao === 'registar-consumo' && jangadaId && componentesRetirados) {
      // Atualizar stock após consumo na inspeção
      for (const componente of componentesRetirados) {
        await prisma.stock.update({
          where: { nome_categoria: { nome: componente.nome, categoria: componente.categoria } },
          data: {
            quantidade: {
              decrement: componente.quantidade
            }
          }
        })
      }

      return NextResponse.json({
        message: 'Consumo registado com sucesso',
        componentesRetirados
      })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao registar consumo:', error)
    return NextResponse.json(
      { error: 'Erro ao registar consumo' },
      { status: 500 }
    )
  }
}
