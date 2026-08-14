import { type LifejacketServiceItem } from "@/modules/lifejackets/lifejacketModelData";

export const STATUS_OPTIONS = [
  { value: "OK", label: "✓ OK - Satisfatório" },
  { value: "F", label: "✗ F - Falha" },
  { value: "S", label: "◊ S - Substituído" },
  { value: "R", label: "⟲ R - Reparado" },
];

export type MecanismoOption = {
  value: string;
  label: string;
  temPastilha: boolean;
  temValidadePropria: boolean;
};

export const MECANISMO_OPTIONS: MecanismoOption[] = [
  { value: "HR", label: "HR - Halkey Roberts (Manual)", temPastilha: false, temValidadePropria: false },
  { value: "HM", label: "HM - Hammar (Automático)", temPastilha: false, temValidadePropria: true },
  { value: "SEC", label: "SEC - Secumar (Automático)", temPastilha: false, temValidadePropria: false },
  { value: "LZ", label: "LZ - Lalizas", temPastilha: true, temValidadePropria: false },
  { value: "UML", label: "UML - United Moulders", temPastilha: true, temValidadePropria: false },
  { value: "CREW", label: "CREW - Crewsaver", temPastilha: true, temValidadePropria: false },
  { value: "PL", label: "PL - Plastimo", temPastilha: true, temValidadePropria: false },
];

export const YES_NO_OPTIONS = [
  { value: "", label: "- Selecionar -" },
  { value: "NAO", label: "Não" },
  { value: "SIM", label: "Sim" },
] as const;

export const REPLACEMENT_OPTIONS = [
  { value: "", label: "- Selecionar -" },
  { value: "NAO", label: "Não" },
  { value: "SIM", label: "Sim - substituído" },
] as const;

export const CHECKLIST_FIELDS = [
  { key: "tecidoExterior", label: "Tecido exterior" },
  { key: "colagens", label: "Colagens" },
  { key: "zataosVelcro", label: "Fecho zip / velcro" },
  { key: "fitasReflectoras", label: "Fitas refletoras" },
  { key: "sistemaInflacao", label: "Sistema insuflação" },
  { key: "mecanismoInflacao", label: "Mecanismo insuflação" },
  { key: "camaras", label: "Câmaras" },
  { key: "garrafaCO2", label: "Garrafa CO₂" },
  { key: "tuboInflador", label: "Tubo inflador" },
] as const;

export type ChecklistFieldKey = (typeof CHECKLIST_FIELDS)[number]["key"];

export const FIELD_SERVICE_KEYWORDS: Record<ChecklistFieldKey, string[]> = {
  tecidoExterior: ["bladder", "cover", "tecido", "structural", "webbing", "harness"],
  colagens: ["colagem", "seam", "costura", "d-ring", "arnes", "harness"],
  zataosVelcro: ["zip", "velcro", "buckle", "fecho", "packing"],
  fitasReflectoras: ["reflect", "retro", "light", "luz", "sprayhood", "apito", "whistle", "buddy line", "strap"],
  sistemaInflacao: ["kit", "inflation", "firing", "inflator", "automatic", "manual", "cartridge", "bobbin", "mechanism"],
  mecanismoInflacao: ["uml", "halkey", "hammar", "secumar", "lalizas", "crewsaver", "plastimo"],
  camaras: ["chamber", "camara", "leak", "retention"],
  garrafaCO2: ["co2", "cylinder", "cylinders"],
  tuboInflador: ["oral", "tube", "valve", "tubo", "valvula"],
};

export interface VerificacaoColete {
  id?: number;
  coleteId: number;
  tecidoExterior?: string;
  colagens?: string;
  zataosVelcro?: string;
  fitasReflectoras?: string;
  sistemaInflacao?: string;
  mecanismoInflacao?: string;
  camaras?: string;
  garrafaCO2?: string;
  tuboInflador?: string;
  dataVerificacao?: string | Date;
  inspectorNome?: string;
  observacoes?: string;
}

export type StockItemLite = {
  id: number;
  referencia?: string | null;
  descricao?: string | null;
  categoria?: string | null;
  validade?: string | null;
};

export type StockSearchState = {
  capsula: string;
  cilindro: string;
  clip: string;
  luz: string;
};

export type ReplacementFlag = "SIM" | "NAO" | "";
export type MechanismType = "AUTOMATICO" | "MANUAL";

export type StockApiErrorPayload = {
  error?: string;
  details?: string;
  code?: string;
};

export type InflacaoDetalhes = {
  tipoMecanismo: MechanismType;
  capsulaRef: string;
  capsulaValidade: string;
  capsulaSubstituida: ReplacementFlag;
  cilindro1Ref: string;
  cilindro1Validade: string;
  cilindro1Substituido: ReplacementFlag;
  cilindro2Ref: string;
  cilindro2Validade: string;
  cilindro2Substituido: ReplacementFlag;
  temClip: "SIM" | "NAO" | "";
  clipRef: string;
  clipSubstituido: ReplacementFlag;
  temLuz: "SIM" | "NAO" | "";
  luzRef: string;
  luzValidade: string;
  luzSubstituida: ReplacementFlag;
};

export type ManualReferenceHints = {
  capsuleRefs: string[];
  cylinderRefs: string[];
  clipRefs: string[];
  lightRefs: string[];
  capsuleKeywords: string[];
  cylinderKeywords: string[];
  clipKeywords: string[];
  lightKeywords: string[];
};

export type ManualChecklistState = {
  status: string;
  note: string;
};

export type AuxiliaryChecklistEntry = {
  key: string;
  itemLabel: string;
  helperText?: string;
};

export interface FichaVerificacaoMultiplaProps {
  coleteId: number;
  coleteSerial: string;
  marca?: string | null;
  modelo?: string | null;
  onSaved?: () => void | Promise<void>;
}

export interface ParsedManualChecklistLine {
  itemLabel: string;
  status: string;
  note: string;
}

export type ParsedObservacoesSections = {
  plainObservacoes: string;
  inflacaoBlock: string;
  manualChecklistLines: ParsedManualChecklistLine[];
};

export const MANUAL_CHECKLIST_MARKER = "[CHECKLIST MANUAL DO COLETE]";
export const MANUAL_SYSTEM_MARKER = "[SISTEMA DE INSUFLAÇÃO - MANUAL]";

export type ChecklistFieldConfig = {
  key: ChecklistFieldKey;
  label: string;
  helperText?: string;
  linkedItems: LifejacketServiceItem[];
};
