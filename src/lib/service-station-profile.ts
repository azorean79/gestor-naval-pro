import { normalizeCodeToken } from "@/lib/text-normalization";

export type ServiceStationNaviosProfile = {
  preferPortGrouping: boolean;
  showIslandFilter: boolean;
  showLocationColumn: boolean;
  distributionLabel: string;
  topDistributionLabel: string;
  missingDistributionLabel: string;
  uniqueSummaryLabel: string;
  locationInputLabel: string;
  locationInputPlaceholder: string;
};

export type ServiceStationProfile = {
  code: string | null;
  label: string;
  hiddenModuleKeys: string[];
  navios: ServiceStationNaviosProfile;
};

export function normalizeServiceStationCode(value: unknown) {
  return normalizeCodeToken(value || "");
}

export const DEFAULT_SERVICE_STATION_PROFILE: ServiceStationProfile = {
  code: null,
  label: "Padrão",
  hiddenModuleKeys: [],
  navios: {
    preferPortGrouping: false,
    showIslandFilter: true,
    showLocationColumn: true,
    distributionLabel: "Ilhas ativas",
    topDistributionLabel: "Ilha com mais navios",
    missingDistributionLabel: "Sem ilha/região válida",
    uniqueSummaryLabel: "ilha(s)",
    locationInputLabel: "Ilha",
    locationInputPlaceholder: "Ilha / região",
  },
};

export function getServiceStationProfile(code: unknown): ServiceStationProfile {
  const normalized = normalizeServiceStationCode(code);

  return {
    ...DEFAULT_SERVICE_STATION_PROFILE,
    code: normalized || null,
  };
}