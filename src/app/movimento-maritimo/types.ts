export type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
  tipoPesca?: string | null;
  tipoNavio?: string | null;
  ilha?: string | null;
  portoRegisto?: string | null;
  mmsi?: string | null;
  imo?: string | null;
  callSignal?: string | null;
  lat?: number | null;
  lng?: number | null;
  speedKnots?: number | null;
  course?: number | null;
  heading?: number | null;
  eta?: string | null;
  etd?: string | null;
  cliente?: { id?: number; nome?: string | null; ilha?: string | null } | null;
};

export type TrackingVessel = {
  id?: number | string;
  mmsi?: string | null;
  imo_number?: string | null;
  name?: string | null;
  type?: string | null;
  flag?: string | null;
  last_position_lat?: number | null;
  last_position_lon?: number | null;
  speed?: number | null;
  course?: number | null;
  last_update?: string | null;
};

export type TrackingMatch = {
  navio: Navio;
  trackingVessel: TrackingVessel | null;
  matchStrategy: "mmsi" | "imo" | "name" | null;
  aisLiveReady: boolean;
};

export type TrackingPayload = {
  ok: boolean;
  fetchedAt?: string;
  liveSource?: string;
  externalTrackingSource?: string;
  selectedPortCode?: string;
  navios: Navio[];
  tracking?: {
    available?: boolean;
    matchedCount?: number;
    unmatchedLocalCount?: number;
    externalOnlyCount?: number;
    matchedNavios?: TrackingMatch[];
    unmatchedLocal?: Navio[];
  };
  dashboard?: Record<string, unknown>;
  portMovements?: {
    port?: { code?: string; name?: string };
    summary?: {
      expected_arrivals_count?: number;
      in_port_count?: number;
      expected_departures_count?: number;
      history_count?: number;
      total_passengers_expected?: number;
      total_crew_expected?: number;
      top_vessel_types?: Array<{ type?: string; count?: number }>;
    };
    movements?: {
      expected_arrivals?: Array<Record<string, unknown>>;
      in_port?: Array<Record<string, unknown>>;
      expected_departures?: Array<Record<string, unknown>>;
      history?: Array<Record<string, unknown>>;
    };
  };
  portActivity?: {
    days?: number;
    labels?: string[];
    dates?: string[];
    series?: {
      activity?: number[];
      arrivals?: number[];
      in_port?: number[];
      departures?: number[];
    };
  };
};

export type ViewMode = "portos" | "ilhas" | "lista" | "mapa";

export type PortSummary = {
  porto: string;
  total: number;
  ilhaPrincipal: string;
  ilhasLigadas: string[];
  prontosTracking: number;
  navios: Navio[];
};

export type IslandSummary = {
  ilha: string;
  total: number;
  portos: string[];
  prontosTracking: number;
  tipologias: Array<{ tipo: string; total: number }>;
  navios: Navio[];
};
