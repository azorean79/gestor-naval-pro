import { APP_CONFIG } from "@/lib/app-config";
import { normalizeCodeToken } from "@/lib/text-normalization";

function normalizeStationCodeToken(value: unknown) {
  return normalizeCodeToken(value || "");
}

export function isServiceStationCodeVisible(value: unknown) {
  if (APP_CONFIG.theme === 'deluxe') {
    return true;
  }
  const token = normalizeStationCodeToken(value);
  if (!token) return false;
  return token === normalizeStationCodeToken(APP_CONFIG.defaultServiceStationCode);
}

export function buildVisibleServiceStationWhere(where?: Record<string, unknown>) {
  if (APP_CONFIG.theme === 'deluxe') {
    return where || {};
  }
  const visibleCode = APP_CONFIG.defaultServiceStationCode;
  if (!where || Object.keys(where).length === 0) {
    return {
      codigo: visibleCode,
    };
  }

  return {
    AND: [
      where,
      {
        codigo: visibleCode,
      },
    ],
  };
}
