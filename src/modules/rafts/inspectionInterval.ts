"use client";

export const isRecreio = (shipDetails: any): boolean => {
  if (!shipDetails) return false;
  const haystack = `${shipDetails.tipoPesca || ""} ${shipDetails.tipoNavio || ""}`.toLowerCase();
  return haystack.includes("recreio");
};

export const getInspectionIntervalYears = (brand: string, model: string, shipDetails: any): number => {
  const brandNorm = (brand || "").toUpperCase().trim();
  const modelNorm = (model || "").toUpperCase().trim();
  if (brandNorm.includes("EUROVINIL") && modelNorm.includes("EASY")) return 4;
  if (!isRecreio(shipDetails)) return 1;
  if (brandNorm.includes("RFD") || brandNorm.includes("DSB") || brandNorm.includes("ZODIAC")) return 1;
  return 3;
};

export const getInspectionIntervalLabel = (brand: string, model: string, shipDetails: any): string => {
  const years = getInspectionIntervalYears(brand, model, shipDetails);
  return years === 1 ? "12 meses" : `${years} anos`;
};

export const getSubstitutionMaxValidityDays = (brand: string, model: string, shipDetails: any): number =>
  getInspectionIntervalYears(brand, model, shipDetails) * 365;
