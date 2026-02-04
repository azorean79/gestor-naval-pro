import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  tipo: 'chamada' | 'email' | 'envio_stock' | 'lembrete' | 'outro'
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  dataVencimento?: string
  dataConclusao?: string
  contatoNome?: string
  contatoEmail?: string
  contatoTelefone?: string
  stockId?: string
  clienteId?: string
  quantidade?: number
  criadoPor: string
  responsavel?: string
  notas?: string
  createdAt: string
  updatedAt: string
  stock?: {
    id: string
    nome: string
    categoria: string
  }
  cliente?: {
    id: string
    nome: string
  }
}

export interface CreateTarefaData {
  titulo: string
  descricao?: string
  tipo: Tarefa['tipo']
  prioridade?: Tarefa['prioridade']
  dataVencimento?: string
  contatoNome?: string
  contatoEmail?: string
  contatoTelefone?: string
  stockId?: string
  clienteId?: string
  quantidade?: number
  responsavel?: string
  notas?: string
}

export interface UpdateTarefaData extends Partial<CreateTarefaData> {
  status?: Tarefa['status']
  dataConclusao?: string
}

// Buscar todas as tarefas
export function useTarefas(filters?: {
  status?: string
  tipo?: string
  prioridade?: string
  responsavel?: string
}) {
  return useQuery({
    queryKey: ['tarefas', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.tipo) params.append('tipo', filters.tipo)
      if (filters?.prioridade) params.append('prioridade', filters.prioridade)
      if (filters?.responsavel) params.append('responsavel', filters.responsavel)

      const response = await fetch(`/api/tarefas?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar tarefas')
      return response.json()
    }
  })
}

// Buscar tarefa por ID
export function useTarefa(id: string) {
  return useQuery({
    queryKey: ['tarefa', id],
    queryFn: async () => {
      const response = await fetch(`/api/tarefas/${id}`)
      if (!response.ok) throw new Error('Erro ao buscar tarefa')
      return response.json()
    },
    enabled: !!id
  })
}

// Criar tarefa
export function useCreateTarefa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTarefaData) => {
      const response = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Erro ao criar tarefa')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] })
      toast.success('Tarefa criada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tarefa')
    }
  })
}

// Atualizar tarefa
export function useUpdateTarefa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTarefaData }) => {
      const response = await fetch(`/api/tarefas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Erro ao atualizar tarefa')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] })
      toast.success('Tarefa atualizada com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar tarefa')
    }
  })
}

// Excluir tarefa
export function useDeleteTarefa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tarefas/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Erro ao excluir tarefa')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] })
      toast.success('Tarefa excluída com sucesso!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir tarefa')
    }
  })
}

// Marcar tarefa como concluída
export function useConcluirTarefa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tarefas/${id}/concluir`, {
        method: 'PATCH'
      })
      if (!response.ok) throw new Error('Erro ao concluir tarefa')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] })
      toast.success('Tarefa marcada como concluída!')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao concluir tarefa')
    }
  })
}