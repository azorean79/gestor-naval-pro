import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Jangada {
  id: string;
  numero: string;
  nome: string;
  proprietario: string;
  numeroSerie?: string;
  marca?: string;
  modelo?: string;
  lotacao?: number;
  dataFabricacao?: string;
  cilindro?: string;
  artigos?: any[];
  tipoPack?: string;
  tipoPesca?: string;
  zonaPesca?: string;
  status: string;
  ultimaInspecao?: string;
  proximaInspecao?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useJangadas() {
  // Dados offline para quando a API não estiver disponível
  const dadosOffline: Jangada[] = [
    {
      id: "1",
      numero: "J-001",
      nome: "Santa Maria",
      proprietario: "João Silva",
      numeroSerie: "J-001-SM",
      marca: "Yamaha",
      modelo: "JX-200",
      lotacao: 8,
      status: "ativo",
      ultimaInspecao: "2024-01-15",
      proximaInspecao: "2024-07-15",
      observacoes: "Jangada em bom estado"
    },
    {
      id: "2",
      numero: "J-002",
      nome: "Nossa Senhora",
      proprietario: "Maria Santos",
      numeroSerie: "J-002-NS",
      marca: "Honda",
      modelo: "Marine Pro",
      lotacao: 6,
      status: "manutencao",
      ultimaInspecao: "2024-01-10",
      proximaInspecao: "2024-07-10",
      observacoes: "Em manutenção preventiva"
    },
    {
      id: "3",
      numero: "J-003",
      nome: "São Pedro",
      proprietario: "António Costa",
      numeroSerie: "J-003-SP",
      marca: "Suzuki",
      modelo: "DF-150",
      lotacao: 10,
      status: "ativo",
      ultimaInspecao: "2024-01-20",
      proximaInspecao: "2024-07-20",
      observacoes: "Jangada nova"
    }
  ];

  return useQuery({
    queryKey: ['jangadas'],
    queryFn: async (): Promise<Jangada[]> => {
      try {
        const res = await fetch('/api/jangadas');
        if (!res.ok) return dadosOffline;
        const json = await res.json();
        return json.data || dadosOffline;
      } catch (e) {
        console.error('Erro fetch jangadas:', e);
        return dadosOffline;
      }
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUpdateJangada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Jangada> }): Promise<Jangada> => {
      const response = await fetch(`/api/jangadas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar jangada');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
      queryClient.invalidateQueries({ queryKey: ['jangadas', data.id] });
      toast.success('Jangada atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar jangada');
      console.error('Erro ao atualizar jangada:', error);
    },
  });
}