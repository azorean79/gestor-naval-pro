import { create } from 'zustand';

export type GlobalStockItem = {
  id: number;
  referencia: string;
  descricao: string;
  quantidade: number;
  categoria: string | null;
  validade: string | null;
  lote: string | null;
};

type ColeteWizardState = {
  coleteId: number | null;
  inspectionId: number | null;
  globalStock: GlobalStockItem[];
  
  inspectionData: {
    // Info
    brand: string;
    model: string;
    serial: string;
    shipName: string;
    shipId: number | null;
    dataInspecao: string;
    dataProxInspecao: string;
    
    // Checklist visual
    tecidoExterior: string;
    colagens: string;
    fitasReflectoras: string;
    sistemaInflacao: string;
    mecanismoInflacao: string;
    camaras: string;
    garrafaCO2: string;
    tuboInflador: string;
    zataosVelcro: string;

    // Componentes substituídos (ligação ao stock)
    componentes: {
      id: string; // Ex: 'cylinder', 'light', 'whistle', 'cartridge'
      name: string;
      reference: string;
      stockId: number | null;
      validade: string;
      lote: string;
      substituido?: boolean;
    }[];

    // Testes
    testePressao: string;
    testeInsuflacao: string;
    testeVazamento: string;
    
    observacoes: string;
  };

  setColeteId: (id: number | null) => void;
  setInspectionId: (id: number | null) => void;
  setGlobalStock: (stock: GlobalStockItem[]) => void;
  setInspectionData: (data: Partial<ColeteWizardState['inspectionData']>) => void;
  reset: () => void;
};

const initialInspectionData = {
  brand: '',
  model: '',
  serial: '',
  shipName: '',
  shipId: null,
  dataInspecao: new Date().toISOString().slice(0, 10),
  dataProxInspecao: '',
  
  tecidoExterior: 'OK',
  colagens: 'OK',
  fitasReflectoras: 'OK',
  sistemaInflacao: 'OK',
  mecanismoInflacao: 'OK',
  camaras: 'OK',
  garrafaCO2: 'OK',
  tuboInflador: 'OK',
  zataosVelcro: 'OK',

  componentes: [
    { id: 'cylinder', name: 'Cilindro CO2', reference: '', stockId: null, validade: '', lote: '', substituido: false },
    { id: 'cartridge', name: 'Pastilha de Sal (Bobbin)', reference: '', stockId: null, validade: '', lote: '', substituido: false },
    { id: 'light', name: 'Luz de Emergência', reference: '', stockId: null, validade: '', lote: '', substituido: false },
    { id: 'whistle', name: 'Apito', reference: '', stockId: null, validade: '', lote: '', substituido: false }
  ],

  testePressao: '',
  testeInsuflacao: '',
  testeVazamento: '',
  
  observacoes: '',
};

export const useColeteWizardStore = create<ColeteWizardState>((set) => ({
  coleteId: null,
  inspectionId: null,
  globalStock: [],
  inspectionData: { ...initialInspectionData },

  setColeteId: (id) => set({ coleteId: id }),
  setInspectionId: (id) => set({ inspectionId: id }),
  setGlobalStock: (stock) => set({ globalStock: stock }),
  
  setInspectionData: (data) => set((state) => ({
    inspectionData: { ...state.inspectionData, ...data }
  })),

  reset: () => set({ 
    coleteId: null, 
    inspectionId: null, 
    globalStock: [],
    inspectionData: { ...initialInspectionData } 
  }),
}));
