'use client';

import { useState } from 'react';
import React from 'react';
import { Edit2, X } from 'lucide-react';

interface ArtigoSubstituido {
  id: number;
  name: string;
  quantidade: number;
  referencia: string | null;
}

interface EditarArtigoSubstituidoProps {
  jangadaId: number;
  artigo: ArtigoSubstituido;
  onSuccess?: () => void;
}

export function EditarArtigoSubstituidoDialog({
  jangadaId,
  artigo,
  onSuccess,
}: EditarArtigoSubstituidoProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantidade, setQuantidade] = useState(artigo.quantidade || 0);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleAbrirDialog = () => {
    setQuantidade(artigo.quantidade || 0);
    setErro('');
    setSucesso('');
    setOpen(true);
  };

  const handleSalvar = async () => {
    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      const res = await fetch(`/api/jangadas/${jangadaId}/artigos/${artigo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantidade: Number(quantidade),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao atualizar quantidade substituída');
        return;
      }

      setSucesso('✅ Quantidade atualizada com sucesso!');
      setTimeout(() => {
        setOpen(false);
        onSuccess?.();
      }, 1200);
    } catch (err) {
      setErro('Erro ao processar atualização');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAbrirDialog}
        className="text-indigo-600 hover:text-indigo-800 p-1 rounded-lg hover:bg-indigo-50 transition-colors no-print"
        title="Editar Quantidade Substituída"
      >
        <Edit2 size={13} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200">
            <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Editar Qtd. Substituída
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Altere a quantidade substituída registada na última inspeção.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-650 hover:bg-slate-50 p-1.5 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6 text-left">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Artigo</span>
                <p className="font-semibold text-slate-850">{artigo.name}</p>
                {artigo.referencia && (
                  <p className="text-xs text-slate-500 font-mono">Ref: {artigo.referencia}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantidade Substituída</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              {erro && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-semibold text-red-700">{erro}</p>
                </div>
              )}

              {sucesso && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-sm font-semibold text-green-700">{sucesso}</p>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  {loading ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
