import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getLocalDateKey } from '@/lib/date-utils';
import type { InspectionData, GlobalStockItem } from '../types';

export type { GlobalStockItem } from '../types';

type WizardState = {
  // Navigation
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;
  validationErrors: string[];
  clearValidationErrors: () => void;
  
  // Data Payload
  jangadaId: number | null;
  shipId: number | null;
  inspecaoId: number | null;
  inspecoes: any[];
  setJangadaId: (id: number | null) => void;
  setShipId: (id: number | null) => void;
  setInspecaoId: (id: number | null) => void;
  
  inspectionData: InspectionData;
  setInspectionData: (data: Partial<InspectionData>) => void;
  
  // Global Stock
  globalStock: GlobalStockItem[];
  setGlobalStock: (stock: GlobalStockItem[]) => void;
  
  // Initialize from Backend
  initializeWizard: (raftData: any, draftData?: any) => void;
  
  // Saving Status
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  
  // Auto-save
  lastSaved: Date | null;
  setLastSaved: (date: Date) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
};

export const useJangadaWizardStore = create<WizardState>()(
  devtools(
    (set, get) => ({
      currentStep: 1,
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const state = get();
        if (state.canProceed()) {
          set({ currentStep: Math.min(state.currentStep + 1, 10), validationErrors: [] });
        }
      },
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1), validationErrors: [] })),
      
      canProceed: () => {
        const state = get();
        const data = state.inspectionData;
        const step = state.currentStep;
        const errors: string[] = [];

        if (step === 1) {
          if (!data.serial?.trim()) errors.push("Série é obrigatória");
          if (!data.brand?.trim()) errors.push("Marca é obrigatória");
          if (!data.model?.trim()) errors.push("Modelo é obrigatório");
          if (!data.packType?.trim()) errors.push("Tipo de pack é obrigatório");
          if (!data.capacity) errors.push("Capacidade é obrigatória");
        }

        if (step === 6) {
          if (data.testes?.testeWP === 'PASSOU') {
            if (!data.testes?.wpCamaraSupInicio) errors.push("Pressão Câmara Superior (Início) é obrigatória para teste WP");
            if (!data.testes?.wpCamaraSupFim) errors.push("Pressão Câmara Superior (Fim) é obrigatória para teste WP");
          }
        }

        set({ validationErrors: errors });
        return errors.length === 0;
      },
      
      validationErrors: [],
      clearValidationErrors: () => set({ validationErrors: [] }),
      
      jangadaId: null,
      shipId: null,
      inspecaoId: null,
      inspecoes: [],
      setJangadaId: (id) => set({ jangadaId: id }),
      setShipId: (id) => set({ shipId: id }),
      setInspecaoId: (id) => set({ inspecaoId: id }),
      
      inspectionData: {} as InspectionData,
      setInspectionData: (data) => set((state) => ({ 
        inspectionData: { ...state.inspectionData, ...data },
        isDirty: true,
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
          dataInspecao: draftData?.dataInspecao || raftData?.dataInspecao || getLocalDateKey(),
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
            wpUnidadePressao: raftData?.testeWPUnidadePressao || 'hpa',
            wpManometroId: raftData?.testeWPManometroId || '',
            wpBarometroId: raftData?.testeWPBarometroId || '',
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
            // NAP parameters
            napUnidadePressao: raftData?.testeNAPUnidadePressao || 'hpa',
            napManometroId: raftData?.testeNAPManometroId || '',
            napHoraInicio: raftData?.testeNAPHoraInicio || '',
            napHoraFim: raftData?.testeNAPHoraFim || '',
            napTempInicio: raftData?.testeNAPTemperaturaInicial || '',
            napTempFim: raftData?.testeNAPTemperaturaFinal || '',
            napPressaoAtmInicio: raftData?.testeNAPPressaoAtmosfericaInicial || '',
            napPressaoAtmFim: raftData?.testeNAPPressaoAtmosfericaFinal || '',
            napCamaraSupInicio: raftData?.testeNAPCamaraSuperiorInicio || '',
            napCamaraSupFim: raftData?.testeNAPCamaraSuperiorFim || '',
            napCamaraInfInicio: raftData?.testeNAPCamaraInferiorInicio || '',
            napCamaraInfFim: raftData?.testeNAPCamaraInferiorFim || '',
          },
          
          // Checklist
          checklist: draftData?.checklistSnapshot || {},
          
          // Pack Substituído
          packItems: draftData?.artigosSubstituidos?.reduce((acc: any, item: any) => {
            if (item.referencia) {
               acc[item.referencia] = item;
            }
            return acc;
          }, {}) || {},

          // Orçamento (restaurado a partir do rascunho guardado)
          orcamento: draftData?.orcamento || undefined,
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
      
      lastSaved: null,
      setLastSaved: (date) => set({ lastSaved: date, isDirty: false }),
      isDirty: false,
      setIsDirty: (dirty) => set({ isDirty: dirty }),
    }),
    { name: 'JangadaWizardStore' }
  )
);
