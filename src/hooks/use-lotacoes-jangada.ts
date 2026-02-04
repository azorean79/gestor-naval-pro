import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useLotacoesJangada() {
  return useQuery({
    queryKey: ['lotacoes-jangada'],
    queryFn: async () => {
      const response = await fetch('/api/lotacoes-jangada');
      if (!response.ok) throw new Error('Failed to fetch lotacoes');
      return response.json();
    },
  });
}

export function useCreateLotacaoJangada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { capacidade: number }) => {
      const response = await fetch('/api/lotacoes-jangada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create lotacao');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotacoes-jangada'] });
    },
  });
}