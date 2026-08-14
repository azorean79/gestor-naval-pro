"use client";

import { useEffect } from "react";
import Link from "next/link";

export function RouteError({
  error,
  reset,
  routeLabel,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  routeLabel: string;
}) {
  useEffect(() => {
    console.error(`[${routeLabel}] runtime error:`, error);
  }, [error, routeLabel]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">{routeLabel}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Ocorreu um erro</h1>
        <p className="mt-3 text-sm text-slate-600">
          Já registámos o problema. Podes tentar recarregar esta vista ou voltar ao dashboard.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Tentar novamente
          </button>
          <Link href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Dashboard
          </Link>
        </div>
        <details className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-auto max-h-60">
          <summary className="text-xs font-bold text-slate-500 cursor-pointer">Detalhes do erro</summary>
          <pre className="mt-2 font-mono text-xs text-red-600 whitespace-pre-wrap">{error?.message}</pre>
          <pre className="mt-1 font-mono text-xs text-slate-400 whitespace-pre-wrap">{error?.stack}</pre>
        </details>
        {error?.digest && <p className="mt-4 text-xs text-slate-400">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}

export function RouteLoading({ label }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">A carregar{label ? ` ${label}` : ""}...</p>
      </div>
    </div>
  );
}
