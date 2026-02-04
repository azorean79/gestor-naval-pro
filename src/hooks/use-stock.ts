import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { StockForm, StockFilters } from '@/lib/types';
import { stockSchema } from '@/lib/validation-schemas';

export function useStock(filters?: StockFilters) {
  const queryFn = useCallback(async () => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoria) params.append('categoria', filters.categoria);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fornecedor) params.append('fornecedor', filters.fornecedor);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`/api/stock?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar itens do stock');

    const result = await response.json();
    return result;
  }, [filters]);

  return useQuery({
    queryKey: ['stock', filters],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStockItem(id: string) {
  const queryFn = useCallback(async () => {
    const response = await fetch(`/api/stock/${id}`);
    if (!response.ok) throw new Error('Item do stock não encontrado');
    return response.json();
  }, [id]);

  return useQuery({
    queryKey: ['stock', id],
    queryFn,
    enabled: !!id,
  });
}

export function useCreateStockItem() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (data: StockForm) => {
    const validatedData = stockSchema.parse(data);

    const response = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao criar item do stock');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async ({ id, data }: { id: string; data: Partial<StockForm> }) => {
    const validatedData = stockSchema.partial().parse(data);

    const response = await fetch(`/api/stock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) throw new Error('Erro ao atualizar item do stock');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useDeleteStockItem() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (id: string) => {
    const response = await fetch(`/api/stock/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Erro ao deletar item do stock');
    return id;
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export function useBulkDeleteStockItems() {
  const queryClient = useQueryClient();

  const mutationFn = useCallback(async (ids: string[]) => {
    const response = await fetch('/api/stock/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) throw new Error('Erro ao deletar itens do stock');
    return response.json();
  }, []);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}