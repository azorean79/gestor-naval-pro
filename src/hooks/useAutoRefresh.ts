"use client";
import { useEffect, useRef, useCallback, useState } from "react";

export function useAutoRefresh(
  callback: () => void,
  intervalMs = 60000,
  enabled = true
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(enabled);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(callback, intervalMs);
  }, [callback, intervalMs]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoRefresh) start();
    else stop();
    return stop;
  }, [autoRefresh, start, stop]);

  return { autoRefresh, setAutoRefresh };
}
