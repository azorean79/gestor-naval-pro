import { create } from 'zustand';
import type { InspectionEvent } from '@/types/agenda';
import type { AgendaRaft, AgendaMetrics } from '@/types/agenda';

export type QuickScheduleTarget = {
  serial: string;
  label: string;
  shipName: string;
  expiryFlag: string;
  dataProxInspecao: string | Date | null | undefined;
  dueDate: Date | string | null | undefined;
};

interface AgendaState {
  rafts: AgendaRaft[];
  events: InspectionEvent[];
  externalDragEvent: InspectionEvent | null;
  metrics: AgendaMetrics | null;
  conflictCount: number;
  viewMode: 'calendar' | 'list' | 'board';
  showAdvancedPanels: boolean;
  listSearch: string;
  quickScheduleTarget: QuickScheduleTarget | null;
  quickScheduleDateTime: string;
  quickScheduleResponsavel: string;
  exportingFormat: "csv" | "excel" | "pdf" | null;

  setRafts: (rafts: AgendaRaft[]) => void;
  setEvents: (events: InspectionEvent[] | ((prev: InspectionEvent[]) => InspectionEvent[])) => void;
  setExternalDragEvent: (event: InspectionEvent | null) => void;
  setMetrics: (metrics: AgendaMetrics | null) => void;
  setConflictCount: (count: number) => void;
  setViewMode: (mode: 'calendar' | 'list' | 'board') => void;
  setShowAdvancedPanels: (show: boolean) => void;
  setListSearch: (search: string) => void;
  setQuickScheduleTarget: (target: QuickScheduleTarget | null) => void;
  setQuickScheduleDateTime: (datetime: string) => void;
  setQuickScheduleResponsavel: (responsavel: string) => void;
  setExportingFormat: (format: "csv" | "excel" | "pdf" | null) => void;
}

export const useAgendaStore = create<AgendaState>((set) => ({
  rafts: [],
  events: [],
  externalDragEvent: null,
  metrics: null,
  conflictCount: 0,
  viewMode: 'calendar',
  showAdvancedPanels: false,
  listSearch: '',
  quickScheduleTarget: null,
  quickScheduleDateTime: '',
  quickScheduleResponsavel: '',
  exportingFormat: null,

  setRafts: (rafts) => set({ rafts }),
  setEvents: (events) => set((state) => ({ 
    events: typeof events === 'function' ? events(state.events) : events 
  })),
  setExternalDragEvent: (externalDragEvent) => set({ externalDragEvent }),
  setMetrics: (metrics) => set({ metrics }),
  setConflictCount: (conflictCount) => set({ conflictCount }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowAdvancedPanels: (showAdvancedPanels) => set({ showAdvancedPanels }),
  setListSearch: (listSearch) => set({ listSearch }),
  setQuickScheduleTarget: (quickScheduleTarget) => set({ quickScheduleTarget }),
  setQuickScheduleDateTime: (quickScheduleDateTime) => set({ quickScheduleDateTime }),
  setQuickScheduleResponsavel: (quickScheduleResponsavel) => set({ quickScheduleResponsavel }),
  setExportingFormat: (exportingFormat) => set({ exportingFormat }),
}));
