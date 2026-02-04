import { useState, useCallback } from 'react';

interface QuadroImportState {
  isLoading: boolean;
  error: string | null;
  result: any | null;
  confianca: number;
}

export function useQuadroInspecaoImport() {
  const [state, setState] = useState<QuadroImportState>({
    isLoading: false,
    error: null,
    result: null,
    confianca: 0,
  });

  const importQuadro = useCallback(async (file: File) => {
    setState({ isLoading: true, error: null, result: null, confianca: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/jangadas/import-quadro', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setState({
          isLoading: false,
          error: data.error || 'Erro ao processar ficheiro',
          result: null,
          confianca: 0,
        });
        return;
      }

      setState({
        isLoading: false,
        error: data.errors?.length > 0 ? data.errors[0] : null,
        result: data,
        confianca: data.confianca || 0,
      });

      return data;
    } catch (err) {
      setState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        result: null,
        confianca: 0,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      result: null,
      confianca: 0,
    });
  }, []);

  return {
    ...state,
    importQuadro,
    reset,
  };
}
