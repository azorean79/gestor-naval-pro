import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Cliente {
  id: string;
  nome: string;
  tipo: string;
  nif: string;
  email: string;
  telefone?: string;
  morada?: string;
  status: string;
  portoRegisto?: string;
  ilha?: string;
  portoEscala?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useClientes() {
  // Dados offline para quando a API não estiver disponível
  const dadosOffline: Cliente[] = [
    {
      id: "1",
      nome: "João Silva",
      tipo: "pessoa_fisica",
      nif: "123456789",
      email: "joao.silva@email.com",
      telefone: "+351 123 456 789",
      morada: "Rua das Jangadas, 123, Ponta Delgada",
      status: "ativo",
      ilha: "São Miguel",
      observacoes: "Cliente regular"
    },
    {
      id: "2",
      nome: "Maria Santos",
      tipo: "pessoa_fisica",
      nif: "987654321",
      email: "maria.santos@email.com",
      telefone: "+351 987 654 321",
      morada: "Avenida do Mar, 456, Horta",
      status: "ativo",
      ilha: "Faial",
      observacoes: "Cliente premium"
    },
    {
      id: "3",
      nome: "António Costa",
      tipo: "pessoa_fisica",
      nif: "456789123",
      email: "antonio.costa@email.com",
      telefone: "+351 456 789 123",
      morada: "Praça Velha, 789, Angra do Heroísmo",
      status: "ativo",
      ilha: "Terceira",
      observacoes: "Cliente novo"
    },
    {
      id: "4",
      nome: "Empresa Naval Ltda",
      tipo: "pessoa_juridica",
      nif: "501234567",
      email: "contacto@empresanaval.pt",
      telefone: "+351 222 333 444",
      morada: "Zona Industrial, Lote 5, Ponta Delgada",
      status: "ativo",
      ilha: "São Miguel",
      observacoes: "Empresa de manutenção naval"
    }
  ];

  return useQuery({
    queryKey: ['clientes'],
    queryFn: async (): Promise<Cliente[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useClienteById(id: string) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: async (): Promise<Cliente | null> => {
      const response = await fetch(`/api/clientes/${id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> => {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar cliente');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast.success('Cliente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar cliente');
      console.error('Erro ao criar cliente:', error);
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cliente> }): Promise<Cliente> => {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar cliente');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['clientes', data.id] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente');
      console.error('Erro ao atualizar cliente:', error);
    },
  });
}