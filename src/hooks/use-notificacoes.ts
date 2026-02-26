import { useQuery } from '@tanstack/react-query';

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: string;
  dataCriacao: string;
  lida: boolean;
  dados: any;
}

export function useNotificacoes() {
  // Hook desabilitado - não está sendo usado em lugar nenhum
  // Retornando dados mock para evitar erros
  return {
    data: [],
    isLoading: false,
    error: null,
    isError: false,
    refetch: () => Promise.resolve({ data: [] })
  };
}
