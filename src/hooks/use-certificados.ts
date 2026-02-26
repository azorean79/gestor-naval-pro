import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Certificado {
  id: string;
  navioId?: string;
  numero: string;
  tipo: string;
  dataEmissao?: string;
  dataValidade?: string;
  arquivoUrl?: string;
  tipoEquipamento?: string;
  marca?: string;
  modelos?: string;
  observacoes?: string;
  dataCriacao?: string;
  dataUltimaAtualizacao?: string;
}

export function useCertificados(navioId?: string) {
  // Dados offline para certificados
  const dadosOffline: Certificado[] = [
    {
      id: "1",
      navioId: "1",
      numero: "CERT-001",
      tipo: "Inspeção Anual",
      dataEmissao: "2024-01-15",
      dataValidade: "2025-01-15",
      tipoEquipamento: "Motor",
      marca: "Yamaha",
      modelos: "JX-200",
      observacoes: "Certificado válido",
      dataCriacao: "2024-01-15",
      dataUltimaAtualizacao: "2024-01-15"
    },
    {
      id: "2",
      navioId: "2",
      numero: "CERT-002",
      tipo: "Teste Hidráulico",
      dataEmissao: "2024-01-10",
      dataValidade: "2025-01-10",
      tipoEquipamento: "Cilindro",
      marca: "Safety First",
      modelos: "CO2-25kg",
      observacoes: "Certificado válido",
      dataCriacao: "2024-01-10",
      dataUltimaAtualizacao: "2024-01-10"
    }
  ];

  return useQuery({
    queryKey: ['certificados', navioId],
    queryFn: async (): Promise<Certificado[]> => {
      // Sempre usar dados offline, sem fetch
      if (navioId) {
        return dadosOffline.filter(cert => cert.navioId === navioId);
      }
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Certificado, 'id'>): Promise<Certificado> => {
      const response = await fetch('/api/certificados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar certificado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      toast.success('Certificado criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar certificado', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });
}

export function useUpdateCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Certificado> }): Promise<Certificado> => {
      const response = await fetch(`/api/certificados/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar certificado');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      toast.success('Certificado atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar certificado', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });
}

export function useDeleteCertificado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/certificados/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar certificado');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      toast.success('Certificado deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar certificado', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });
}
