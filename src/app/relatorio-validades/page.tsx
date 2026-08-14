"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, UtensilsCrossed, Package, Ship, Calendar } from "lucide-react";
import { formatValidityDisplay } from "@/lib/date-display";

type ValidityItem = {
  id: number;
  name?: string;
  quantidade?: number;
  validade?: string;
  serial?: string;
  marca?: string;
  modelo?: string;
  descricao?: string;
  referencia?: string;
  dataProxInspecao?: string;
  Jangada?: { serial: string; brand: string; model: string };
  navio?: { nome: string };
};

export default function RelatorioValidadesPage() {
  const [data, setData] = useState<{
    agua: ValidityItem[]; racoes: ValidityItem[]; coletes: ValidityItem[]; stock: ValidityItem[]; totais: Record<string, number>
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/relatorio-validades").then((r) => r.ok ? r.json() : null).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">A carregar...</div>;

  const sections = [
    { key: "agua", icon: <Droplets size={16} />, label: "Água", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
    { key: "racoes", icon: <UtensilsCrossed size={16} />, label: "Rações", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { key: "coletes", icon: <Ship size={16} />, label: "Coletes", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { key: "stock", icon: <Package size={16} />, label: "Stock", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-500" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Validades a expirar</h1>
            <p className="text-sm text-slate-500">Artigos com validade nos próximos 30 dias</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((s) => (
            <div key={s.key} className={`rounded-xl border p-4 ${s.color}`}>
              <div className="flex items-center gap-2 text-sm font-semibold">{s.icon}{s.label}</div>
              <p className="mt-1 text-2xl font-bold">{data?.totais[s.key] ?? 0}</p>
            </div>
          ))}
        </div>

        {sections.map((s) => {
          const items = data?.[s.key as keyof typeof data] as ValidityItem[] | undefined;
          if (!items?.length) return null;
          return (
            <div key={s.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className={`px-4 py-3 border-b font-semibold text-sm flex items-center gap-2 ${s.color}`}>
                {s.icon}{s.label} · {items.length} a expirar
              </div>
              <div className="divide-y divide-slate-100 text-sm">
                {items.map((item, i) => (
                  <div key={item.id ?? i} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">
                        {item.name || item.descricao || `${item.marca} ${item.modelo}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.Jangada && `${item.Jangada.brand} ${item.Jangada.model} (${item.Jangada.serial})`}
                        {item.navio?.nome && `Navio: ${item.navio.nome}`}
                        {item.serial && `Série: ${item.serial}`}
                        {item.referencia && `Ref: ${item.referencia}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="font-semibold text-red-600">
                        {formatValidityDisplay(item.validade || item.dataProxInspecao)}
                      </span>
                      {item.quantidade != null && <span className="text-slate-500">Qtd: {item.quantidade}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {(!data?.agua?.length && !data?.racoes?.length && !data?.coletes?.length && !data?.stock?.length) && (
          <div className="text-center py-16 text-slate-400">
            <Calendar size={40} className="mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Nenhum artigo a expirar nos próximos 30 dias</p>
          </div>
        )}
      </div>
    </div>
  );
}
