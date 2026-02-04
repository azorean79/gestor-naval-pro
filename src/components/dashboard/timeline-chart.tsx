"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusItem } from "@/hooks/use-status-dashboard";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface TimelineChartProps {
  items: StatusItem[];
}

export function TimelineChart({ items }: TimelineChartProps) {
  const getStatusColor = (status: StatusItem['status']) => {
    switch (status) {
      case 'critico': return 'bg-red-500';
      case 'urgente': return 'bg-orange-500';
      case 'atencao': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: StatusItem['status']) => {
    switch (status) {
      case 'critico': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'urgente': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'atencao': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'normal': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: StatusItem['status']) => {
    switch (status) {
      case 'critico': return 'Crítico';
      case 'urgente': return 'Urgente';
      case 'atencao': return 'Atenção';
      case 'normal': return 'Normal';
      default: return 'Desconhecido';
    }
  };

  // Agrupar por semanas
  const groupedByWeek = items.reduce((acc, item) => {
    const weekStart = new Date(item.dataExpiracao);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(item);
    return acc;
  }, {} as Record<string, StatusItem[]>);

  const sortedWeeks = Object.keys(groupedByWeek).sort();

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Timeline de Expiração
        </CardTitle>
        <CardDescription>
          Cronograma de vencimentos dos próximos 90 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedWeeks.slice(0, 8).map((weekKey) => {
            const weekItems = groupedByWeek[weekKey];
            const weekDate = new Date(weekKey);
            const isCurrentWeek = weekDate <= new Date() && new Date() <= new Date(weekDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            return (
              <div key={weekKey} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${isCurrentWeek ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <div className="w-px h-16 bg-gray-200 mt-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">
                      Semana de {weekDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      {isCurrentWeek && <Badge variant="outline" className="ml-2">Esta semana</Badge>}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {weekItems.length} item{weekItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {weekItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium">{item.nome}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {item.diasRestantes} dias
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`} />
                        </div>
                      </div>
                    ))}
                    {weekItems.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{weekItems.length - 3} itens adicionais
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}