import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ClienteForm, ClienteFilters } from '@/lib/types';
import { clienteSchema } from '@/lib/validation-schemas';
import { useTecnico } from './use-tecnico';

export function useClientes(filters?: ClienteFilters) {
  const { tecnico, isHydrated } = useTecnico();

  const queryFn = useCallback(async () => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (isHydrated && tecnico) params.append('tecnico', tecnico);

    const response = await fetch(`/api/clientes?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar clientes');

    const result = await response.json();
    return result;
  }, [filters, tecnico, isHydrated]);

  return useQuery({
    queryKey: ['clientes', filters, tecnico],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isHydrated,
  });
}

export function useCliente(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/clientes/${id}`);
    if (!response.ok) throw new Error('Cliente não encontrado');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['cliente', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  const { tecnico } = useTecnico();

  const mutationFn = useCallback(async (data: ClienteForm) => {
    const validatedData = clienteSchema.parse(data);

    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validatedData, tecnico }),
    });

    if (!response.ok) throw new Error('Erro ao criar cliente');
    return response.json();
  }, [tecnico]);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<ClienteForm> }) => {
    const validatedData = clienteSchema.partial().parse(data);

    const response = await fetch(`/api/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar cliente');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente'] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/clientes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar cliente');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useBulkDeleteClientes() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (ids: string[]) => {
    const response = await fetch('/api/clientes/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error('Erro ao deletar clientes');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}