'use client';

import { useState } from 'react';

interface Stock {
  referencia: string;
  descricao: string;
  precoVenda: number;
  quantidade: number;
  codigoFabricante?: string;
}

interface ArtigoJangada {
  id: number;
  name: string;
  quantidade: number;
  referencia: string;
}

interface SubstituirArtigoProps {
  jangadaId: number;
  artigo: ArtigoJangada;
  onSuccess?: () => void;
}

export function SubstituirArtigoDialog({
  jangadaId,
  artigo,
  onSuccess,
}: SubstituirArtigoProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novaReferencia, setNovaReferencia] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState(artigo.quantidade);
  const [opcoes, setOpcoes] = useState<Stock[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleAbrirDialog = async () => {
    setOpen(true);
    // Buscar opções de substituição
    try {
      const res = await fetch(
        `/api/jangadas/substituir-artigo?jangadaId=${jangadaId}&referencia=${artigo.referencia}`
      );
      const data = await res.json();
      setOpcoes(data.stockDisponivel || []);
    } catch (err) {
      console.error('Erro ao buscar opções:', err);
      setErro('Erro ao buscar opções de substituição');
    }
  };

  const handleSubstituir = async () => {
    if (!novaReferencia) {
      setErro('Seleccione um novo artigo');
      return;
    }

    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const res = await fetch('/api/jangadas/substituir-artigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jangadaId,
          referenciaAtual: artigo.referencia,
          novaReferencia,
          quantidade: novaQuantidade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao substituir artigo');
        return;
      }

      setSucesso('✅ Artigo substituído com sucesso!');
      setTimeout(() => {
        setOpen(false);
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setErro('Erro ao processar substituição');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const novoArtigo = opcoes.find((o) => o.referencia === novaReferencia);

  return (
    <>
      <button
        type="button"
        onClick={handleAbrirDialog}
        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        🔄 Substituir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Substituir Artigo na Jangada</h2>
              <p className="mt-1 text-sm text-gray-600">
                Escolha um novo artigo do stock para substituir o atual
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <label className="text-sm font-semibold text-yellow-900">
                  Artigo Atual
                </label>
                <div className="mt-2 space-y-1">
                  <p className="font-medium">{artigo.name}</p>
                  <p className="text-sm text-gray-600">
                    Referência: {artigo.referencia}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantidade: {artigo.quantidade}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="novo-artigo" className="block text-sm font-medium text-gray-700">
                  Novo Artigo (Stock)
                </label>
                <select
                  id="novo-artigo"
                  value={novaReferencia}
                  onChange={(e) => setNovaReferencia(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleccione um artigo...</option>
                  {opcoes.map((opcao) => (
                    <option key={opcao.referencia} value={opcao.referencia}>
                      {opcao.descricao} | REF: {opcao.referencia} | Stock: {opcao.quantidade}
                    </option>
                  ))}
                </select>
                {opcoes.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum artigo disponível</p>
                )}
              </div>

              {novoArtigo && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <label className="text-sm font-semibold text-green-900">
                    Novo Artigo (Pré-visualização)
                  </label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{novoArtigo.descricao}</p>
                    <p className="text-sm text-gray-600">
                      Referência: {novoArtigo.referencia}
                    </p>
                    <p className="text-sm text-gray-600">
                      Disponível em stock: {novoArtigo.quantidade}
                    </p>
                    <p className="text-sm text-gray-600">
                      Preço: €{novoArtigo.precoVenda}
                    </p>
                    {novoArtigo.codigoFabricante && (
                      <p className="text-sm text-gray-600">
                        Código Fabricante: {novoArtigo.codigoFabricante}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700">
                  Quantidade
                </label>
                <input
                  id="quantidade"
                  type="number"
                  min="1"
                  value={novaQuantidade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNovaQuantidade(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{erro}</p>
                </div>
              )}

              {sucesso && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-sm text-green-700">{sucesso}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubstituir}
                  disabled={loading || !novaReferencia}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : '✅ Substituir Artigo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
