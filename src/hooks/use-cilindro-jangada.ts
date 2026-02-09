import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Cilindro {
  id: string;
  numeroSerie: string;
  tipo: string;
  sistemaId?: string;
  tipoCilindroId?: string;
  tipoValvulaId?: string;
  capacidade?: number; // CO2 em kg
  capacidadeN2?: number; // N2 em kg
  tara?: number; // Peso vazio
  pesoBruto?: number; // Peso total
  dataFabricacao?: Date;
  dataTeste?: Date; // Último teste hidráulico
  dataProximoTeste?: Date;
  status: 'ativo' | 'defeituoso' | 'expirado';
  pressaoTrabalho?: number;
  pressaoTeste?: number;
  createdAt: Date;
  updatedAt: Date;
  sistema?: { id: string; nome: string };
}

/**
 * Hook para buscar cilindro de uma jangada
 */
export function useCilindroJangada(jangadaId: string) {
  return useQuery({
    queryKey: ['cilindro', jangadaId],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${jangadaId}/cilindro`);
      if (!res.ok) throw new Error('Erro ao buscar cilindro');
      return res.json();
    },
    enabled: !!jangadaId
  });
}

/**
 * Hook para associar cilindro a jangada
 */
export function useAssociarCilindroJangada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { jangadaId: string; cilindroId: string }) => {
      const res = await fetch(`/api/jangadas/${data.jangadaId}/cilindro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cilindroId: data.cilindroId })
      });
      if (!res.ok) throw new Error('Erro ao associar cilindro');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cilindro', variables.jangadaId] });
      queryClient.invalidateQueries({ queryKey: ['jangada', variables.jangadaId] });
      toast.success('Cilindro associado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao associar cilindro');
    }
  });
}

/**
 * Hook para remover cilindro de jangada
 */
export function useRemoverCilindroJangada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jangadaId: string) => {
      const res = await fetch(`/api/jangadas/${jangadaId}/cilindro`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erro ao remover cilindro');
      return res.json();
    },
    onSuccess: (_, jangadaId) => {
      queryClient.invalidateQueries({ queryKey: ['cilindro', jangadaId] });
      queryClient.invalidateQueries({ queryKey: ['jangada', jangadaId] });
      toast.success('Cilindro removido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover cilindro');
    }
  });
}
