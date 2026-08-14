export type ComponentKey = "chamber" | "cylinder" | "inflator" | "light" | "whistle";

export type SpecItem = { name: string; value: string };

export type ComponentStatus = {
  key: ComponentKey;
  label: string;
  status: "OK" | "WARNING" | "CRITICAL" | "NONE";
  desc: string;
  specs: SpecItem[];
  icon: string;
  pos: [number, number];
};

import type { Colete } from "@prisma/client";

export type LifejacketDiagramProps = {
  colete: Colete;
};
