"use client";

import { useQuery } from "@tanstack/react-query";

interface JulinhoSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionUrl?: string;
}

interface JulinhoWidgetData {
  suggestions: JulinhoSuggestion[];
  insights: string[];
  recommendations: string[];
}

export function useJulinhoWidget() {
  return useQuery<JulinhoWidgetData>({
    queryKey: ['julinho-widget'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/julinho/widget');
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do Julinho');
        }
        return response.json();
      } catch (error) {
        console.error('Erro ao carregar dados do Julinho:', error);
        // Return empty data instead of throwing to prevent UI crashes
        return {
          suggestions: [],
          insights: [],
          recommendations: []
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}