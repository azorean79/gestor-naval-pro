import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Agendamento {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  dataInicio: Date;
  dataFim: Date;
  local?: string;
  responsavel: string;
  participantes?: string;
  status: string;
  prioridade: string;
  entidadeRelacionada?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useAgendamentos() {
  // Dados offline para agendamentos
  const dadosOffline: Agendamento[] = [
    {
      id: "1",
      titulo: "Inspeção Jangada J-001",
      descricao: "Inspeção anual da jangada Santa Maria",
      tipo: "inspecao",
      dataInicio: new Date("2024-02-15T10:00:00"),
      dataFim: new Date("2024-02-15T12:00:00"),
      local: "Marina Ponta Delgada",
      responsavel: "João Silva",
      participantes: "Técnico António",
      status: "agendado",
      prioridade: "alta",
      entidadeRelacionada: "J-001",
      observacoes: "Verificar motor e cilindros",
      createdAt: "2024-01-15T08:00:00",
      updatedAt: "2024-01-15T08:00:00"
    },
    {
      id: "2",
      titulo: "Manutenção Navio Baía do Corvo",
      descricao: "Manutenção preventiva do motor",
      tipo: "manutencao",
      dataInicio: new Date("2024-02-20T09:00:00"),
      dataFim: new Date("2024-02-20T17:00:00"),
      local: "Estaleiro Horta",
      responsavel: "Maria Santos",
      participantes: "Equipe de manutenção",
      status: "agendado",
      prioridade: "media",
      entidadeRelacionada: "Baía do Corvo",
      observacoes: "Trocar óleo e filtros",
      createdAt: "2024-01-20T10:00:00",
      updatedAt: "2024-01-20T10:00:00"
    }
  ];

  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async (): Promise<Agendamento[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useDeleteAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/agenda/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar agendamento');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar agendamento');
      console.error('Erro ao deletar agendamento:', error);
    },
  });
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agendamento> => {
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar agendamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agendamento');
      console.error('Erro ao criar agendamento:', error);
    },
  });
}