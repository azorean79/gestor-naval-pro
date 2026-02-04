'use client';

import { useEffect, useState } from 'react';

export interface AlertaCritico {
  id: string;
  tipo: 'jangada_vencida' | 'cilindro_expirado' | 'stock_critico' | 'agendamento_hoje' | 'obra_atrasada';
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dados?: any;
  createdAt: Date;
}

export interface SugestaoJulinho {
  id: string;
  tipo: 'agendar' | 'stock' | 'obra' | 'inspecao' | 'relatorio';
  titulo: string;
  descricao: string;
  acao?: string;
  icone?: string;
}

export interface ResumoJulinho {
  alertas: AlertaCritico[];
  sugestoes: SugestaoJulinho[];
  agendamentosHoje: number;
  jangadasVencimento: number;
  cilindrosExpirados: number;
  stockCritico: number;
  obrasAbertas: number;
  mensagemBomDia: string;
}

export function useJulinhoWidget() {
  const [resumo, setResumo] = useState<ResumoJulinho | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResumo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/julinho/widget');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados do Julinho');
      }

      const data = await response.json();
      setResumo(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar resumo do Julinho:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumo();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchResumo, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    resumo,
    isLoading,
    error,
    refresh: fetchResumo,
  };
}
