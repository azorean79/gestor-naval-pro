import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTiposPack() {
  return useQuery({
    queryKey: ['tipos-pack'],
    queryFn: async () => {
      const response = await fetch('/api/tipos-pack');
      if (!response.ok) throw new Error('Failed to fetch tipos pack');
      return response.json();
    },
  });
}

export function useCreateTipoPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string }) => {
      const response = await fetch('/api/tipos-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create tipo pack');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-pack'] });
    },
  });
}