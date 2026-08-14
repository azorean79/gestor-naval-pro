"use client";
import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AlertTriangle, Package, ShieldAlert, Calendar, ClipboardList, Layers } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

type DashboardStats = {
  certificadosAte30d?: number;
  certificadosAte60d?: number;
  certificadosAte90d?: number;
  artigosEmRutura?: number;
  artigosAbaixoMinimo?: number;
  artigosVencidosStock?: number;
  jangadasConformes?: number;
  jangadasExpirarBreve?: number;
  jangadasNaoConformes?: number;
  jangadasSemArtigos?: number;
  inspecoesPorMes?: { label: string; total: number }[];
  artigosEstado?: { ok?: number; expirarBreve?: number; expirados?: number };
  jangadasPorPackType?: { packType: string; total: number }[];
};

export default function PremiumCharts({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null;

  const expirationsData = {
    labels: ['< 30 Dias', '30 - 60 Dias', '60 - 90 Dias'],
    datasets: [
      {
        label: 'Vencimentos Próximos',
        data: [
          stats.certificadosAte30d || 0,
          stats.certificadosAte60d || 0,
          stats.certificadosAte90d || 0,
        ],
        backgroundColor: ['#ef4444', '#f97316', '#eab308'],
        borderRadius: 6,
      },
    ],
  };

  const stockData = {
    labels: ['Em Rutura', 'Abaixo Mínimo', 'Vencidos'],
    datasets: [
      {
        label: 'Estado do Stock',
        data: [
          stats.artigosEmRutura || 0,
          stats.artigosAbaixoMinimo || 0,
          stats.artigosVencidosStock || 0,
        ],
        backgroundColor: ['#ef4444', '#f59e0b', '#64748b'],
        borderRadius: 6,
      },
    ],
  };

  const complianceData = {
    labels: ['Conformes', 'Expiração ≤ 90d', 'Expirados', 'Sem Artigos'],
    datasets: [
      {
        data: [
          stats.jangadasConformes || 0,
          stats.jangadasExpirarBreve || 0,
          stats.jangadasNaoConformes || 0,
          stats.jangadasSemArtigos || 0,
        ],
        backgroundColor: ['#10b981', '#fbbf24', '#f87171', '#cbd5e1'],
        borderWidth: 1,
      },
    ],
  };

  const inspectionsData = {
    labels: stats.inspecoesPorMes?.map((x) => x.label) || [],
    datasets: [
      {
        label: 'Inspeções Realizadas',
        data: stats.inspecoesPorMes?.map((x) => x.total) || [],
        backgroundColor: '#4f46e5',
        borderRadius: 6,
      },
    ],
  };

  const articlesData = {
    labels: ['Conformes', 'A expirar (≤90d)', 'Expirados'],
    datasets: [
      {
        data: [
          stats.artigosEstado?.ok || 0,
          stats.artigosEstado?.expirarBreve || 0,
          stats.artigosEstado?.expirados || 0,
        ],
        backgroundColor: ['#10b981', '#fbbf24', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const packsData = {
    labels: stats.jangadasPorPackType?.map((x) => x.packType) || [],
    datasets: [
      {
        data: stats.jangadasPorPackType?.map((x) => x.total) || [],
        backgroundColor: [
          '#6366f1',
          '#06b6d4',
          '#3b82f6',
          '#14b8a6',
          '#a855f7',
          '#f43f5e',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11 },
        },
      },
    },
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vencimentos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <AlertTriangle className="text-orange-500 w-5 h-5" />
            Alertas de Vencimentos (Certificados)
          </h3>
          <div className="h-[250px] flex-grow">
            <Bar data={expirationsData} options={chartOptions} />
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Package className="text-indigo-500 w-5 h-5" />
            Avisos Críticos de Stock
          </h3>
          <div className="h-[250px] flex-grow">
            <Bar data={stockData} options={chartOptions} />
          </div>
        </div>

        {/* Conformidade Donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <ShieldAlert className="text-emerald-500 w-5 h-5" />
            Conformidade de Consumíveis (Jangadas)
          </h3>
          <div className="h-[250px] relative flex items-center justify-center flex-grow">
            <Doughnut data={complianceData} options={donutOptions} />
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspeções 12 Meses */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Calendar className="text-indigo-600 w-5 h-5" />
            Inspeções nos Últimos 12 Meses
          </h3>
          <div className="h-[250px] flex-grow">
            <Bar data={inspectionsData} options={chartOptions} />
          </div>
        </div>

        {/* Estado Validade Artigos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <ClipboardList className="text-teal-500 w-5 h-5" />
            Estado de Validade dos Artigos
          </h3>
          <div className="h-[250px] relative flex items-center justify-center flex-grow">
            <Doughnut data={articlesData} options={donutOptions} />
          </div>
        </div>

        {/* Tipo de Pack */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Layers className="text-purple-500 w-5 h-5" />
            Distribuição por Tipo de Pack
          </h3>
          <div className="h-[250px] relative flex items-center justify-center flex-grow">
            <Doughnut data={packsData} options={donutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
