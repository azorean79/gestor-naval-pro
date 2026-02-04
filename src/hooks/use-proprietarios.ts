import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ProprietarioForm, ProprietarioFilters } from '@/lib/types';
import { proprietarioSchema } from '@/lib/validation-schemas';
import { useTecnico } from './use-tecnico';

export function useProprietarios(filters?: ProprietarioFilters) {
  const { tecnico, isHydrated } = useTecnico();

  const queryFn = useCallback(async () => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (isHydrated && tecnico) params.append('tecnico', tecnico);

    const response = await fetch(`/api/proprietarios?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar proprietarios');

    const result = await response.json();
    return result;
  }, [filters, tecnico, isHydrated]);

  return useQuery({
    queryKey: ['proprietarios', filters, tecnico],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isHydrated,
  });
}

export function useProprietario(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/proprietarios/${id}`);
    if (!response.ok) throw new Error('Proprietario não encontrado');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['proprietario', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateProprietario() {
  const queryClient = useQueryClient();
  const { tecnico } = useTecnico();

  const mutationFn = useCallback(async (data: ProprietarioForm) => {
    const validatedData = proprietarioSchema.parse(data);

    const response = await fetch('/api/proprietarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedData, tecnico }),
    });

    if (!response.ok) throw new Error('Erro ao criar proprietario');
    return response.json();
  }, [tecnico]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietarios'] });
    },
  });
}

export function useUpdateProprietario() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<ProprietarioForm> }) => {
    const validatedData = proprietarioSchema.partial().parse(data);

    const response = await fetch(`/api/proprietarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar proprietario');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietarios'] });
      queryClient.invalidateQueries({ queryKey: ['proprietario'] });
    },
  });
}

export function useDeleteProprietario() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/proprietarios/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar proprietario');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proprietarios'] });
    },
  });
}