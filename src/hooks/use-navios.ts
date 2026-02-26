import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Navio {
  id: string;
  nome: string;
  imo: string;
  mmsi?: string;
  matricula?: string;
  bandeira?: string;
  tipo: string;
  comprimento?: number;
  largura?: number;
  calado?: number;
  capacidade?: number;
  proprietario?: string;
  armador?: string;
  status: string;
  ultimaInspecao?: string;
  proximaInspecao?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useNavios() {
  // Dados offline para quando a API não estiver disponível
  const dadosOffline: Navio[] = [
    {
      id: "1",
      nome: "Baía do Corvo",
      imo: "IMO123456",
      tipo: "pesqueiro",
      bandeira: "Portugal",
      capacidade: 50,
      proprietario: "João Silva",
      status: "ativo",
      ultimaInspecao: "2024-01-15",
      proximaInspecao: "2024-07-15",
      observacoes: "Navio em bom estado"
    },
    {
      id: "2",
      nome: "Belladona",
      imo: "IMO234567",
      tipo: "pesqueiro",
      bandeira: "Portugal",
      capacidade: 75,
      proprietario: "Maria Santos",
      status: "ativo",
      ultimaInspecao: "2024-01-20",
      proximaInspecao: "2024-07-20",
      observacoes: "Navio recém-inspecionado"
    },
    {
      id: "3",
      nome: "Luzimar",
      imo: "IMO345678",
      tipo: "cargueiro",
      bandeira: "Portugal",
      capacidade: 200,
      proprietario: "Empresa Naval Ltda",
      status: "manutencao",
      ultimaInspecao: "2024-01-10",
      proximaInspecao: "2024-07-10",
      observacoes: "Em manutenção programada"
    }
  ];

  return useQuery({
    queryKey: ['navios'],
    queryFn: async (): Promise<Navio[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useNavioById(id: string) {
  return useQuery({
    queryKey: ['navios', id],
    queryFn: async (): Promise<Navio | null> => {
      const response = await fetch(`/api/navios/${id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateNavio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Navio, 'id' | 'createdAt' | 'updatedAt'>): Promise<Navio> => {
      const response = await fetch('/api/navios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar navio');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
      toast.success('Navio criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar navio');
      console.error('Erro ao criar navio:', error);
    },
  });
}

export function useUpdateNavio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Navio> }): Promise<Navio> => {
      const response = await fetch(`/api/navios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar navio');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
      queryClient.invalidateQueries({ queryKey: ['navios', data.id] });
      toast.success('Navio atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar navio');
    },
  });
}