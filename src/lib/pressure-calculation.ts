export type PressureUnit = 'hpa' | 'inh2o' | 'inhg' | 'mbar';

export type ChamberAnalysis = {
  startRaw: number;
  endRaw: number;
  startMb: number;
  endMb: number;
  correctedEndMb: number;
  dropMb: number;
  percent: number;
  passes: boolean;
};

export type PressureCalculationResult = {
  tempDelta: number;
  baroDelta: number;
  correctionTempMb: number;
  correctionBaroMb: number;
  totalCorrectionMb: number;
  tempValid: boolean;
  supAnalysis: ChamberAnalysis | null;
  infAnalysis: ChamberAnalysis | null;
};

export function parsePressureValue(v: any): number {
  const val = parseFloat(String(v || "").replace(",", "."));
  return isNaN(val) ? NaN : val;
}

export function toMbar(val: number, unit: PressureUnit): number {
  if (isNaN(val)) return NaN;
  if (unit === "inhg") return val * 33.8638866667;
  if (unit === "inh2o") return val * 2.490889;
  return val;
}

export function fromMbar(val: number, unit: PressureUnit): number {
  if (isNaN(val)) return NaN;
  if (unit === "inhg") return val / 33.8638866667;
  if (unit === "inh2o") return val / 2.490889;
  return val;
}

export function analyzeChamber(
  startRaw: number,
  endRaw: number,
  unit: PressureUnit,
  totalCorrectionMb: number
): ChamberAnalysis | null {
  if (isNaN(startRaw) || isNaN(endRaw)) return null;
  
  const startMb = toMbar(startRaw, unit);
  const endMb = toMbar(endRaw, unit);

  const correctedEndMb = endMb + totalCorrectionMb;
  const dropMbRaw = startMb - correctedEndMb;
  const dropMb = Math.max(0, dropMbRaw);
  const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
  const passes = percent <= 5;
  
  return { 
    startRaw, endRaw, startMb, endMb,
    correctedEndMb: fromMbar(correctedEndMb, unit), 
    dropMb: fromMbar(dropMb, unit), 
    percent, 
    passes 
  };
}

export function calculatePressureTest(
  tempInicio: any,
  tempFim: any,
  pressaoAtmInicio: any,
  pressaoAtmFim: any,
  camaraSupInicio: any,
  camaraSupFim: any,
  camaraInfInicio: any,
  camaraInfFim: any,
  unit: PressureUnit = 'hpa'
): PressureCalculationResult | null {
  const tIn = parsePressureValue(tempInicio);
  const tOut = parsePressureValue(tempFim);
  const pAtmIn = parsePressureValue(pressaoAtmInicio);
  const pAtmOut = parsePressureValue(pressaoAtmFim);

  if (isNaN(tIn) || isNaN(tOut) || isNaN(pAtmIn) || isNaN(pAtmOut)) {
    return null;
  }

  const tempDelta = tOut - tIn;
  const baroDelta = pAtmOut - pAtmIn;
  const correctionTempMb = -(tempDelta * 4);
  const correctionBaroMb = baroDelta;
  const totalCorrectionMb = correctionTempMb + correctionBaroMb;
  const tempValid = Math.abs(tempDelta) <= 3.5;

  const supIn = parsePressureValue(camaraSupInicio);
  const supOut = parsePressureValue(camaraSupFim);
  const infIn = parsePressureValue(camaraInfInicio);
  const infOut = parsePressureValue(camaraInfFim);

  const supAnalysis = analyzeChamber(supIn, supOut, unit, totalCorrectionMb);
  const infAnalysis = analyzeChamber(infIn, infOut, unit, totalCorrectionMb);

  return {
    tempDelta,
    baroDelta,
    correctionTempMb,
    correctionBaroMb,
    totalCorrectionMb,
    tempValid,
    supAnalysis,
    infAnalysis,
  };
}

export function formatPressureValue(value: number, unit: PressureUnit, decimals = 2): string {
  return `${value.toFixed(decimals)} ${unit.toUpperCase()}`;
}

export function formatPercentDrop(percent: number): string {
  return `${percent.toFixed(2)}%`;
}
