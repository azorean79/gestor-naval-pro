import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { NavioForm, NavioFilters } from '@/lib/types';
import { navioSchema } from '@/lib/validation-schemas';
import { useTecnico } from './use-tecnico';

export function useNavios(filters?: NavioFilters) {
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

    const response = await fetch(`/api/navios?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar navios');

    const result = await response.json();
    return result;
  }, [filters, tecnico, isHydrated]);

  return useQuery({
    queryKey: ['navios', filters, tecnico],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isHydrated,
  });
}

export function useNavio(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/navios/${id}`);
    if (!response.ok) throw new Error('Navio não encontrado');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['navio', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateNavio() {
  const queryClient = useQueryClient();
  const { tecnico } = useTecnico();

  const mutationFn = useCallback(async (data: NavioForm) => {
    const validatedData = navioSchema.parse(data);

    const response = await fetch('/api/navios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedData, tecnico }),
    });

    if (!response.ok) throw new Error('Erro ao criar navio');
    return response.json();
  }, [tecnico]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
    },
  });
}

export function useUpdateNavio() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<NavioForm> }) => {
    const validatedData = navioSchema.partial().parse(data);

    const response = await fetch(`/api/navios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar navio');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
      queryClient.invalidateQueries({ queryKey: ['navio'] });
    },
  });
}

export function useDeleteNavio() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/navios/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar navio');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
    },
  });
}

export function useBulkDeleteNavios() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (ids: string[]) => {
    const response = await fetch('/api/navios/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error('Erro ao deletar navios');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navios'] });
    },
  });
}