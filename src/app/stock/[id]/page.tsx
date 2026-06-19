"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getStockCategoryOptions } from "@/lib/stock-categories";

export default function StockDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params && typeof params === "object" ? (params as Record<string, string | string[]>).id : undefined;
  const [artigo, setArtigo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const categoriasDisponiveis = getStockCategoryOptions();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/stock/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setArtigo(data);
        setForm(data || {});
        setLoading(false);
      });
  }, [id]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    router.refresh();
  };

  if (loading) return <div className="p-8">A carregar...</div>;
  if (!artigo) return <div className="p-8 text-red-600">Artigo não encontrado.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 mt-8 border border-gray-200">
      <h1 className="text-2xl font-bold mb-4">Ficha do Artigo de Stock</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Referência</label>
            <input className="input input-bordered w-full" value={form.referencia || ""} onChange={e => handleChange("referencia", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Descrição</label>
            <input className="input input-bordered w-full" value={form.descricao || ""} onChange={e => handleChange("descricao", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Categoria</label>
            <select className="input input-bordered w-full" value={form.categoria || ""} onChange={e => handleChange("categoria", e.target.value)}>
              <option value="">Sem categoria</option>
              {categoriasDisponiveis.map((categoria) => (
                <option key={categoria.value} value={categoria.value}>{categoria.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold">Quantidade</label>
            <input className="input input-bordered w-full" type="number" value={form.quantidade || 0} onChange={e => handleChange("quantidade", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Preço Compra</label>
            <input className="input input-bordered w-full" type="number" value={form.precoCompra || ""} onChange={e => handleChange("precoCompra", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Preço Venda</label>
            <input className="input input-bordered w-full" type="number" value={form.precoVenda || ""} onChange={e => handleChange("precoVenda", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Validade</label>
            <input className="input input-bordered w-full" value={form.validade || ""} onChange={e => handleChange("validade", e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold">Lote</label>
            <input className="input input-bordered w-full" value={form.lote || ""} onChange={e => handleChange("lote", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400">Guardar</button>
          <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => router.back()}>Voltar</button>
        </div>
      </form>
      {/* Aqui pode entrar associação a jangadas ou navios, se aplicável */}
    </div>
  );
}
