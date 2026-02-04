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

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      const response = await fetch('/api/agendamentos');
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
      if (!response.ok) throw new Error('Failed to create agendamento');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });
}