import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ItemStock {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  unidade: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  quantidadeMaxima?: number;
  precoUnitario?: number;
  precoCompra?: number;
  precoVenda?: number;
  codigo?: string;
  codigoFabricante?: string;
  imagem?: string;
  fornecedor?: string;
  localizacao?: string;
  status: string;
  dataUltimaEntrada?: string;
  dataUltimaSaida?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useStock() {
  // Dados offline para quando a API não estiver disponível
  const dadosOffline: ItemStock[] = [
    {
      id: "1",
      nome: "Motor Yamaha 200HP",
      categoria: "Motores",
      descricao: "Motor fora de borda Yamaha 200HP",
      unidade: "unidade",
      quantidadeAtual: 5,
      quantidadeMinima: 2,
      quantidadeMaxima: 10,
      precoUnitario: 15000,
      precoCompra: 12000,
      precoVenda: 15000,
      codigo: "YAM-200HP",
      codigoFabricante: "YAM-200HP-FACT",
      imagem: "/uploads/sample.svg",
      fornecedor: "Yamaha Portugal",
      localizacao: "Armazém A1",
      status: "disponivel",
      observacoes: "Stock normal"
    },
    {
      id: "2",
      nome: "Hélice de bronze 24\"",
      categoria: "Peças",
      descricao: "Hélice de bronze para motores de 200HP",
      unidade: "unidade",
      quantidadeAtual: 1,
      quantidadeMinima: 3,
      quantidadeMaxima: 15,
      precoUnitario: 500,
      precoCompra: 350,
      precoVenda: 500,
      codigo: "HEP-24B",
      codigoFabricante: "HEP-24B-F",
      imagem: "/uploads/sample.svg",
      fornecedor: "Peças Navais Ltd",
      localizacao: "Armazém B2",
      status: "baixo_stock",
      observacoes: "Stock baixo - encomendar mais"
    },
    {
      id: "3",
      nome: "Cabo de aço 10mm",
      categoria: "Cordame",
      descricao: "Cabo de aço galvanizado 10mm x 100m",
      unidade: "rolo",
      quantidadeAtual: 8,
      quantidadeMinima: 5,
      quantidadeMaxima: 20,
      precoUnitario: 200,
      fornecedor: "Cordame Açores",
      localizacao: "Armazém C3",
      status: "disponivel",
      observacoes: "Stock adequado"
    }
  ];

  return useQuery({
    queryKey: ['stock'],
    queryFn: async (): Promise<ItemStock[]> => {
      // Buscar dados reais via API
      try {
        const res = await fetch('/api/stock');
        if (!res.ok) return dadosOffline;
        const json = await res.json();
        return json.data || dadosOffline;
      } catch (e) {
        console.error('Erro fetch stock:', e);
        return dadosOffline;
      }
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useStockById(id: string) {
  return useQuery({
    queryKey: ['stock', id],
    queryFn: async (): Promise<ItemStock | null> => {
      const response = await fetch(`/api/stock/${id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ItemStock>): Promise<ItemStock> => {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar item de stock');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Item de stock criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar item de stock');
    },
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ItemStock> }): Promise<ItemStock> => {
      const response = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar item de stock');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock', data.id] });
      toast.success('Item de stock atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar item de stock');
    },
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/stock/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar item de stock');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Item de stock deletado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar item de stock');
    },
  });
}