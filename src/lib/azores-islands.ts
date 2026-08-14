const CANONICAL_AZORES_ISLANDS = [
  "São Miguel",
  "Santa Maria",
  "Terceira",
  "Graciosa",
  "São Jorge",
  "Pico",
  "Faial",
  "Flores",
  "Corvo",
] as const;

type CanonicalAzoresIsland = (typeof CANONICAL_AZORES_ISLANDS)[number];

const DIRECT_ISLAND_ALIASES: Array<[string, CanonicalAzoresIsland]> = [
  ["sao miguel", "São Miguel"],
  ["são miguel", "São Miguel"],
  ["santa maria", "Santa Maria"],
  ["terceira", "Terceira"],
  ["graciosa", "Graciosa"],
  ["sao jorge", "São Jorge"],
  ["são jorge", "São Jorge"],
  ["pico", "Pico"],
  ["faial", "Faial"],
  ["flores", "Flores"],
  ["corvo", "Corvo"],
];

const LOCALITY_TO_ISLAND: Array<[string, CanonicalAzoresIsland]> = [
  ["ponta delgada", "São Miguel"],
  ["ribeira grande", "São Miguel"],
  ["vila franca do campo", "São Miguel"],
  ["lagoa", "São Miguel"],
  ["povoacao", "São Miguel"],
  ["povoação", "São Miguel"],
  ["nordeste", "São Miguel"],
  ["vila do porto", "Santa Maria"],
  ["angra do heroismo", "Terceira"],
  ["angra do heroísmo", "Terceira"],
  ["praia da vitoria", "Terceira"],
  ["praia da vitória", "Terceira"],
  ["santa cruz da graciosa", "Graciosa"],
  ["praia da graciosa", "Graciosa"],
  ["velas", "São Jorge"],
  ["calheta", "São Jorge"],
  ["madalena", "Pico"],
  ["lajes do pico", "Pico"],
  ["sao roque do pico", "Pico"],
  ["são roque do pico", "Pico"],
  ["horta", "Faial"],
  ["santa cruz das flores", "Flores"],
  ["lajes das flores", "Flores"],
  ["vila nova do corvo", "Corvo"],
];

const PORT_TO_ISLAND: Array<[string, CanonicalAzoresIsland]> = [
  ["horta", "Faial"],
  ["ponta delgada", "São Miguel"],
  ["vila franca do campo", "São Miguel"],
  ["santa cruz das flores", "Flores"],
  ["angra do heroismo", "Terceira"],
  ["angra do heroísmo", "Terceira"],
  ["madalena", "Pico"],
  ["lajes do pico", "Pico"],
  ["sao roque do pico", "Pico"],
  ["são roque do pico", "Pico"],
  ["velas", "São Jorge"],
  ["vila do porto", "Santa Maria"],
  ["corvo", "Corvo"],
  ["santa cruz da graciosa", "Graciosa"],
  ["praia da vitoria", "Terceira"],
  ["praia da vitória", "Terceira"],
];

const INVALID_ISLAND_TOKENS = new Set([
  "",
  "n/a",
  "n d",
  "n/d",
  "nd",
  "desconhecida",
  "desconhecido",
  "sem ilha",
  "semilha",
]);

function normalizeTextToken(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesAlias(haystack: string, alias: string) {
  if (!haystack || !alias) return false;
  if (haystack === alias) return true;
  return new RegExp(`(^|\\b)${escapeRegex(alias)}(\\b|$)`, "i").test(haystack);
}

export function getCanonicalAzoresIslands() {
  return [...CANONICAL_AZORES_ISLANDS];
}

export function canonicalizeAzoresIsland(value: unknown) {
  const normalized = normalizeTextToken(value);
  if (!normalized) return null;

  for (const [alias, island] of DIRECT_ISLAND_ALIASES) {
    if (matchesAlias(normalized, normalizeTextToken(alias))) {
      return island;
    }
  }

  return null;
}

export function isInvalidIslandValue(value: unknown) {
  const rawValue = String(value ?? "").trim().toLowerCase();
  if (INVALID_ISLAND_TOKENS.has(rawValue)) return true;

  const normalized = normalizeTextToken(value);
  return INVALID_ISLAND_TOKENS.has(normalized);
}

export function inferAzoresIslandFromAddressParts(input: {
  ilha?: unknown;
  localidade?: unknown;
  morada?: unknown;
  codigoPostal?: unknown;
}) {
  const explicitIsland = canonicalizeAzoresIsland(input.ilha);
  if (explicitIsland) return explicitIsland;

  const candidates = [input.localidade, input.morada, input.codigoPostal]
    .map((value) => normalizeTextToken(value))
    .filter(Boolean);

  for (const candidate of candidates) {
    for (const [alias, island] of LOCALITY_TO_ISLAND) {
      if (matchesAlias(candidate, normalizeTextToken(alias))) {
        return island;
      }
    }
  }

  return null;
}

export function inferAzoresIslandFromPort(value: unknown) {
  const normalized = normalizeTextToken(value);
  if (!normalized) return null;

  for (const [alias, island] of PORT_TO_ISLAND) {
    if (matchesAlias(normalized, normalizeTextToken(alias))) {
      return island;
    }
  }

  return null;
}

export function normalizeClienteIslandValue(input: {
  ilha?: unknown;
  localidade?: unknown;
  morada?: unknown;
  codigoPostal?: unknown;
}) {
  const inferredIsland = inferAzoresIslandFromAddressParts(input);
  if (inferredIsland) return inferredIsland;

  const rawIsland = String(input.ilha ?? "").trim();
  return rawIsland || null;
}