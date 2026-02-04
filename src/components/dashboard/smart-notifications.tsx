"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusItem } from "@/hooks/use-status-dashboard";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useState } from "react";

interface SmartNotificationsProps {
  items: StatusItem[];
}

export function SmartNotifications({ items }: SmartNotificationsProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const generateNotifications = () => {
    const notifications: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info' | 'success';
      title: string;
      message: string;
      action?: string;
      actionUrl?: string;
      priority: number;
    }> = [];

    // Notificações baseadas em itens críticos
    const criticalItems = items.filter(item => item.status === 'critico' && !dismissedNotifications.has(`critical-${item.id}`));
    if (criticalItems.length > 0) {
      notifications.push({
        id: 'critical-maintenance',
        type: 'critical',
        title: 'Manutenção Crítica Requerida',
        message: `${criticalItems.length} equipamento(s) vencem em até 7 dias. Ação imediata necessária.`,
        action: 'Agendar Manutenção',
        actionUrl: '/gestao/agenda',
        priority: 1
      });
    }

    // Notificações baseadas em itens urgentes
    const urgentItems = items.filter(item => item.status === 'urgente' && !dismissedNotifications.has(`urgent-${item.id}`));
    if (urgentItems.length > 0) {
      notifications.push({
        id: 'urgent-maintenance',
        type: 'warning',
        title: 'Manutenção Urgente Necessária',
        message: `${urgentItems.length} equipamento(s) vencem em até 30 dias. Planeje a manutenção.`,
        action: 'Ver Equipamentos',
        actionUrl: '/jangadas',
        priority: 2
      });
    }

    // Notificações preventivas
    const attentionItems = items.filter(item => item.status === 'atencao' && !dismissedNotifications.has(`attention-${item.id}`));
    if (attentionItems.length > 0) {
      notifications.push({
        id: 'preventive-maintenance',
        type: 'info',
        title: 'Manutenção Preventiva Recomendada',
        message: `${attentionItems.length} equipamento(s) vencem em até 60 dias. Considere agendamento.`,
        action: 'Agendar Preventiva',
        actionUrl: '/gestao/agenda',
        priority: 3
      });
    }

    // Notificação de sistema saudável
    if (items.filter(item => item.status === 'critico' || item.status === 'urgente').length === 0) {
      notifications.push({
        id: 'system-healthy',
        type: 'success',
        title: 'Sistema em Boas Condições',
        message: 'Todos os equipamentos estão dentro dos parâmetros de segurança.',
        priority: 4
      });
    }

    // Notificações específicas por tipo
    const jangadasCriticas = items.filter(item => item.tipo === 'jangada' && item.status === 'critico');
    if (jangadasCriticas.length > 0) {
      notifications.push({
        id: 'jangada-inspection',
        type: 'critical',
        title: 'Inspeção de Jangadas Urgente',
        message: `${jangadasCriticas.length} jangada(s) requerem inspeção imediata conforme normas SOLAS.`,
        action: 'Iniciar Inspeção',
        actionUrl: '/jangadas',
        priority: 1
      });
    }

    const cilindrosCriticos = items.filter(item => item.tipo === 'cilindro' && item.status === 'critico');
    if (cilindrosCriticos.length > 0) {
      notifications.push({
        id: 'cilindro-test',
        type: 'critical',
        title: 'Teste de Cilindros Urgente',
        message: `${cilindrosCriticos.length} cilindro(s) precisam de teste hidráulico imediato.`,
        action: 'Agendar Teste',
        actionUrl: '/cilindros',
        priority: 1
      });
    }

    return notifications.sort((a, b) => a.priority - b.priority);
  };

  const notifications = generateNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'critical': return <Badge variant="destructive">Crítico</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Aviso</Badge>;
      case 'info': return <Badge variant="outline">Info</Badge>;
      case 'success': return <Badge variant="outline" className="bg-green-100 text-green-800">Sucesso</Badge>;
      default: return <Badge variant="outline">Notificação</Badge>;
    }
  };

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notificações Inteligentes
        </CardTitle>
        <CardDescription>
          Alertas automáticos baseados no status dos equipamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start justify-between p-4 border rounded-lg ${
                notification.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
                notification.type === 'warning' ? 'border-orange-200 bg-orange-50 dark:bg-orange-950' :
                notification.type === 'info' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950' :
                'border-green-200 bg-green-50 dark:bg-green-950'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    {getNotificationBadge(notification.type)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  {notification.action && notification.actionUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={notification.actionUrl}>
                        {notification.action}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}