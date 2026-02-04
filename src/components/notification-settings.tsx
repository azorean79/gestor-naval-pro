'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { isSupported, permission, requestPermission, subscribe, unsubscribe, subscription } = usePushNotifications();
  const [settings, setSettings] = useState({
    alerts: true,
    inspections: true,
    maintenance: true,
    stock: true,
  });

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Permissões de notificação concedidas!');
      await subscribe();
    } else {
      toast.error('Permissões de notificação negadas.');
    }
  };

  const handleSubscribe = async () => {
    const sub = await subscribe();
    if (sub) {
      toast.success('Inscrito nas notificações push!');
    } else {
      toast.error('Falha ao se inscrever nas notificações.');
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    toast.success('Cancelada inscrição nas notificações.');
  };

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações não suportadas
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Gerencie suas preferências de notificação e permissões.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Permissões</Label>
            <p className="text-sm text-muted-foreground">
              Status: {permission === 'granted' ? 'Concedido' :
                      permission === 'denied' ? 'Negado' : 'Pendente'}
            </p>
          </div>
          {permission !== 'granted' && (
            <Button onClick={handlePermissionRequest} size="sm">
              Solicitar Permissão
            </Button>
          )}
        </div>

        {/* Push Subscription */}
        {permission === 'granted' && (
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Status: {subscription ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            {subscription ? (
              <Button onClick={handleUnsubscribe} variant="outline" size="sm">
                Desinscrever
              </Button>
            ) : (
              <Button onClick={handleSubscribe} size="sm">
                Inscrever
              </Button>
            )}
          </div>
        )}

        {/* Notification Types */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tipos de Notificação</Label>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="alerts" className="text-sm">Alertas de Segurança</Label>
                <p className="text-xs text-muted-foreground">Notificações críticas de segurança</p>
              </div>
              <Switch
                id="alerts"
                checked={settings.alerts}
                onCheckedChange={() => handleSettingChange('alerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inspections" className="text-sm">Lembretes de Inspeção</Label>
                <p className="text-xs text-muted-foreground">Lembretes de inspeções programadas</p>
              </div>
              <Switch
                id="inspections"
                checked={settings.inspections}
                onCheckedChange={() => handleSettingChange('inspections')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance" className="text-sm">Manutenção</Label>
                <p className="text-xs text-muted-foreground">Alertas de manutenção preventiva</p>
              </div>
              <Switch
                id="maintenance"
                checked={settings.maintenance}
                onCheckedChange={() => handleSettingChange('maintenance')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="stock" className="text-sm">Controle de Stock</Label>
                <p className="text-xs text-muted-foreground">Alertas de stock baixo</p>
              </div>
              <Switch
                id="stock"
                checked={settings.stock}
                onCheckedChange={() => handleSettingChange('stock')}
              />
            </div>
          </div>
        )}

        {/* Test Notification */}
        {permission === 'granted' && subscription && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                new Notification('Teste de Notificação', {
                  body: 'Esta é uma notificação de teste do Gestor Naval Pro',
                  icon: '/icon-192x192.png',
                });
                toast.success('Notificação de teste enviada!');
              }}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Testar Notificação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}