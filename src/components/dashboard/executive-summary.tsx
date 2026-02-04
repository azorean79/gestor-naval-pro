"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";

interface ExecutiveSummaryProps {
  resumo: {
    totalInspecoes: number;
    aprovadas: number;
    reprovadas: number;
    comCondicoes: number;
    taxaAprovacao: number;
    custoTotalInspecoes: number;
  };
  kpis: {
    inspecoesVencidas: number;
    cronogramasVencidos: number;
    alertasStock: number;
  };
}

export function ExecutiveSummary({ resumo, kpis }: ExecutiveSummaryProps) {
  const statusSistema = kpis.inspecoesVencidas > 0 || kpis.cronogramasVencidos > 0 || kpis.alertasStock > 0
    ? 'Atenção necessária'
    : 'Sistema estável';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumo Executivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusSistema === 'Sistema estável' ? 'outline' : 'destructive'}>
            {statusSistema}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {resumo.taxaAprovacao}% aprovação
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="text-xs text-slate-500">Inspeções no período</div>
            <div className="text-xl font-bold">{resumo.totalInspecoes}</div>
            <div className="text-xs text-slate-500">
              {resumo.aprovadas} aprovadas · {resumo.reprovadas} reprovadas
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="text-xs text-slate-500">Custos associados</div>
            <div className="text-xl font-bold">€{resumo.custoTotalInspecoes.toLocaleString('pt-PT')}</div>
            <div className="text-xs text-slate-500">Somatório dos custos de inspeção</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border">
            <div className="text-xs text-slate-500">Pendências críticas</div>
            <div className="text-xl font-bold">{kpis.inspecoesVencidas + kpis.cronogramasVencidos}</div>
            <div className="text-xs text-slate-500">Inspeções e manutenções vencidas</div>
          </div>
        </div>

        {(kpis.inspecoesVencidas > 0 || kpis.cronogramasVencidos > 0 || kpis.alertasStock > 0) && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              Há {kpis.inspecoesVencidas} inspeções vencidas, {kpis.cronogramasVencidos} manutenções atrasadas e {kpis.alertasStock} alertas de stock. Recomenda-se priorizar estas ações.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
