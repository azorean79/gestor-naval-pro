'use client';

import { useState } from 'react';
import { usePWA } from '@/hooks/use-device';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  Download,
  RefreshCw,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function PWATestPage() {
  const { isInstalled, canInstall, installPWA } = usePWA();
  const { isSupported: pushSupported, permission, subscription, sendNotification } = usePushNotifications();
  const [testResults, setTestResults] = useState({
    pwa: false,
    offline: false,
    notifications: false,
    serviceWorker: false,
  });

  const runPWATest = () => {
    const results = {
      pwa: isInstalled,
      offline: 'serviceWorker' in navigator && 'caches' in window,
      notifications: pushSupported,
      serviceWorker: 'serviceWorker' in navigator,
    };
    setTestResults(results);
    toast.success('Teste PWA executado!');
  };

  const testNotification = () => {
    if (permission === 'granted') {
      sendNotification({
        title: 'Teste de Notificação',
        body: 'Esta é uma notificação de teste do Gestor Naval Pro',
        tag: 'test-notification',
      });
      toast.success('Notificação enviada!');
    } else {
      toast.error('Permissões de notificação não concedidas');
    }
  };

  const testOfflineCache = async () => {
    try {
      const cache = await caches.open('gestor-naval-dynamic-v1.0.0');
      await cache.add('/api/dashboard/status');
      toast.success('Cache offline testado com sucesso!');
    } catch (error) {
      toast.error('Erro ao testar cache offline');
    }
  };

  const testServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'NOTIFICATION_TEST'
      });
      toast.success('Service Worker testado!');
    } else {
      toast.error('Service Worker não suportado');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Funcionalidades PWA
          </CardTitle>
          <CardDescription>
            Teste todas as funcionalidades da Progressive Web App
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runPWATest} className="w-full">
            <TestTube className="h-4 w-4 mr-2" />
            Executar Testes PWA
          </Button>
        </CardContent>
      </Card>

      {/* PWA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Modo PWA:</span>
            <Badge variant={isInstalled ? 'default' : 'secondary'}>
              {isInstalled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {isInstalled ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Instalável:</span>
            <Badge variant={canInstall ? 'default' : 'secondary'}>
              {canInstall ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {canInstall ? 'Sim' : 'Não'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Service Worker:</span>
            <Badge variant={testResults.serviceWorker ? 'default' : 'secondary'}>
              {testResults.serviceWorker ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {testResults.serviceWorker ? 'Suportado' : 'Não suportado'}
            </Badge>
          </div>

          {canInstall && !isInstalled && (
            <Button onClick={installPWA} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Offline Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Funcionalidades Offline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Cache Offline:</span>
            <Badge variant={testResults.offline ? 'default' : 'secondary'}>
              {testResults.offline ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {testResults.offline ? 'Disponível' : 'Indisponível'}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={testOfflineCache} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Cache Offline
            </Button>

            <Button onClick={testServiceWorker} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Testar Service Worker
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Suportado:</span>
            <Badge variant={pushSupported ? 'default' : 'secondary'}>
              {pushSupported ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {pushSupported ? 'Sim' : 'Não'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Permissões:</span>
            <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
              {permission === 'granted' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {permission === 'granted' ? 'Concedido' :
               permission === 'denied' ? 'Negado' : 'Pendente'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Inscrição:</span>
            <Badge variant={subscription ? 'default' : 'secondary'}>
              {subscription ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {subscription ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {pushSupported && (
            <Button onClick={testNotification} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Testar Notificação
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Testes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${testResults.pwa ? 'bg-green-500' : 'bg-red-500'}`} />
              PWA: {testResults.pwa ? 'OK' : 'Falha'}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${testResults.offline ? 'bg-green-500' : 'bg-red-500'}`} />
              Offline: {testResults.offline ? 'OK' : 'Falha'}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${testResults.notifications ? 'bg-green-500' : 'bg-red-500'}`} />
              Notificações: {testResults.notifications ? 'OK' : 'Falha'}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${testResults.serviceWorker ? 'bg-green-500' : 'bg-red-500'}`} />
              Service Worker: {testResults.serviceWorker ? 'OK' : 'Falha'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}