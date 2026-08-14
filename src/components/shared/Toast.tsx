"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

const listeners = new Set<(toasts: ToastItem[]) => void>();
let memoryToasts: ToastItem[] = [];

function pushToast(item: Omit<ToastItem, "id">) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const toast = { ...item, id };
  memoryToasts = [...memoryToasts, toast];
  listeners.forEach((listener) => listener(memoryToasts));
  return id;
}

function removeToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(memoryToasts));
}

export const toast = {
  success: (message: string, title?: string, duration?: number) => pushToast({ type: "success", message, title, duration }),
  error: (message: string, title?: string, duration?: number) => pushToast({ type: "error", message, title, duration }),
  info: (message: string, title?: string, duration?: number) => pushToast({ type: "info", message, title, duration }),
  warning: (message: string, title?: string, duration?: number) => pushToast({ type: "warning", message, title, duration }),
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-600" />,
  error: <AlertCircle size={18} className="text-red-600" />,
  info: <Info size={18} className="text-blue-600" />,
  warning: <AlertTriangle size={18} className="text-amber-600" />,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (next: ToastItem[]) => setToasts(next);
    listeners.add(listener);
    setToasts(memoryToasts);
    return () => { listeners.delete(listener); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((item) => (
        <ToastItemView key={item.id} item={item} />
      ))}
    </div>
  );
}

function ToastItemView({ item }: { item: ToastItem }) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const isPersistent = item.type === "error" || item.duration === 0;
  const duration = item.duration ?? (isPersistent ? 0 : 4000);

  useEffect(() => {
    const enter = setTimeout(() => setIsVisible(true), 10);
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((p) => Math.max(0, p - 100 / (duration / 50)));
      }, 50);
      const exit = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => removeToast(item.id), 300);
      }, duration);
      return () => { clearTimeout(enter); clearTimeout(exit); clearInterval(interval); };
    }
    return () => clearTimeout(enter);
  }, [item.id, duration]);

  return (
    <div
      className={`pointer-events-auto rounded-xl border p-3 shadow-lg transition-all duration-300 relative overflow-hidden ${STYLES[item.type]} ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-black/10 transition-all duration-[50ms]"
          style={{ width: `${progress}%` }}
        />
      )}
      <div className="flex items-start gap-2">
        {ICONS[item.type]}
        <div className="flex-1 min-w-0">
          {item.title && <p className="text-sm font-semibold">{item.title}</p>}
          <p className="text-sm">{item.message}</p>
        </div>
        <button
          type="button"
          onClick={() => { setIsVisible(false); setTimeout(() => removeToast(item.id), 300); }}
          className="rounded p-1 hover:bg-black/5 transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default ToastContainer;
