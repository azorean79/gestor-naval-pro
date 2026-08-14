"use client";
import { useEffect, useCallback } from 'react';

export function useUnsavedChanges(hasChanges: boolean, message?: string) {
  const defaultMsg = 'Tem alterações não guardadas. Tem a certeza que deseja sair?';

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!hasChanges) return;
    e.preventDefault();
    e.returnValue = '';
  }, [hasChanges]);

  useEffect(() => {
    if (!hasChanges) return;
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, handleBeforeUnload]);

  return {
    confirmLeave: () => {
      if (!hasChanges) return true;
      return window.confirm(message || defaultMsg);
    },
  };
}
