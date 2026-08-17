export type TerritorioGrupo = "AÇORES" | "MADEIRA" | "CONTINENTE";

export type PortoRegiao = {
  territorioGrupo: TerritorioGrupo;
  ilha: string;
};

export const PORTO_REGIOES: Array<{ porto: string } & PortoRegiao> = [
  // Açores
  { porto: "Angra Do Heroísmo", territorioGrupo: "AÇORES", ilha: "Terceira" },
  { porto: "Praia Da Vitória", territorioGrupo: "AÇORES", ilha: "Terceira" },
  { porto: "Vila Da Praia Da Vitória", territorioGrupo: "AÇORES", ilha: "Terceira" },
  { porto: "Horta", territorioGrupo: "AÇORES", ilha: "Faial" },
  { porto: "Ponta Delgada", territorioGrupo: "AÇORES", ilha: "São Miguel" },
  { porto: "Vila Franca Do Campo", territorioGrupo: "AÇORES", ilha: "São Miguel" },
  { porto: "Velas", territorioGrupo: "AÇORES", ilha: "São Jorge" },
  { porto: "Santa Cruz Da Graciosa", territorioGrupo: "AÇORES", ilha: "Graciosa" },
  { porto: "Santa Cruz Da Flores", territorioGrupo: "AÇORES", ilha: "Flores" },
  { porto: "Vila Do Porto", territorioGrupo: "AÇORES", ilha: "Santa Maria" },
  { porto: "Lajes", territorioGrupo: "AÇORES", ilha: "Pico" },
  { porto: "Lages Do Pico", territorioGrupo: "AÇORES", ilha: "Pico" },
  { porto: "São Roque Do Pico", territorioGrupo: "AÇORES", ilha: "Pico" },
  // Madeira
  { porto: "Funchal", territorioGrupo: "MADEIRA", ilha: "Madeira" },
  { porto: "Porto Santo", territorioGrupo: "MADEIRA", ilha: "Madeira" },
  // Continente — Norte
  { porto: "Viana Do Castelo", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Âncora", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Caminha", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Esposende", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Póvoa Do Varzim", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Povoa De Varzim", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Vila Do Conde", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Leixões", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Douro", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  { porto: "Aveiro", territorioGrupo: "CONTINENTE", ilha: "Norte" },
  // Continente — Centro
  { porto: "Figueira Da Foz", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Nazaré", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "São Martinho Do Porto", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Peniche", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Ericeira", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Vila Franca De Xira", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Lisboa", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Cascais", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Trafaria", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  { porto: "Barreiro", territorioGrupo: "CONTINENTE", ilha: "Centro" },
  // Continente — Sul
  { porto: "Setúbal", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Sesimbra", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Sines", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Sagres", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Lagos", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Portimão", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Albufeira", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Quarteira", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Olhão", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Fuzeta", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Faro", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Tavira", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Vila Real De Santo António", territorioGrupo: "CONTINENTE", ilha: "Sul" },
  { porto: "Vila Real S. António", territorioGrupo: "CONTINENTE", ilha: "Sul" },
];

export const AZORES_ILHAS = [
  "Açores",
  "Corvo",
  "Flores",
  "Faial",
  "Pico",
  "São Jorge",
  "Graciosa",
  "Terceira",
  "São Miguel",
  "Santa Maria",
] as const;

export const CONTINENTE_REGIOES = ["Norte", "Centro", "Sul"] as const;

export const MADEIRA_LOCATIONS = ["Madeira"] as const;

export function normalizePortoKey(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "")
    .trim();
}

const portoLookup = new Map<string, PortoRegiao>();

for (const entry of PORTO_REGIOES) {
  portoLookup.set(normalizePortoKey(entry.porto), {
    territorioGrupo: entry.territorioGrupo,
    ilha: entry.ilha,
  });
}

export function getPortoRegiao(porto: string | null | undefined): PortoRegiao | null {
  const key = normalizePortoKey(porto);
  if (!key) return null;
  return portoLookup.get(key) || null;
}

export function getLocationOptionsForTerritorio(territorio: TerritorioGrupo | "" | null | undefined) {
  if (territorio === "CONTINENTE") return [...CONTINENTE_REGIOES] as string[];
  if (territorio === "AÇORES") return [...AZORES_ILHAS] as string[];
  if (territorio === "MADEIRA") return [...MADEIRA_LOCATIONS] as string[];
  return [...CONTINENTE_REGIOES, ...AZORES_ILHAS, ...MADEIRA_LOCATIONS];
}
