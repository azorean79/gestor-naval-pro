import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateAgendamentoData {
  titulo: string;
  descricao?: string | null;
  dataInicio: Date;
  dataFim: Date;
  tipo: string;
  status: string;
  prioridade: string;
  navioId?: string | null;
  jangadaId?: string | null;
  cilindroId?: string | null;
  pessoaId?: string | null;
  responsavel?: string | null;
}

export function useAgendamentos(options?: { proximos?: boolean; estacaoServico?: boolean }) {
  const params = new URLSearchParams();
  
  if (options?.proximos) {
    params.set('proximos', 'true');
  }
  
  if (options?.estacaoServico) {
    params.set('estacaoServico', 'true');
  }
  
  const queryString = params.toString();
  
  return useQuery({
    queryKey: ['agendamentos', options],
    queryFn: async () => {
      const url = `/api/agendamentos${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch agendamentos');
      return response.json();
    },
  });
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgendamentoData) => {
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create agendamento:', errorData);
        // @ts-ignore
        if (typeof window !== 'undefined') {
          import('sonner').then(({ toast }) => toast.error('Erro ao criar agendamento!'));
        }
        throw new Error(errorData.details || errorData.error || 'Failed to create agendamento');
      }
      // @ts-ignore
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => toast.success('Agendamento criado com sucesso!'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}

export function useUpdateAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAgendamentoData> }) => {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update agendamento:', errorData);
        // @ts-ignore
        if (typeof window !== 'undefined') {
          import('sonner').then(({ toast }) => toast.error('Erro ao atualizar agendamento!'));
        }
        throw new Error(errorData.details || errorData.error || 'Failed to update agendamento');
      }
      // @ts-ignore
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => toast.success('Agendamento atualizado com sucesso!'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}

export function useDeleteAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete agendamento:', errorData);
        // @ts-ignore
        if (typeof window !== 'undefined') {
          import('sonner').then(({ toast }) => toast.error('Erro ao excluir agendamento!'));
        }
        throw new Error(errorData.details || errorData.error || 'Failed to delete agendamento');
      }
      // @ts-ignore
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => toast.success('Agendamento excluído com sucesso!'));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}