import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Cilindro {
  id: string;
  numeroSerie: string;
  pesoBruto?: number;
  tara?: number;
  quantidadeCO2?: number;
  quantidadeN2?: number;
  testeHidraulico?: string;
  proximoTesteHidraulico?: string;
  proximaInspecao?: string; // Suporte para mock
  tipoSistemaInsuflacao?: string;
  status: string;
  localizacao?: string;
  proprietario?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
  // Campos opcionais usados pela UI
  marca?: string;
  modelo?: string;
  dataValidade?: string;
  ultimaInspecao?: string;
  dataFabricacao?: string;
}

export function useCilindros(options?: { enabled?: boolean }) {
  // Dados offline para quando a API não estiver disponível
  const dadosOffline: Cilindro[] = [
    {
      id: "1",
      numeroSerie: "CIL-001",
      pesoBruto: 25,
      tara: 5,
      quantidadeCO2: 20,
      testeHidraulico: "2024-01-15",
      proximoTesteHidraulico: "2025-01-15",
      status: "ativo",
      localizacao: "Armazém B2",
      proprietario: "João Silva",
      observacoes: "Cilindro em bom estado"
    },
    {
      id: "2",
      numeroSerie: "CIL-002",
      pesoBruto: 30,
      tara: 6,
      quantidadeCO2: 24,
      testeHidraulico: "2024-01-10",
      proximoTesteHidraulico: "2025-01-10",
      status: "ativo",
      localizacao: "Armazém B2",
      proprietario: "Maria Santos",
      observacoes: "Cilindro novo"
    },
    {
      id: "3",
      numeroSerie: "CIL-003",
      pesoBruto: 25,
      tara: 5,
      quantidadeCO2: 20,
      testeHidraulico: "2023-12-01",
      proximoTesteHidraulico: "2024-12-01",
      status: "ativo",
      localizacao: "Armazém B2",
      proprietario: "António Costa",
      observacoes: "Cilindro em manutenção"
    },
    {
      id: "4",
      numeroSerie: "CIL-004",
      pesoBruto: 35,
      tara: 7,
      quantidadeCO2: 28,
      testeHidraulico: "2024-01-20",
      proximoTesteHidraulico: "2025-01-20",
      status: "defeituoso",
      localizacao: "Armazém B2",
      proprietario: "Empresa Naval Ltda",
      observacoes: "Cilindro com defeito"
    },
    {
      id: "5",
      numeroSerie: "CIL-005",
      pesoBruto: 25,
      tara: 5,
      quantidadeCO2: 20,
      testeHidraulico: "2024-01-25",
      proximoTesteHidraulico: "2025-01-25",
      status: "ativo",
      localizacao: "Armazém B2",
      proprietario: "João Silva",
      observacoes: "Cilindro reserva"
    }
  ];

  return useQuery({
    queryKey: ['cilindros'],
    queryFn: async (): Promise<Cilindro[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: options?.enabled ?? true,
    retry: 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCilindro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Cilindro, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cilindro> => {
      const response = await fetch('/api/cilindros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar cilindro');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
      toast.success('Cilindro criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar cilindro');
      console.error('Erro ao criar cilindro:', error);
    },
  });
}

export function useUpdateCilindro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cilindro> }): Promise<Cilindro> => {
      const response = await fetch(`/api/cilindros/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar cilindro');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
      queryClient.invalidateQueries({ queryKey: ['cilindros', data.id] });
      toast.success('Cilindro atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cilindro');
      console.error('Erro ao atualizar cilindro:', error);
    },
  });
}

export function useDeleteCilindro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/cilindros/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar cilindro');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
      toast.success('Cilindro deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar cilindro');
      console.error('Erro ao deletar cilindro:', error);
    },
  });
}