import { useQuery } from '@tanstack/react-query';

export interface Empresa {
  id: string;
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  morada?: {
    rua?: string;
    cidade?: string;
    codigoPostal?: string;
    pais?: string;
  };
  status: string;
  empresa?: string;
  observacoes?: string;
}

export function useEmpresas() {
  // Dados offline para empresas
  const dadosOffline: Empresa[] = [
    {
      id: "4",
      nome: "Empresa Naval Ltda",
      nif: "501234567",
      email: "contacto@empresanaval.pt",
      telefone: "+351 222 333 444",
      morada: {
        rua: "Zona Industrial, Lote 5",
        cidade: "Ponta Delgada",
        codigoPostal: "9500-000",
        pais: "Portugal"
      },
      status: "ativo",
      empresa: "Empresa Naval Ltda",
      observacoes: "Empresa de manutenção naval"
    }
  ];

  return useQuery({
    queryKey: ['empresas'],
    queryFn: async (): Promise<Empresa[]> => {
      // Sempre usar dados offline, sem fetch
      return dadosOffline;
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
