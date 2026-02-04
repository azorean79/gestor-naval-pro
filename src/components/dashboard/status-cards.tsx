"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusItem } from "@/hooks/use-status-dashboard";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface StatusCardsProps {
  items: StatusItem[];
  summary: { critico: number; urgente: number; atencao: number; normal: number };
}

export function StatusCards({ items, summary }: StatusCardsProps) {
  const getStatusConfig = (status: StatusItem['status']) => {
    switch (status) {
      case 'critico':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          label: 'Crítico',
          description: 'Requer ação imediata'
        };
      case 'urgente':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
          label: 'Urgente',
          description: 'Ação necessária em breve'
        };
      case 'atencao':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          label: 'Atenção',
          description: 'Monitorar de perto'
        };
      case 'normal':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          label: 'Normal',
          description: 'Dentro dos parâmetros'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          label: 'Desconhecido',
          description: 'Status não identificado'
        };
    }
  };

  const statusTypes: StatusItem['status'][] = ['critico', 'urgente', 'atencao', 'normal'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statusTypes.map((statusType) => {
        const config = getStatusConfig(statusType);
        const count = summary[statusType];
        const statusItems = items.filter(item => item.status === statusType);

        return (
          <Card key={statusType} className={`${config.bgColor} ${config.borderColor} border-2`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {config.icon}
                  <CardTitle className={`text-lg ${config.color}`}>
                    {config.label}
                  </CardTitle>
                </div>
                <Badge variant={statusType === 'normal' ? 'default' : 'destructive'} className="text-lg px-2 py-1">
                  {count}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{item.nome}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {item.diasRestantes}d
                    </span>
                  </div>
                ))}
                {statusItems.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1 border-t">
                    +{statusItems.length - 3} itens adicionais
                  </div>
                )}
                {count === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Nenhum item nesta categoria
                  </div>
                )}
              </div>
              {count > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={statusType === 'critico' ? '/jangadas' : statusType === 'urgente' ? '/cilindros' : '/stock'}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}