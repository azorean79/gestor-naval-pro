export interface DadosCruzados {
  jangadas: {
    total: number;
    ativas: number;
    manutencao: number;
    expirando: number;
  };
  navios: {
    total: number;
    ativas: number;
    manutencao: number;
    expirando: number;
  };
  clientes: {
    total: number;
    ativos: number;
    novosMes: number;
  };
  stock: {
    itensBaixo: number;
    itensEsgotados: number;
    valorTotal: number;
    itens: any[];
  };
  cilindros: {
    total: number;
    expirando: number;
    defeituosos: number;
  };
  agenda: {
    hoje: number;
    semana: number;
    mes: number;
  };
}

import { useQuery } from '@tanstack/react-query';

export function useDadosCruzados() {
  return useQuery({
    queryKey: ['dados-cruzados'],
    queryFn: async (): Promise<DadosCruzados> => {
      // Sempre usar dados offline, sem fetch
      return {
        jangadas: {
          total: 3,
          ativas: 2,
          manutencao: 1,
          expirando: 0,
        },
        navios: {
          total: 2,
          ativas: 1,
          manutencao: 1,
          expirando: 0,
        },
        clientes: {
          total: 4,
          ativos: 4,
          novosMes: 2,
        },
        stock: {
          itensBaixo: 0,
          itensEsgotados: 0,
          valorTotal: 15000,
          itens: [],
        },
        cilindros: {
          total: 5,
          expirando: 1,
          defeituosos: 0,
        },
        agenda: {
          hoje: 0,
          semana: 0,
          mes: 0,
        },
      };
    },
    enabled: true, // Sempre executar
    retry: 0, // Não tentar novamente
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}