import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type GlobalStockItem = {
  id: number;
  referencia: string;
  descricao: string;
  categoria: string | null;
  codigoFabricante: string | null;
  lote: string | null;
  validade: string | null;
  quantidade: number;
};

type WizardState = {
  // Navigation
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Data Payload
  jangadaId: number | null;
  shipId: number | null;
  inspecaoId: number | null;
  inspecoes: any[];
  setJangadaId: (id: number | null) => void;
  setShipId: (id: number | null) => void;
  setInspecaoId: (id: number | null) => void;
  
  inspectionData: any; // Type 'any' initially, will be refined as steps are built
  setInspectionData: (data: Partial<any>) => void;
  
  // Global Stock
  globalStock: GlobalStockItem[];
  setGlobalStock: (stock: GlobalStockItem[]) => void;
  
  // Initialize from Backend
  initializeWizard: (raftData: any, draftData?: any) => void;
  
  // Saving Status
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
};

export const useJangadaWizardStore = create<WizardState>()(
  devtools(
    (set) => ({
      currentStep: 1,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 9) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
      
      jangadaId: null,
      shipId: null,
      inspecaoId: null,
      inspecoes: [],
      setJangadaId: (id) => set({ jangadaId: id }),
      setShipId: (id) => set({ shipId: id }),
      setInspecaoId: (id) => set({ inspecaoId: id }),
      
      inspectionData: {},
      setInspectionData: (data) => set((state) => ({ 
        inspectionData: { ...state.inspectionData, ...data } 
      })),

      globalStock: [],
      setGlobalStock: (stock) => set({ globalStock: stock }),
      
      initializeWizard: (raftData, draftData) => {
        // Here we map backend Raft model fields into the inspectionData
        // We also map the draftData if an inspection is already in progress
        const initialData: any = {
          // Identificação
          brand: raftData?.brand || '',
          model: raftData?.model || '',
          serial: raftData?.serial || '',
          packType: raftData?.packType || '',
          capacity: raftData?.capacity || '',
          dataFabrico: raftData?.dataFabrico || '',
          dataInspecao: draftData?.dataInspecao || raftData?.dataInspecao || new Date().toISOString().slice(0, 10),
          dataProxInspecao: draftData?.dataProxInspecao || raftData?.dataProxInspecao || '',
          shipName: draftData?.navioNome || raftData?.shipNameManual || raftData?.shipDetails?.nome || '',
          
          owner: raftData?.shipDetails?.proprietario || raftData?.ownerDisplay || raftData?.owner || '',
          shipFlag: raftData?.shipDetails?.bandeira || '',
          shipImo: raftData?.shipDetails?.imo || '',
          shipCallSign: raftData?.shipDetails?.callSignal || '',
          launchType: raftData?.launchType || '',
          fabricType: raftData?.fabricType || '',
          painterLength: raftData?.painterLength || '',
          maxStowageHeight: raftData?.maxStowageHeight || '',
          hruReference: raftData?.hruReferencia || '',
          hruExpiry: raftData?.hruValidade || '',
          radarReflector: raftData?.radarReflector || '',
          radarReflectorExpiry: raftData?.radarReflectorValidade || '',
          artigos: raftData?.artigos || [],
          shipDetails: raftData?.shipDetails || null,

          // Cilindro Base
          cylinder: {
            serial: raftData?.cylinderSerial || '',
            pesoBruto: raftData?.cylinderPesoBruto || '',
            tara: raftData?.cylinderTara || '',
            co2: raftData?.cylinderCo2 || '',
            n2: raftData?.cylinderN2 || '',
            dataTeste: raftData?.cylinderDataTeste || '',
            dataProxTeste: raftData?.cylinderDataProxTeste || '',
          },

          // Testes Base
          testes: {
            ...raftData,
            wpUnidadePressao: raftData?.testeWPUnidadePressao || 'mbar',
            wpHoraInicio: raftData?.testeWPHoraInicio || '',
            wpHoraFim: raftData?.testeWPHoraFim || '',
            wpTempInicio: raftData?.testeWPTemperaturaInicial || '',
            wpTempFim: raftData?.testeWPTemperaturaFinal || '',
            wpPressaoAtmInicio: raftData?.testeWPPressaoAtmosfericaInicial || '',
            wpPressaoAtmFim: raftData?.testeWPPressaoAtmosfericaFinal || '',
            wpCamaraSupInicio: raftData?.testeWPCamaraSuperiorInicio || '',
            wpCamaraSupFim: raftData?.testeWPCamaraSuperiorFim || '',
            wpCamaraInfInicio: raftData?.testeWPCamaraInferiorInicio || '',
            wpCamaraInfFim: raftData?.testeWPCamaraInferiorFim || '',
          },
          
          // Checklist
          checklist: draftData?.checklistSnapshot || {},
          
          // Pack Substituído
          packItems: draftData?.artigosSubstituidos?.reduce((acc: any, item: any) => {
            if (item.referencia) {
               acc[item.referencia] = item;
            }
            return acc;
          }, {}) || {}
        };
        
        set({
          jangadaId: raftData?.id || null,
          shipId: draftData?.navioId || raftData?.shipId || null,
          inspecaoId: draftData?.id || null,
          inspecoes: raftData?.inspecoes || [],
          inspectionData: { ...initialData }
        });
      },
      
      isSaving: false,
      setIsSaving: (isSaving) => set({ isSaving }),
    }),
    { name: 'JangadaWizardStore' }
  )
);
