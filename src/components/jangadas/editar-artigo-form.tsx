"use client";
import { useState } from "react";

export function EditarArtigoForm({ jangadaId, artigo, onSave }: { jangadaId: string, artigo?: any, onSave?: () => void }) {
  const [nome, setNome] = useState(artigo?.nome || "");
  const [lote, setLote] = useState(artigo?.lote || "");
  const [validade, setValidade] = useState(artigo?.validade || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = artigo ? "PUT" : "POST";
    const url = artigo
      ? `/api/jangadas/${jangadaId}/artigos/${artigo.id}`
      : `/api/jangadas/${jangadaId}/artigos`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, lote, validade }),
    });
    setSaving(false);
    if (res.ok && onSave) onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Nome do Artigo</label>
        <input className="border rounded px-2 py-1 w-full" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>
      <div>
        <label className="block font-medium">Lote (opcional)</label>
        <input className="border rounded px-2 py-1 w-full" value={lote} onChange={e => setLote(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Validade (opcional)</label>
        <input type="date" className="border rounded px-2 py-1 w-full" value={validade} onChange={e => setValidade(e.target.value)} />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
        {artigo ? "Salvar Alterações" : "Adicionar Artigo"}
      </button>
    </form>
  );
}
