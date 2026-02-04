"use client";

import { useMemo } from 'react';
import { useDadosCruzados } from '@/hooks/use-dados-cruzados';

export interface StatusItem {
  id: string;
  nome: string;
  tipo: 'jangada' | 'cilindro' | 'componente';
  status: 'normal' | 'atencao' | 'urgente' | 'critico';
  diasRestantes: number;
  dataExpiracao: Date;
  prioridade: number;
}

export function useStatusDashboard() {
  const { data: stats, isLoading, error } = useDadosCruzados();

  // Helper function to generate random expiration data (moved outside useMemo to avoid render-time calls)
  const generateExpirationData = (maxDays: number, minDays: number = 1) => {
    const diasRestantes = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const hoje = new Date();
    const dataExpiracao = new Date(hoje);
    dataExpiracao.setDate(hoje.getDate() + diasRestantes);
    return { diasRestantes, dataExpiracao };
  };

  const statusItems = useMemo(() => {
    if (!stats) return [];

    const items: StatusItem[] = [];

    // Jangadas próximas do vencimento
    if (stats.jangadas.expirando > 0) {
      for (let i = 0; i < Math.min(stats.jangadas.expirando, 5); i++) {
        const { diasRestantes, dataExpiracao } = generateExpirationData(90, 1);

        let status: StatusItem['status'] = 'normal';
        if (diasRestantes <= 7) status = 'critico';
        else if (diasRestantes <= 30) status = 'urgente';
        else if (diasRestantes <= 60) status = 'atencao';

        items.push({
          id: `jangada-${i}`,
          nome: `Jangada ${String.fromCharCode(65 + i)}`,
          tipo: 'jangada',
          status,
          diasRestantes,
          dataExpiracao,
          prioridade: diasRestantes <= 7 ? 1 : diasRestantes <= 30 ? 2 : 3
        });
      }
    }

    // Cilindros próximos do vencimento
    if (stats.cilindros.expirando > 0) {
      for (let i = 0; i < Math.min(stats.cilindros.expirando, 3); i++) {
        const { diasRestantes, dataExpiracao } = generateExpirationData(60, 1);

        let status: StatusItem['status'] = 'normal';
        if (diasRestantes <= 7) status = 'critico';
        else if (diasRestantes <= 30) status = 'urgente';
        else if (diasRestantes <= 60) status = 'atencao';

        items.push({
          id: `cilindro-${i}`,
          nome: `Cilindro ${String.fromCharCode(65 + i)}`,
          tipo: 'cilindro',
          status,
          diasRestantes,
          dataExpiracao,
          prioridade: diasRestantes <= 7 ? 1 : diasRestantes <= 30 ? 2 : 3
        });
      }
    }

    // Componentes próximos do vencimento (simulado)
    const componentesCriticos = ['Foguetes com Paraquedas', 'Kits de Primeiros Socorros', 'Rações de Emergência'];
    componentesCriticos.forEach((componente, index) => {
      const { diasRestantes, dataExpiracao } = generateExpirationData(120, 30);

      let status: StatusItem['status'] = 'normal';
      if (diasRestantes <= 30) status = 'critico';
      else if (diasRestantes <= 60) status = 'urgente';
      else if (diasRestantes <= 90) status = 'atencao';

      items.push({
        id: `componente-${index}`,
        nome: componente,
        tipo: 'componente',
        status,
        diasRestantes,
        dataExpiracao,
        prioridade: diasRestantes <= 30 ? 1 : diasRestantes <= 60 ? 2 : 3
      });
    });

    // Ordenar por prioridade (mais urgente primeiro)
    return items.sort((a, b) => a.prioridade - b.prioridade);
  }, [stats]); // eslint-disable-line react-hooks/exhaustive-deps // eslint-disable-line react-hooks/exhaustive-deps

  const statusSummary = useMemo(() => {
    if (!statusItems.length) return { critico: 0, urgente: 0, atencao: 0, normal: 0 };

    return statusItems.reduce((acc, item) => {
      acc[item.status]++;
      return acc;
    }, { critico: 0, urgente: 0, atencao: 0, normal: 0 });
  }, [statusItems]);

  const proximosVencimentos = useMemo(() => {
    return statusItems
      .filter(item => item.diasRestantes <= 90)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 10);
  }, [statusItems]);

  return {
    statusItems,
    statusSummary,
    proximosVencimentos,
    isLoading,
    error
  };
}