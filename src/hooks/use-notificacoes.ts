import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  lida: boolean
  dataEnvio: string
  navio?: { nome: string }
  jangada?: { numeroSerie: string }
  cilindro?: { numeroSerie: string }
}

interface ResumoAlertas {
  totalNaoLidas: number
  alertasWarning: number
  alertasInfo: number
  notificacoesRecentes: Array<{
    id: string
    titulo: string
    tipo: string
    dataEnvio: string
  }>
}

export function useNotificacoes(options: {
  tipo?: string
  lida?: boolean
  limit?: number
  skip?: number
  enabled?: boolean
} = {}) {
  return useQuery<{ data: Notificacao[], total: number, page: number, limit: number, totalPages: number }>({
    queryKey: ['notificacoes', options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.tipo) params.append('tipo', options.tipo)
      if (options.lida !== undefined) params.append('lida', String(options.lida))
      if (options.limit) params.append('limit', String(options.limit))
      if (options.skip) params.append('skip', String(options.skip))

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar notificações')
      return response.json()
    },
    enabled: options.enabled !== false,
    refetchInterval: 30000, // atualiza a cada 30s
    staleTime: 15000 // dados válidos por 15s
  })
}

export function useResumoAlertas(enabled = true) {
  return useQuery<ResumoAlertas>({
    queryKey: ['resumoAlertas'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?action=resumo')
      if (!response.ok) throw new Error('Erro ao buscar resumo de alertas')
      return response.json()
    },
    enabled,
    refetchInterval: 30000, // atualiza a cada 30s
    staleTime: 15000
  })
}

export function useMarcarNotificacaoComoLida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const response = await fetch(
        `/api/notifications?id=${notificacaoId}&action=marcar-como-lida`,
        { method: 'PATCH' }
      )
      if (!response.ok) throw new Error('Erro ao marcar como lida')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['resumoAlertas'] })
    }
  })
}

export function useRemoverNotificacao() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificacaoId: string) => {
      const response = await fetch(
        `/api/notifications?id=${notificacaoId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Erro ao remover notificação')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['resumoAlertas'] })
    }
  })
}

export function useGerarAlertas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications?action=gerar')
      if (!response.ok) throw new Error('Erro ao gerar alertas')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      queryClient.invalidateQueries({ queryKey: ['resumoAlertas'] })
    }
  })
}
