"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 space-y-3">
      <h2 className="text-lg font-semibold text-red-700">Erro nos fatos de imersão</h2>
      <p className="text-sm text-slate-600">{error.message}</p>
      <button onClick={reset} className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm">
        Tentar novamente
      </button>
    </div>
  );
}
