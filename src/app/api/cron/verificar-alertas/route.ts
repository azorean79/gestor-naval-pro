import { NextRequest, NextResponse } from 'next/server'
import { executarTodasAsVerificacoes } from '@/lib/notification-service'

/**
 * Endpoint para executar verificações de alertas
 * Pode ser chamado por um serviço externo de agendamento (cron job)
 * ou periodicamente pelo cliente via React Query
 *
 * POST /api/cron/verificar-alertas
 */
export async function POST(request: NextRequest) {
  try {
    // Opcional: validar chave secreta para segurança
    const secretKey = request.headers.get('X-CRON-SECRET')
    const expectedSecret = process.env.CRON_SECRET_KEY || 'chave-secreta-padrao'

    if (process.env.NODE_ENV === 'production' && secretKey !== expectedSecret) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const resultado = await executarTodasAsVerificacoes()

    return NextResponse.json({
      sucesso: true,
      resultado,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao executar verificações de alertas:', error)
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'Erro ao executar verificações de alertas',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET - informações sobre o último ciclo de verificação
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      servico: 'Verificação de Alertas',
      endpoint: 'POST /api/cron/verificar-alertas',
      descricao: 'Executa verificações de cilindros com teste hidráulico expirando, stock baixo e inspeções próximas',
      frequenciaRecomendada: 'A cada 6 horas ou diariamente',
      ultimaExecucao: process.env.LAST_ALERT_CHECK || 'Nunca',
      status: 'Ativo'
    })
  } catch (error) {
    return NextResponse.json({ erro: 'Erro' }, { status: 500 })
  }
}
