export type CylinderStockItem = {
  id: number;
  referencia?: string | null;
  descricao?: string | null;
  quantidade?: number | null;
  estadoArtigo?: string | null;
  estadoCargaCilindro?: string | null;
  testeHidraulico?: string | null;
  validade?: string | null;
  categoria?: string | null;
  codigoFabricante?: string | null;
  localizacao?: string | null;
};

export type RaftCylinderInfo = {
  id: number;
  serial?: string | null;
  brand?: string | null;
  model?: string | null;
  capacity?: number | null;
  cylinderSerial?: string | null;
  cylinderSistema?: string | null;
  cylinderCo2?: string | null;
  cylinderN2?: string | null;
  cylinderDataTeste?: string | null;
  cylinderDataProxTeste?: string | null;
};

export type NewCylinderDraft = {
  jangadaId: string;
  stockItemId: string;
  cylinderSerial: string;
  cylinderSistema: string;
  cylinderCo2: string;
  cylinderN2: string;
  cylinderDataTeste: string;
  estadoCargaCilindro: "CHEIO" | "VAZIO" | "PARCIAL";
  localizacao: string;
};
