"use client";

import React, { useEffect, useState } from "react";
import { Wrench, Plus, Edit, Trash2, ShieldAlert, Cpu, Gauge } from "lucide-react";
import { appToast } from "@/lib/app-toast";

type EquipOficina = {
  id: number;
  nome: string;
  referencia: string;
  tipo: string; // "barometro" | "manometro" | "balanca" | "compressor_filtro" | "compressor_oleo" | "compressor_ar"
  dataCalibracao: string;
  dataProxCalibracao: string;
  certificadoNum: string | null;
  certificadoUrl: string | null;
  ativo: boolean;
  observacoes: string | null;
};

const INITIAL_FORM = {
  nome: "",
  referencia: "",
  tipo: "barometro",
  dataCalibracao: "",
  dataProxCalibracao: "",
  certificadoNum: "",
  certificadoUrl: "",
  ativo: true,
  observacoes: "",
};

export default function OficinaPage() {
  const [items, setItems] = useState<EquipOficina[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"calibracao" | "compressor">("calibracao");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/equipamentos-calibracao");
      if (!res.ok) throw new Error("Erro ao carregar equipamentos de oficina");
      const data = await res.json();
      setItems(data);
    } catch (err: unknown) {
      appToast.error(err instanceof Error ? err.message : "Erro ao carregar equipamentos de oficina");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.referencia || !form.dataCalibracao || !form.dataProxCalibracao) {
      appToast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const url = editId ? `/api/equipamentos-calibracao/${editId}` : "/api/equipamentos-calibracao";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar");
      }

      appToast.success("Equipamento gravado com sucesso");
      setShowModal(false);
      setForm(INITIAL_FORM);
      setEditId(null);
      fetchItems();
    } catch (err: unknown) {
      appToast.error(err instanceof Error ? err.message : "Erro ao guardar equipamento");
    }
  }

  function handleOpenCreate() {
    setForm(INITIAL_FORM);
    setEditId(null);
    setShowModal(true);
  }

  function handleOpenEdit(item: EquipOficina) {
    setForm({
      nome: item.nome,
      referencia: item.referencia,
      tipo: item.tipo,
      dataCalibracao: item.dataCalibracao ? new Date(item.dataCalibracao).toISOString().slice(0, 10) : "",
      dataProxCalibracao: item.dataProxCalibracao ? new Date(item.dataProxCalibracao).toISOString().slice(0, 10) : "",
      certificadoNum: item.certificadoNum || "",
      certificadoUrl: item.certificadoUrl || "",
      ativo: item.ativo,
      observacoes: item.observacoes || "",
    });
    setEditId(item.id);
    setShowModal(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja eliminar este registo?")) return;
    try {
      const res = await fetch(`/api/equipamentos-calibracao/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao eliminar");
      appToast.success("Registo eliminado");
      fetchItems();
    } catch (err: unknown) {
      appToast.error(err instanceof Error ? err.message : "Erro ao eliminar");
    }
  }

  const calibracaoTypes = ["barometro", "manometro", "balanca", "calibracao"];
  const calibracoesList = items.filter(i => calibracaoTypes.includes(i.tipo));
  const compressor = items.filter(i => i.tipo.startsWith("compressor"));

  // Alertas
  const getStatus = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Vencido", color: "bg-red-100 text-red-800 border-red-200" };
    if (days <= 30) return { label: "A Vencer (30d)", color: "bg-orange-100 text-orange-800 border-orange-200" };
    return { label: "Válido", color: "bg-green-100 text-green-800 border-green-200" };
  };

  const expiredCount = items.filter(i => new Date(i.dataProxCalibracao).getTime() < Date.now()).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-slate-800 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-slate-700">
          <div className="absolute top-0 right-0 opacity-10">
            <Wrench className="w-64 h-64 -mt-10 -mr-10" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="bg-sky-400/20 text-sky-200 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">OFICINA & CONTROLO</span>
              <h1 className="text-3xl font-black mt-2">Gestão de Oficina</h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Controle o calendário de calibração das suas ferramentas críticas (Barómetros de Pressão Atmosférica, Manómetros e Balanças) e a manutenção programada do Compressor.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo Registo
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        {expiredCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <p className="font-bold">Atenção: Equipamentos Expirados!</p>
              <p className="text-xs text-red-700">Existem {expiredCount} registos cuja calibração ou manutenção está vencida. Regularize para garantir conformidade legal.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab("calibracao")}
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "calibracao" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gauge className="w-4 h-4" />
            Calibração de Ferramentas
          </button>
          <button
            onClick={() => setActiveTab("compressor")}
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "compressor" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Manutenção do Compressor
          </button>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                <th className="p-4">Referência</th>
                <th className="p-4">Nome do Equipamento</th>
                <th className="p-4">Subtipo / Categoria</th>
                <th className="p-4">Última Data</th>
                <th className="p-4">Próxima Data</th>
                <th className="p-4">Certificado / Doc</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">A carregar...</td>
                </tr>
              ) : (activeTab === "calibracao" ? calibracoesList : compressor).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 italic">Nenhum registo nesta categoria.</td>
                </tr>
              ) : (
                (activeTab === "calibracao" ? calibracoesList : compressor).map((item) => {
                  const status = getStatus(item.dataProxCalibracao);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-800">{item.referencia}</td>
                      <td className="p-4 font-bold text-slate-900">{item.nome}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs uppercase font-semibold">
                          {item.tipo.replace("compressor_", "")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{new Date(item.dataCalibracao).toLocaleDateString("pt-PT")}</td>
                      <td className="p-4 font-semibold text-slate-900">{new Date(item.dataProxCalibracao).toLocaleDateString("pt-PT")}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{item.certificadoNum || "—"}</span>
                          {item.certificadoUrl && (
                            <a
                              href={`/api/documentacao/${item.certificadoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded hover:bg-slate-100 inline-flex items-center"
                              title="Ver Certificado"
                            >
                              📎
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 inline-flex items-center"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 inline-flex items-center"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Slide-over Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/45 backdrop-blur-sm transition-all" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col" style={{ height: '100dvh', maxHeight: '100vh' }}>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editId ? "Editar Registo" : "Novo Registo"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Registo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <optgroup label="Calibrações">
                      <option value="barometro">Barómetro (Pressão Atmosférica)</option>
                      <option value="manometro">Manómetro (Pressão)</option>
                      <option value="balanca">Balança de Precisão</option>
                    </optgroup>
                    <optgroup label="Compressor Bauer">
                      <option value="compressor_filtro">Substituição do Filtro</option>
                      <option value="compressor_oleo">Mudança de Óleo</option>
                      <option value="compressor_ar">Teste de Pureza do Ar</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Referência / Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BAR-01, COMP-FILTER"
                    value={form.referencia}
                    onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Equipamento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Barómetro Digital, Filtro de Carvão Activo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Última Data *</label>
                    <input
                      type="date"
                      required
                      value={form.dataCalibracao}
                      onChange={(e) => setForm({ ...form, dataCalibracao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Próxima Data *</label>
                    <input
                      type="date"
                      required
                      value={form.dataProxCalibracao}
                      onChange={(e) => setForm({ ...form, dataProxCalibracao: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nº Certificado / Documento</label>
                  <input
                    type="text"
                    placeholder="Ex: CERT-2026-XYZ"
                    value={form.certificadoNum}
                    onChange={(e) => setForm({ ...form, certificadoNum: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
                  <textarea
                    rows={2}
                    placeholder="Insira notas adicionais..."
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload do Certificado (PDF / Imagem)</label>
                  {form.certificadoUrl ? (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <a
                        href={`/api/documentacao/${form.certificadoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm truncate max-w-[220px]"
                      >
                        {form.certificadoUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, certificadoUrl: "" })}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const uploadFormData = new FormData();
                        uploadFormData.append("file", file);
                        uploadFormData.append("folder", "documentacao");

                        try {
                          const res = await fetch("/api/upload-documento", {
                            method: "POST",
                            body: uploadFormData,
                          });

                          if (!res.ok) {
                            const errData = await res.json();
                            throw new Error(errData.error || "Erro no upload");
                          }

                          const data = await res.json();
                          setForm({ ...form, certificadoUrl: data.filename });
                          appToast.success("Ficheiro carregado com sucesso!");
                        } catch (err: unknown) {
                          appToast.error(err instanceof Error ? err.message : "Erro ao carregar ficheiro");
                        }
                      }}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 active:scale-95"
                >
                  💾 Gravar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
