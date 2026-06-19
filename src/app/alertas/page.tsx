"use client";

import { useEffect, useState } from "react";

type Alerta = {
  tipo: "inspecao" | "certificado";
  id: number;
  referencia: string;
  data?: string | null;
  jangadaId?: number | null;
  jangadaSerial?: string | null;
  status?: string | null;
  sourceYear?: number | null;
};

type AlertsPayload = {
  total: number;
  inspecoes: number;
  certificados: number;
  alertas: Alerta[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString("pt-PT");
}

export default function AlertasPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<AlertsPayload>({ total: 0, inspecoes: 0, certificados: 0, alertas: [] });

  useEffect(() => {
    async function run() {
      setLoading(true);
      try {
        const res = await fetch("/api/alertas");
        const data = await res.json();
        setPayload({
          total: Number(data?.total || 0),
          inspecoes: Number(data?.inspecoes || 0),
          certificados: Number(data?.certificados || 0),
          alertas: Array.isArray(data?.alertas) ? data.alertas : [],
        });
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Expiração (30 dias)</h1>
          <p className="text-sm text-gray-600 mt-1">Monitorização automática de inspeções e certificados próximos do vencimento.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Total de alertas</p>
            <p className="text-2xl font-bold text-red-600">{payload.total}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Inspeções</p>
            <p className="text-2xl font-bold text-indigo-600">{payload.inspecoes}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">Certificados</p>
            <p className="text-2xl font-bold text-amber-600">{payload.certificados}</p>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          {loading ? (
            <p className="text-sm text-gray-500">A carregar alertas...</p>
          ) : payload.alertas.length === 0 ? (
            <p className="text-sm text-gray-500">Sem alertas para os próximos 30 dias.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Referência</th>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Ligação</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.alertas.map((a) => (
                    <tr key={`${a.tipo}-${a.id}`} className="border-t">
                      <td className="p-2 capitalize">{a.tipo}</td>
                      <td className="p-2">{a.referencia}</td>
                      <td className="p-2">{formatDate(a.data)}</td>
                      <td className="p-2">
                        {a.jangadaId ? (
                          <a className="text-blue-700 hover:underline" href={`/jangadas/${a.jangadaId}`}>Abrir jangada</a>
                        ) : a.jangadaSerial ? (
                          <span className="text-gray-500">Serial: {a.jangadaSerial}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
