import { useQuery } from '@tanstack/react-query';

export interface ItemFatura {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface Fatura {
  id: string;
  numero: string;
  tipo: 'Serviços' | 'Equipamentos' | 'Inspeção' | 'Manutenção' | 'Reparo';
  clienteId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  iva: number;
  total: number;
  status: 'emitida' | 'enviada' | 'paga' | 'vencida' | 'cancelada';
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  metodoPagamento?: string;
  itens: ItemFatura[];
  createdAt: string;
  updatedAt: string;
}

export function useFaturas() {
  return useQuery({
    queryKey: ['faturas'],
    queryFn: async (): Promise<Fatura[]> => {
      // Funcionalidade ainda não implementada - retorna array vazio
      return [];
    },
    enabled: typeof window !== 'undefined',
  });
}

export function useCreateFatura() {
  return {
    mutate: async (data: Partial<Fatura>) => {
      throw new Error('Funcionalidade de faturas ainda não implementada');
    },
    isPending: false,
  };
}

export function useUpdateFatura() {
  return {
    mutate: async (id: string, data: Partial<Fatura>) => {
      throw new Error('Funcionalidade de faturas ainda não implementada');
    },
    isPending: false,
  };
}

export function useDeleteFatura() {
  return {
    mutate: async (id: string) => {
      throw new Error('Funcionalidade de faturas ainda não implementada');
    },
    isPending: false,
  };
}