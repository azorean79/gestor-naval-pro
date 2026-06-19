"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AgendaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[agenda] runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Agenda</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Ocorreu um erro ao abrir a agenda</h1>
        <p className="mt-3 text-sm text-slate-600">
          Já registámos o problema. Podes tentar recarregar esta vista ou voltar ao dashboard.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ir para dashboard
          </Link>
        </div>

        {error?.digest ? (
          <p className="mt-4 text-xs text-slate-400">Ref: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
