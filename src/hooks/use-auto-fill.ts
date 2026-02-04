"use client";

import { useMemo } from 'react';
import { ESPECIFICACOES_TECNICAS } from '@/lib/jangada-options';

export interface AutoFillSuggestion {
  cilindroCapacidade?: number;
  cilindroValidade?: string;
  valvulaTipo?: string;
  sistemaInflacao?: string;
  recomendacoes?: string[];
}

export function useAutoFillSuggestions(marca: string, modelo: string) {
  const suggestions = useMemo(() => {
    if (!marca || !modelo) return null;

    const especificacao = ESPECIFICACOES_TECNICAS[`${marca} ${modelo}`];

    if (!especificacao) return null;

    const suggestion: AutoFillSuggestion = {
      sistemaInflacao: especificacao.sistemaInflacao,
      recomendacoes: []
    };

    // Extrair capacidade do cilindro do texto
    const cilindroMatch = especificacao.cilindroCO2.match(/(\d+(?:\.\d+)?)L/);
    if (cilindroMatch) {
      suggestion.cilindroCapacidade = parseFloat(cilindroMatch[1]);
    }

    // Sugerir validade baseada no tipo de componente
    if (especificacao.cilindroCO2.includes('CO2')) {
      suggestion.cilindroValidade = '5 anos (conforme fabricante)';
      suggestion.recomendacoes?.push('Cilindro de CO2 requer teste hidráulico a cada 5 anos');
    }

    // Adicionar recomendações específicas
    if (especificacao.sistemaInflacao === 'THANNER') {
      suggestion.recomendacoes?.push('Sistema THANNER: verificar pressão de inflação (2.5-3.5 bar)');
    } else if (especificacao.sistemaInflacao === 'LEAFIELD') {
      suggestion.recomendacoes?.push('Sistema LEAFIELD: verificar pressão de inflação (2.0-3.0 bar)');
    }

    // Recomendações baseadas no volume
    const volumeMatch = especificacao.volumeTotal.match(/(\d+(?:\.\d+)?)m³/);
    if (volumeMatch) {
      const volume = parseFloat(volumeMatch[1]);
      if (volume >= 20) {
        suggestion.recomendacoes?.push('Jangada de grande porte: verificar âncora flutuante obrigatória');
      }
    }

    return suggestion;
  }, [marca, modelo]);

  return suggestions;
}