"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendItem {
  mes: string;
  total: number;
  aprovadas: number;
  reprovadas: number;
  comCondicoes: number;
  custo: number;
}

interface TrendChartProps {
  data: TrendItem[];
}

function formatMesLabel(mes: string) {
  const [ano, mesNum] = mes.split('-');
  return `${mesNum}/${ano.slice(2)}`;
}

export function TrendChart({ data }: TrendChartProps) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const maxCusto = Math.max(1, ...data.map((d) => d.custo));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráficos de tendências</CardTitle>
        <CardDescription>Evolução mensal de inspeções e custos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-3">Inspeções realizadas</h4>
            <div className="flex items-end gap-2 h-40">
              {data.map((item) => (
                <div key={item.mes} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-md bg-blue-500/80"
                    style={{ height: `${(item.total / maxTotal) * 100}%` }}
                    title={`${item.total} inspeções`}
                  />
                  <span className="text-[10px] text-slate-500 mt-2">{formatMesLabel(item.mes)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Custos de inspeção</h4>
            <div className="flex items-end gap-2 h-40">
              {data.map((item) => (
                <div key={item.mes} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-md bg-emerald-500/80"
                    style={{ height: `${(item.custo / maxCusto) * 100}%` }}
                    title={`€${item.custo.toLocaleString('pt-PT')}`}
                  />
                  <span className="text-[10px] text-slate-500 mt-2">{formatMesLabel(item.mes)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
