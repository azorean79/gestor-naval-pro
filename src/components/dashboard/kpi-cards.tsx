"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Anchor, Activity, Package, AlertTriangle, CalendarClock } from "lucide-react";

interface KpiCardsProps {
  kpis: {
    totalJangadas: number;
    cilindrosBomEstado: number;
    alertasStock: number;
    inspecoesVencidas: number;
    cronogramasVencidos: number;
  };
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Anchor className="h-4 w-4 text-blue-600" />
            Total de Jangadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalJangadas}</div>
          <Badge variant="outline" className="mt-2">Ativas e registradas</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-600" />
            Cilindros em bom estado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.cilindrosBomEstado}</div>
          <Badge variant="outline" className="mt-2">Status ativo</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            Alertas de stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.alertasStock}</div>
          <Badge variant={kpis.alertasStock > 0 ? "destructive" : "outline"} className="mt-2">
            {kpis.alertasStock > 0 ? "Atenção" : "Normal"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Inspeções vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.inspecoesVencidas}</div>
          <Badge variant={kpis.inspecoesVencidas > 0 ? "destructive" : "outline"} className="mt-2">
            {kpis.inspecoesVencidas > 0 ? "Urgente" : "Em dia"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-purple-600" />
            Manutenções vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.cronogramasVencidos}</div>
          <Badge variant={kpis.cronogramasVencidos > 0 ? "destructive" : "outline"} className="mt-2">
            {kpis.cronogramasVencidos > 0 ? "Planejar" : "Ok"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
