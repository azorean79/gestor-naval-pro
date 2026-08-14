// src/types/index.ts

export type InspectionEvent = {
  id?: number;
  raftSerial: string;
  title: string;
  date: string; // ISO string (YYYY-MM-DD)
  type: "Inspeção" | "Próxima Inspeção";
};

export type Ship = {
  id?: number;
  name: string;
  mmsi?: string;
};

export type Jangada = {
  id?: number;
  serial: string;
  model?: string;
};

export type Colete = {
  id?: number;
  size: string;
};
