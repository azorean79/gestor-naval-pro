"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] runtime error:", error);
  }, [error]);

  return (
    <html lang="pt">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">GestorNavalPro</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Ocorreu um erro inesperado</h1>
          <p className="mt-3 text-sm text-slate-600">
            Já registámos o problema. Podes tentar recarregar a aplicação ou voltar ao dashboard.
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
      </body>
    </html>
  );
}
