import { useQuery } from '@tanstack/react-query';

export function useMarcas() {
  return useQuery({
    queryKey: ['marcas'],
    queryFn: async () => {
      const response = await fetch('/api/marcas-jangada');
      if (!response.ok) throw new Error('Erro ao buscar marcas');
      const data = await response.json();
      return { data };
    },
    staleTime: 30000,
  });
}

export function useModelos(filters: { marcaId?: string } = {}) {
  return useQuery({
    queryKey: ['modelos', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.marcaId) params.append('marcaId', filters.marcaId);

      const response = await fetch(`/api/modelos-jangada?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar modelos');
      const data = await response.json();
      return { data };
    },
    staleTime: 30000,
  });
}