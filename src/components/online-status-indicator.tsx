'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineStatusIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={cn(
        'offline-indicator flex items-center justify-center gap-2',
        isOnline ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Conexão restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Modo offline - Funcionalidades limitadas</span>
        </>
      )}
    </div>
  );
}