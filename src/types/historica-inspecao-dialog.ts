export type RaftInspectionPrefillData = {
  cylinderSerial?: string | null;
  cylinderTara?: string | number | null;
  cylinderPesoBruto?: string | number | null;
  cylinderCo2?: string | number | null;
  cylinderN2?: string | number | null;
  cylinderDataTeste?: string | null;
  cylinderDataProxTeste?: string | null;
  cylinderSistema?: string | null;
  hruReferencia?: string | null;
  hruDataInstalacao?: string | null;
  hruValidade?: string | null;
  testeWP?: string | null;
  testeNAP?: string | null;
  testeFS?: string | null;
  testeGI?: string | null;
  testeDL?: string | null;
  testeWPCamaraSuperiorInicio?: string | null;
  testeWPCamaraSuperiorFim?: string | null;
  testeWPCamaraInferiorInicio?: string | null;
  testeWPCamaraInferiorFim?: string | null;
  testeWPTemperaturaInicial?: string | null;
  testeWPTemperaturaFinal?: string | null;
  testeWPPressaoAtmosfericaInicial?: string | null;
  testeWPPressaoAtmosfericaFinal?: string | null;
  testeWPHoraInicio?: string | null;
  testeWPHoraFim?: string | null;
  artigos?: Array<{
    name?: string | null;
    referencia?: string | null;
    quantidade?: number | null;
    validade?: string | null;
    categoria?: string | null;
  }>;
};

export type HistoricaInspecaoDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  jangadaId: number;
  onSuccess: () => void;
  isVistoriaAtual?: boolean;
  currentRaftData?: RaftInspectionPrefillData | null;
};

export type ArticleInput = {
  name: string;
  referencia: string;
  quantidade: number;
  validade: string;
  categoria: string;
};
