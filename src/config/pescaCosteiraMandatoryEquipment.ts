export type PescaCosteiraLengthBandKey = "ate14" | "de14a24" | "mais24";

export type PescaCosteiraMandatoryCategory = {
  id: string;
  label: string;
  rows: Array<{
    item: string;
    requirement: string;
    note?: string;
  }>;
};

export type PescaCosteiraMandatoryEquipmentProfile = {
  key: PescaCosteiraLengthBandKey;
  label: string;
  shortLabel: string;
  summary: string;
  guidanceNote: string;
  categories: PescaCosteiraMandatoryCategory[];
};

function buildCategories(
  fachosMao: string,
  foguetesParaquedas: string,
  sinalFumigeno: string,
): PescaCosteiraMandatoryCategory[] {
  return [
    {
      id: "individual",
      label: "Meios de salvamento individual",
      rows: [
        {
          item: "Coletes de salvação",
          requirement: "1 por pessoa da lotação autorizada, homologados e em bom estado.",
          note: "Confirmar estado, arrumação e adequação à tripulação embarcada.",
        },
        {
          item: "Acessórios dos meios individuais",
          requirement: "Luzes e apitos em todos os coletes; retroreflectores conforme exigido.",
          note: "Validar presença nos coletes/equipamentos onde aplicável.",
        },
        {
          item: "Boias salva-vidas / meios de lançamento rápido",
          requirement: "Conforme a dotação material aprovada para a embarcação.",
          note: "Cruzar com a licença/certificado e posição a bordo.",
        },
      ],
    },
    {
      id: "coletivos",
      label: "Meios de salvação coletivos (jangadas)",
      rows: [
        {
          item: "Jangada(s) salva-vidas",
          requirement: "Capacidade total ≥ lotação autorizada; prontas para abandono rápido.",
          note: "Confirmar capacidade nominal e validade de serviço.",
        },
        {
          item: "Instalação / arrumação",
          requirement: "Montagem compatível com o método de lançamento e abandono previsto.",
          note: "Verificar acessibilidade e condição de suporte/berço.",
        },
        {
          item: "Libertação / sistema associado",
          requirement: "Conforme a aprovação da embarcação e da instalação da jangada.",
          note: "Incluir verificação de componentes associados quando exigidos.",
        },
      ],
    },
    {
      id: "visuais",
      label: "Sinais visuais de socorro",
      rows: [
        {
          item: "Fachos de mão",
          requirement: fachosMao,
          note: "Registar quantidade e validade individualmente.",
        },
        {
          item: "Foguetes com paraquedas",
          requirement: foguetesParaquedas,
          note: "Confirmar acondicionamento e acessibilidade.",
        },
        {
          item: "Sinais fumígenos",
          requirement: sinalFumigeno,
          note: "Cruzar com a quantidade efetiva de bordo.",
        },
      ],
    },
    {
      id: "outros",
      label: "Outros meios de socorro e emergência",
      rows: [
        {
          item: "Meios rádio / pedido de socorro",
          requirement: "Conforme a licença, certificado e equipamento efetivamente instalado.",
          note: "Incluir verificação operacional e fonte de alimentação quando aplicável.",
        },
        {
          item: "Equipamento complementar de emergência",
          requirement: "Segundo o enquadramento técnico e documental da embarcação.",
          note: "Fechar sempre a validação com a documentação oficial em vigor.",
        },
      ],
    },
  ];
}

const CATEGORIES_ATE14 = buildCategories(
  "Mínimo 3, todos em validade.",
  "Mínimo 4, todos em validade.",
  "Mínimo 2, todos em validade.",
);

const CATEGORIES_DE14A24 = buildCategories(
  "Mínimo 6, todos em validade.",
  "Mínimo 4, todos em validade.",
  "Mínimo 2, todos em validade.",
);

const CATEGORIES_MAIS24 = buildCategories(
  "Mínimo 6, todos em validade.",
  "Mínimo 12, todos em validade.",
  "Mínimo 4, todos em validade.",
);

export const PESCA_COSTEIRA_MANDATORY_EQUIPMENT: Record<PescaCosteiraLengthBandKey, PescaCosteiraMandatoryEquipmentProfile> = {
  ate14: {
    key: "ate14",
    label: "Pesca Costeira · Até 14 m de comprimento",
    shortLabel: "Até 14 m",
    summary: "Escalão para embarcações de pesca costeira com comprimento até 14 metros, organizado pelas categorias operacionais da tabela.",
    guidanceNote: "Usar este escalão apenas quando a embarcação estiver classificada como Pesca Costeira e o comprimento registado for até 14 m.",
    categories: CATEGORIES_ATE14,
  },
  de14a24: {
    key: "de14a24",
    label: "Pesca Costeira · De 14 a 24 m de comprimento",
    shortLabel: "14 a 24 m",
    summary: "Escalão intermédio de pesca costeira, com leitura por categoria para consulta rápida do material de socorro e salvação.",
    guidanceNote: "Usar este escalão quando o comprimento registado for superior a 14 m e até 24 m inclusive.",
    categories: CATEGORIES_DE14A24,
  },
  mais24: {
    key: "mais24",
    label: "Pesca Costeira · Mais de 24 m de comprimento",
    shortLabel: "> 24 m",
    summary: "Escalão superior para pesca costeira, apresentado pelas mesmas categorias da tabela para simplificar a validação de bordo.",
    guidanceNote: "Usar este escalão quando o comprimento registado for superior a 24 m.",
    categories: CATEGORIES_MAIS24,
  },
};

function parseLength(length: unknown) {
  if (length === null || length === undefined || length === "") return null;
  const normalized = String(length).trim().replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function getPescaCosteiraLengthBand(length: unknown): PescaCosteiraLengthBandKey | null {
  const parsed = parseLength(length);
  if (parsed === null) return null;
  if (parsed <= 14) return "ate14";
  if (parsed <= 24) return "de14a24";
  return "mais24";
}

export function getPescaCosteiraMandatoryEquipmentProfile(length: unknown) {
  const band = getPescaCosteiraLengthBand(length);
  return band ? PESCA_COSTEIRA_MANDATORY_EQUIPMENT[band] : null;
}
