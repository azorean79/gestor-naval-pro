export type JangadaLogistica = {
  id: number;
  serial: string;
  brand: string;
  model: string;
  capacity: number;
  shipId: number | null;
  shipName: string | null;
  owner: string;
  island: string | null;
  dataInspecao: string | null;
  dataProxInspecao: string | null;
  status: string | null;
  serviceStationId: number | null;
  serviceStationName: string | null;
  numeroObra: string | null;
  inQueue: boolean;
  queueStatus: string | null;
  queueDataChegada: string | null;
  queueDataPrevistaEntrega: string | null;
  queueObservacoes: string | null;
};

export type FilterState = {
  search: string;
  status: string;
  island: string;
  station: string;
  dateFrom: string;
  dateTo: string;
};
