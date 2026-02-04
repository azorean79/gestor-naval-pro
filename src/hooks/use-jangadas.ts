import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { JangadaForm, JangadaFilters } from '@/lib/types';
import { jangadaSchema } from '@/lib/validation-schemas';
import { useTecnico } from './use-tecnico';

export function useJangadas(filters?: JangadaFilters) {
  const { tecnico, isHydrated } = useTecnico();

  const queryFn = useCallback(async () => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tipo) params.append('tipo', filters.tipo);
    if (filters?.clienteId) params.append('clienteId', filters.clienteId);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (isHydrated && tecnico) params.append('tecnico', tecnico);

    const response = await fetch(`/api/jangadas?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar jangadas');

    const result = await response.json();
    return result;
  }, [filters, tecnico, isHydrated]);

  return useQuery({
    queryKey: ['jangadas', filters, tecnico],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isHydrated, // Only run query after hydration
  });
}

export function useJangada(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/jangadas/${id}`);
    if (!response.ok) throw new Error('Jangada não encontrada');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['jangada', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateJangada() {
  const queryClient = useQueryClient();
  const { tecnico } = useTecnico();

  const mutationFn = useCallback(async (data: JangadaForm) => {
    const validatedData = jangadaSchema.parse(data);

    const response = await fetch('/api/jangadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedData, tecnico }),
    });

    if (!response.ok) throw new Error('Erro ao criar jangada');
    return response.json();
  }, [tecnico]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
    },
  });
}

export function useUpdateJangada() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<JangadaForm> }) => {
    const validatedData = jangadaSchema.partial().parse(data);

    const response = await fetch(`/api/jangadas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar jangada');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
      queryClient.invalidateQueries({ queryKey: ['jangada'] });
    },
  });
}

export function useDeleteJangada() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/jangadas/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar jangada');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
    },
  });
}

export function useBulkDeleteJangadas() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (ids: string[]) => {
    const response = await fetch('/api/jangadas/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error('Erro ao deletar jangadas');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
    },
  });
}