import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Proprietario {
  id: string;
  nome: string;
  nif?: string;
  contacto?: string;
  telefone?: string;
  morada?: string;
  dataCriacao?: string;
  dataUltimaAtualizacao?: string;
}

export function useProprietarios() {
  // Dados offline para proprietários (baseados nos clientes)
  const dadosOffline: Proprietario[] = [
    {
      id: "1",
      nome: "João Silva",
      nif: "123456789",
      contacto: "joao.silva@email.com",
      telefone: "+351 123 456 789",
      morada: "Rua das Jangadas, 123, Ponta Delgada",
      dataCriacao: "2024-01-01",
      dataUltimaAtualizacao: "2024-01-15"
    },
    {
      id: "2",
      nome: "Maria Santos",
      nif: "987654321",
      contacto: "maria.santos@email.com",
      telefone: "+351 987 654 321",
      morada: "Avenida do Mar, 456, Horta",
      dataCriacao: "2024-01-02",
      dataUltimaAtualizacao: "2024-01-10"
    },
    {
      id: "3",
      nome: "António Costa",
      nif: "456789123",
      contacto: "antonio.costa@email.com",
      telefone: "+351 456 789 123",
      morada: "Praça Velha, 789, Angra do Heroísmo",
      dataCriacao: "2024-01-03",
      dataUltimaAtualizacao: "2024-01-20"
    },
    {
      id: "4",
      nome: "Empresa Naval Ltda",
      nif: "501234567",
      contacto: "contacto@empresanaval.pt",
      telefone: "+351 222 333 444",
      morada: "Zona Industrial, Lote 5, Ponta Delgada",
      dataCriacao: "2024-01-04",
      dataUltimaAtualizacao: "2024-01-25"
    }
  ];

  return useQuery({
    queryKey: ['proprietarios'],
    queryFn: async (): Promise<Proprietario[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUpdateProprietario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Proprietario> }): Promise<Proprietario> => {
      const response = await fetch(`/api/proprietarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar proprietário');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proprietarios'] });
      queryClient.invalidateQueries({ queryKey: ['proprietarios', data.id] });
      toast.success('Proprietário atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar proprietário', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });
}
