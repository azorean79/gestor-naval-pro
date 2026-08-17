"use client";

import { useEffect, useState, use } from "react";
import { Loader2, AlertCircle, FileText, CreditCard, CalendarClock, Building2 } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

const PAGAMENTO_BADGE_CLASSES: Record<string, string> = {
  Pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Pago Parcialmente": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Pago: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Vencido: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

type PublicFatura = {
  numeroFatura: string;
  numeroOrdem?: string | null;
  clienteNome?: string | null;
  valorTotal?: number | null;
  pagamentoStatus?: string | null;
  dataEmissao?: string | null;
  dataVencimento?: string | null;
};

export default function PublicFaturaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [fatura, setFatura] = useState<PublicFatura | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFatura() {
      try {
        const res = await fetch(`/api/public/fatura/${token}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Fatura não encontrada.");
        const data = await res.json();
        setFatura(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao carregar fatura.");
      } finally {
        setLoading(false);
      }
    }
    loadFatura();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-teal-400">
          <Loader2 className="animate-spin" size={24} /> A carregar fatura...
        </div>
      </div>
    );
  }

  if (error || !fatura) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="mx-auto text-rose-500" size={48} />
          <h1 className="text-lg font-bold text-white">Fatura Indisponível</h1>
          <p className="text-sm text-slate-400">{error || "Não foi possível encontrar esta fatura."}</p>
        </div>
      </div>
    );
  }

  const pagamentoStatus = fatura.pagamentoStatus || "Pendente";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm mb-1">
              <FileText size={18} /> Fatura
            </div>
            <h1 className="text-2xl font-black text-white">Fatura #{fatura.numeroFatura}</h1>
            {fatura.numeroOrdem && (
              <p className="text-xs text-slate-400 mt-1">Ordem de Serviço: {fatura.numeroOrdem}</p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${PAGAMENTO_BADGE_CLASSES[pagamentoStatus] || PAGAMENTO_BADGE_CLASSES.Pendente}`}>
            <CreditCard size={12} /> Pagamento: {pagamentoStatus}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-teal-400">
            <Building2 size={16} /> Detalhe
          </div>
          <dl className="divide-y divide-slate-800 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-slate-400">Cliente</dt>
              <dd className="text-slate-200 font-medium">{fatura.clienteNome || "—"}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-400">Valor Total</dt>
              <dd className="text-teal-300 font-bold font-mono">€ {Number(fatura.valorTotal || 0).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-400 flex items-center gap-1.5"><CalendarClock size={14} /> Data de emissão</dt>
              <dd className="text-slate-200">{formatDate(fatura.dataEmissao)}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-slate-400">Vencimento</dt>
              <dd className="text-slate-200">{formatDate(fatura.dataVencimento)}</dd>
            </div>
          </dl>
        </div>

        <p className="text-center text-xs text-slate-500">
          Para qualquer dúvida sobre esta fatura, contacte-nos através dos canais habituais.
        </p>
      </div>
    </div>
  );
}
