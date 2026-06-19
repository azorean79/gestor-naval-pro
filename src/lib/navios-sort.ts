type NavioLike = {
  nome?: string | null;
  matricula?: string | null;
};

function normalizeNavioLabel(value: string | null | undefined) {
  return String(value || "").trim();
}

export function sortNaviosAlphabetically<T extends NavioLike>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const nomeCompare = normalizeNavioLabel(a.nome).localeCompare(normalizeNavioLabel(b.nome), "pt", { sensitivity: "base" });
    if (nomeCompare !== 0) return nomeCompare;

    return normalizeNavioLabel(a.matricula).localeCompare(normalizeNavioLabel(b.matricula), "pt", { sensitivity: "base" });
  });
}