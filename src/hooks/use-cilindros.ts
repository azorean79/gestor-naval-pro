import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { CilindroForm, CilindroFilters } from '@/lib/types';
import { cilindroSchema } from '@/lib/validation-schemas';
import { useTecnico } from './use-tecnico';

export function useCilindros(filters?: CilindroFilters) {
  const { tecnico, isHydrated } = useTecnico();

  const queryFn = useCallback(async () => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.sistema) params.append('sistema', filters.sistema);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (isHydrated && tecnico) params.append('tecnico', tecnico);

    const response = await fetch(`/api/cilindros?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar cilindros');

    const result = await response.json();
    return result;
  }, [filters, tecnico, isHydrated]);

  return useQuery({
    queryKey: ['cilindros', filters, tecnico],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isHydrated, // Only run query after hydration
  });
}

export function useCilindro(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/cilindros/${id}`);
    if (!response.ok) throw new Error('Cilindro não encontrado');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['cilindro', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateCilindro() {
  const queryClient = useQueryClient();
  const { tecnico } = useTecnico();

  const mutationFn = useCallback(async (data: CilindroForm) => {
    const validatedData = cilindroSchema.parse(data);

    const response = await fetch('/api/cilindros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedData, tecnico }),
    });

    if (!response.ok) throw new Error('Erro ao criar cilindro');
    return response.json();
  }, [tecnico]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
    },
  });
}

export function useUpdateCilindro() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<CilindroForm> }) => {
    const validatedData = cilindroSchema.partial().parse(data);

    const response = await fetch(`/api/cilindros/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar cilindro');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
      queryClient.invalidateQueries({ queryKey: ['cilindro'] });
    },
  });
}

export function useDeleteCilindro() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/cilindros/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar cilindro');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
    },
  });
}

export function useBulkDeleteCilindros() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (ids: string[]) => {
    const response = await fetch('/api/cilindros/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error('Erro ao deletar cilindros');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] });
    },
  });
}