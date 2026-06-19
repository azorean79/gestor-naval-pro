export type RecreioZonaKey = "zona0" | "zona1" | "zona2" | "zona3" | "zona4";

export type RecreioMandatoryCategory = {
  id: string;
  label: string;
  rows: Array<{
    item: string;
    requirement: string;
    note?: string;
  }>;
};

export type RecreioMandatoryProfile = {
  key: RecreioZonaKey;
  label: string;
  shortLabel: string;
  summary: string;
  guidanceNote: string;
  categories: RecreioMandatoryCategory[];
};

function buildRecreioCategories(
  fachosMao: string,
  foguetesParaquedas: string,
  sinalFumigeno: string,
  radioNote: string,
  jangadaNote: string,
): RecreioMandatoryCategory[] {
  return [
    {
      id: "individual",
      label: "Meios de salvamento individual",
      rows: [
        {
          item: "Coletes de salvação",
          requirement: "1 por pessoa a bordo, homologados e adequados ao utilizador.",
          note: "Confirmar estado, luminoso e apito em cada colete.",
        },
        {
          item: "Boias salva-vidas",
          requirement: "Conforme a dotação material aprovada para a embarcação.",
          note: "Verificar posição acessível e cabo de salvamento fixo.",
        },
      ],
    },
    {
      id: "coletivos",
      label: "Meios de salvação coletivos (jangadas)",
      rows: [
        {
          item: "Jangada(s) salva-vidas",
          requirement: jangadaNote,
          note: "Confirmar capacidade nominal e validade de serviço.",
        },
        {
          item: "Instalação / arrumação",
          requirement: "Acessível e pronta para lançamento de emergência.",
          note: "Verificar suporte/berço e sistema de libertação.",
        },
      ],
    },
    {
      id: "visuais",
      label: "Sinais visuais de socorro (pirotécnicos)",
      rows: [
        {
          item: "Fachos de mão",
          requirement: fachosMao,
          note: "Registar validade individualmente; substituir antes de expirar.",
        },
        {
          item: "Foguetes com paraquedas",
          requirement: foguetesParaquedas,
          note: "Confirmar acondicionamento à prova de húmidade e acessibilidade.",
        },
        {
          item: "Sinais fumígenos flutuantes",
          requirement: sinalFumigeno,
          note: "Verificar fixação e identificação a bordo.",
        },
      ],
    },
    {
      id: "radio",
      label: "Comunicações e localização",
      rows: [
        {
          item: "Rádio VHF",
          requirement: radioNote,
          note: "Verificar canal 16 e licença de estação em vigor.",
        },
        {
          item: "EPIRB / PLB",
          requirement: "Obrigatório em zonas 0, 1 e 2; recomendado na zona 3.",
          note: "Confirmar registo, bateria e validade de hidrostato.",
        },
        {
          item: "GPS",
          requirement: "Obrigatório em zonas 0 e 1; recomendado nas demais.",
          note: "Confirmar funcionamento e fixação segura a bordo.",
        },
      ],
    },
  ];
}

const CATEGORIES_ZONA0 = buildRecreioCategories(
  "Mínimo 6, todos em validade.",
  "Mínimo 12, todos em validade.",
  "Mínimo 2, todos em validade.",
  "VHF portátil e fixo obrigatórios; GMDSS recomendado.",
  "Exigida para navegação oceânica ilimitada; capacidade ≥ lotação.",
);

const CATEGORIES_ZONA1 = buildRecreioCategories(
  "Mínimo 3, todos em validade.",
  "Mínimo 6, todos em validade.",
  "Mínimo 2, todos em validade.",
  "VHF fixo obrigatório; portátil recomendado.",
  "Exigida; capacidade ≥ lotação máxima autorizada.",
);

const CATEGORIES_ZONA2 = buildRecreioCategories(
  "Mínimo 3, todos em validade.",
  "Mínimo 4, todos em validade.",
  "Mínimo 2, todos em validade.",
  "VHF fixo ou portátil obrigatório.",
  "Exigida; capacidade ≥ lotação máxima autorizada.",
);

const CATEGORIES_ZONA3 = buildRecreioCategories(
  "Mínimo 2, todos em validade.",
  "Mínimo 2, todos em validade.",
  "Mínimo 1, em validade.",
  "VHF portátil recomendado.",
  "Recomendada ou exigida conforme licença; verificar dotação aprovada.",
);

const CATEGORIES_ZONA4 = buildRecreioCategories(
  "Mínimo 2, todos em validade.",
  "Não obrigatório; recomendado 2.",
  "Não obrigatório.",
  "Rádio não obrigatório; VHF portátil recomendado.",
  "Não obrigatória; verificar licença.",
);

export const RECREIO_MANDATORY_EQUIPMENT: Record<RecreioZonaKey, RecreioMandatoryProfile> = {
  zona0: {
    key: "zona0",
    label: "Náutica de Recreio · Zona 0 — Oceânica",
    shortLabel: "Zona 0 — Oceânica",
    summary: "Navegação oceânica ilimitada; máxima dotação de salvação e comunicações.",
    guidanceNote: "DL 124/2004 · Portaria 1228/2004: confirmar sempre contra documentação oficial da embarcação.",
    categories: CATEGORIES_ZONA0,
  },
  zona1: {
    key: "zona1",
    label: "Náutica de Recreio · Zona 1 — Largo",
    shortLabel: "Zona 1 — Largo",
    summary: "Navegação até 200 milhas náuticas da costa.",
    guidanceNote: "DL 124/2004 · Portaria 1228/2004: confirmar sempre contra documentação oficial da embarcação.",
    categories: CATEGORIES_ZONA1,
  },
  zona2: {
    key: "zona2",
    label: "Náutica de Recreio · Zona 2 — Costeira",
    shortLabel: "Zona 2 — Costeira",
    summary: "Navegação até 20 milhas náuticas da costa.",
    guidanceNote: "DL 124/2004 · Portaria 1228/2004: confirmar sempre contra documentação oficial da embarcação.",
    categories: CATEGORIES_ZONA2,
  },
  zona3: {
    key: "zona3",
    label: "Náutica de Recreio · Zona 3 — Abrigada",
    shortLabel: "Zona 3 — Abrigada",
    summary: "Navegação em águas abrigadas, até 6 milhas náuticas da costa.",
    guidanceNote: "DL 124/2004 · Portaria 1228/2004: confirmar sempre contra documentação oficial da embarcação.",
    categories: CATEGORIES_ZONA3,
  },
  zona4: {
    key: "zona4",
    label: "Náutica de Recreio · Zona 4 — Interior / Restrita",
    shortLabel: "Zona 4 — Interior",
    summary: "Navegação em águas interiores e portos abrigados.",
    guidanceNote: "DL 124/2004 · Portaria 1228/2004: confirmar sempre contra documentação oficial da embarcação.",
    categories: CATEGORIES_ZONA4,
  },
};

export const RECREIO_ZONA_OPTIONS: Array<{ key: RecreioZonaKey; label: string }> = [
  { key: "zona0", label: "Zona 0 — Oceânica" },
  { key: "zona1", label: "Zona 1 — Largo" },
  { key: "zona2", label: "Zona 2 — Costeira" },
  { key: "zona3", label: "Zona 3 — Abrigada" },
  { key: "zona4", label: "Zona 4 — Interior / Restrita" },
];

export function getRecreioMandatoryProfile(zonaNavegacao: unknown): RecreioMandatoryProfile | null {
  if (!zonaNavegacao) return null;
  const key = String(zonaNavegacao).trim().toLowerCase().replace(/[\s\-–—]/g, "");
  // Accept various inputs: "zona2", "2", "z2", "zona 2", "costeira", etc.
  const mapping: Record<string, RecreioZonaKey> = {
    zona0: "zona0", "0": "zona0",
    zona1: "zona1", "1": "zona1",
    zona2: "zona2", "2": "zona2",
    zona3: "zona3", "3": "zona3",
    zona4: "zona4", "4": "zona4",
  };
  const resolved = mapping[key] ?? null;
  return resolved ? RECREIO_MANDATORY_EQUIPMENT[resolved] : null;
}
