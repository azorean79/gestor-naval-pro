import { useState, useEffect } from 'react';

interface EnvioItem {
  id: string;
  tipoItem: 'stock' | 'jangada' | 'certificado' | 'correspondencia';
  stockId?: string;
  jangadaId?: string;
  certificadoId?: string;
  correspondenciaId?: string;
  quantidade: number;
  descricao: string;
  stock?: {
    id: string;
    nome: string;
    categoria: string;
  };
  jangada?: {
    id: string;
    numeroSerie: string;
    modelo?: {
      nome: string;
    };
    marca?: {
      nome: string;
    };
  };
  certificado?: {
    id: string;
    numero: string;
    tipo: string;
  };
  correspondencia?: {
    id: string;
    assunto: string;
    tipo: string;
  };
}

interface Envio {
  id: string;
  numeroRastreio?: string;
  tipo: 'stock' | 'jangada' | 'certificado' | 'correspondencia';
  metodoEnvio: string;
  transportadora?: string;
  status: string;
  destinatarioNome: string;
  destinatarioEmail?: string;
  destinatarioTelefone?: string;
  enderecoEntrega?: string;
  itens: EnvioItem[];
  dataEnvio?: string;
  dataEntregaEstimada?: string;
  dataEntregaReal?: string;
  custoEnvio?: number;
  custoTotal?: number;
  observacoes?: string;
  responsavel: string;
  createdAt: string;
  updatedAt: string;
}

export function useEnvios() {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logistica/envios');
      if (!response.ok) throw new Error('Erro ao buscar envios');
      const data = await response.json();
      setEnvios(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const criarEnvio = async (envioData: Omit<Envio, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/logistica/envios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envioData),
      });

      if (!response.ok) throw new Error('Erro ao criar envio');

      const novoEnvio = await response.json();
      setEnvios(prev => [novoEnvio, ...prev]);
      return novoEnvio;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar envio');
      throw err;
    }
  };

  const atualizarEnvio = async (id: string, updates: Partial<Envio>) => {
    try {
      const response = await fetch(`/api/logistica/envios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Erro ao atualizar envio');

      const envioAtualizado = await response.json();
      setEnvios(prev => prev.map(envio =>
        envio.id === id ? envioAtualizado : envio
      ));
      return envioAtualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar envio');
      throw err;
    }
  };

  const deletarEnvio = async (id: string) => {
    try {
      const response = await fetch(`/api/logistica/envios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar envio');

      setEnvios(prev => prev.filter(envio => envio.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar envio');
      throw err;
    }
  };

  useEffect(() => {
    fetchEnvios();
  }, []);

  // Funções específicas para correspondências
  const criarCorrespondencia = async (correspondenciaData: any) => {
    try {
      const response = await fetch('/api/correspondencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correspondenciaData),
      });

      if (!response.ok) throw new Error('Erro ao criar correspondência');

      const novaCorrespondencia = await response.json();
      return novaCorrespondencia;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar correspondência');
      throw err;
    }
  };

  const atualizarCorrespondencia = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/correspondencias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Erro ao atualizar correspondência');

      const correspondenciaAtualizada = await response.json();
      return correspondenciaAtualizada;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar correspondência');
      throw err;
    }
  };

  const deletarCorrespondencia = async (id: string) => {
    try {
      const response = await fetch(`/api/correspondencias/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar correspondência');

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar correspondência');
      throw err;
    }
  };

  // Funções específicas para envios de certificados
  const criarEnvioCertificado = async (envioData: any) => {
    try {
      const response = await fetch('/api/certificados/envios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envioData),
      });

      if (!response.ok) throw new Error('Erro ao criar envio de certificado');

      const novoEnvio = await response.json();
      setEnvios(prev => [novoEnvio, ...prev]);
      return novoEnvio;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar envio de certificado');
      throw err;
    }
  };

  const atualizarEnvioCertificado = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/certificados/envios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Erro ao atualizar envio de certificado');

      const envioAtualizado = await response.json();
      setEnvios(prev => prev.map(envio =>
        envio.id === id ? envioAtualizado : envio
      ));
      return envioAtualizado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar envio de certificado');
      throw err;
    }
  };

  const deletarEnvioCertificado = async (id: string) => {
    try {
      const response = await fetch(`/api/certificados/envios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao deletar envio de certificado');

      setEnvios(prev => prev.filter(envio => envio.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar envio de certificado');
      throw err;
    }
  };

  return {
    envios,
    loading,
    error,
    fetchEnvios,
    criarEnvio,
    atualizarEnvio,
    deletarEnvio,
    criarCorrespondencia,
    atualizarCorrespondencia,
    deletarCorrespondencia,
    criarEnvioCertificado,
    atualizarEnvioCertificado,
    deletarEnvioCertificado,
  };
}