import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ComponentePack {
  id: string;
  jangadaId: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  estado: 'ok' | 'proximo_vencer' | 'expirado';
  dataValidade: string | Date;
  dataInstalacao?: string | Date;
  proximaInspecao?: string | Date;
  observacoes?: string;
  dias_para_vencer?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook para buscar componentes do pack de uma jangada
 */
export function useComponentesPack(jangadaId: string) {
  return useQuery({
    queryKey: ['componentes-pack', jangadaId],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${jangadaId}/componentes-pack`);
      if (!res.ok) throw new Error('Erro ao buscar componentes do pack');
      return res.json();
    },
    enabled: !!jangadaId
  });
}

/**
 * Hook para criar componente de pack
 */
export function useCreateComponentePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { jangadaId: string; componente: Partial<ComponentePack> }) => {
      const res = await fetch(`/api/jangadas/${data.jangadaId}/componentes-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.componente)
      });
      if (!res.ok) throw new Error('Erro ao criar componente de pack');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['componentes-pack'] });
      toast.success('Componente criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar componente');
    }
  });
}

/**
 * Hook para atualizar componente de pack
 */
export function useUpdateComponentePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { jangadaId: string; componenteId: string; componente: Partial<ComponentePack> }) => {
      const res = await fetch(`/api/jangadas/${data.jangadaId}/componentes-pack/${data.componenteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.componente)
      });
      if (!res.ok) throw new Error('Erro ao atualizar componente de pack');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['componentes-pack'] });
      toast.success('Componente atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar componente');
    }
  });
}

/**
 * Hook para deletar componente de pack
 */
export function useDeleteComponentePack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { jangadaId: string; componenteId: string }) => {
      const res = await fetch(`/api/jangadas/${data.jangadaId}/componentes-pack/${data.componenteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erro ao deletar componente de pack');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['componentes-pack'] });
      toast.success('Componente deletado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao deletar componente');
    }
  });
}
