export default function ResultCounter({ current, total, label }: { current: number; total: number; label: string }) {
  if (total === 0) return <p className="text-xs text-slate-400">Nenhum {label} encontrado.</p>;
  return (
    <p className="text-xs text-slate-500">
      {current} de {total} {label}
      {total !== 1 ? "s" : ""}
    </p>
  );
}
