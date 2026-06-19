/**
 * SEA-SAFE Technical Specifications extracted from manual
 * Cylinder CO2/N2 quantities and system details
 */

export type SeaSafeModelSpec = {
  model: string;
  cylinderCo2: string;
  cylinderN2: string;
  cylinderSistema: string;
  tuboCamaraSuperiorRef?: string;
  tuboCamaraInferiorRef?: string;
  cabecaDisparoRef?: string;
  valvulaAlivioRef?: string;
};

// Based on SEA-SAFE manual table - Size cylinder specifications
// References from official SEA-SAFE technical manual
export const SEA_SAFE_CYLINDER_SPECS: SeaSafeModelSpec[] = [
  {
    model: 'PL 4',
    cylinderCo2: '1000',
    cylinderN2: '90',
    cylinderSistema: 'Thanner',
    tuboCamaraSuperiorRef: 'SF-UP-002',
    tuboCamaraInferiorRef: 'SF-LOW-002',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
  {
    model: 'PL 6',
    cylinderCo2: '1500',
    cylinderN2: '150',
    cylinderSistema: 'Thanner',
    tuboCamaraSuperiorRef: 'SF-UP-003',
    tuboCamaraInferiorRef: 'SF-LOW-003',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
  {
    model: 'PL 8',
    cylinderCo2: '2000',
    cylinderN2: '180',
    cylinderSistema: 'Thanner',
    tuboCamaraSuperiorRef: 'SF-UP-004',
    tuboCamaraInferiorRef: 'SF-LOW-004',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL R',
    cylinderCo2: '2500',
    cylinderN2: '200',
    cylinderSistema: 'Thanner',
    tuboCamaraSuperiorRef: 'SF-UP-005',
    tuboCamaraInferiorRef: 'SF-LOW-005',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL RHL',
    cylinderCo2: '1500',
    cylinderN2: '150',
    cylinderSistema: 'Thanner Heavy Lift',
    tuboCamaraSuperiorRef: 'SF-UP-HL-003',
    tuboCamaraInferiorRef: 'SF-LOW-HL-003',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
  {
    model: 'PL REA',
    cylinderCo2: '2000',
    cylinderN2: '150',
    cylinderSistema: 'Thanner REA',
    tuboCamaraSuperiorRef: 'SF-UP-REA-004',
    tuboCamaraInferiorRef: 'SF-LOW-REA-004',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL SA',
    cylinderCo2: '2500',
    cylinderN2: '180',
    cylinderSistema: 'Thanner SA',
    tuboCamaraSuperiorRef: 'SF-UP-SA-005',
    tuboCamaraInferiorRef: 'SF-LOW-SA-005',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL CX',
    cylinderCo2: '1500',
    cylinderN2: '130',
    cylinderSistema: 'Thanner CX',
    tuboCamaraSuperiorRef: 'SF-UP-CX-003',
    tuboCamaraInferiorRef: 'SF-LOW-CX-003',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
  {
    model: 'PL CSR',
    cylinderCo2: '1500',
    cylinderN2: '150',
    cylinderSistema: 'Thanner CSR',
    tuboCamaraSuperiorRef: 'SF-UP-CSR-003',
    tuboCamaraInferiorRef: 'SF-LOW-CSR-003',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
  {
    model: 'PL SR',
    cylinderCo2: '2500',
    cylinderN2: '180',
    cylinderSistema: 'Thanner SR (Self-Righting)',
    tuboCamaraSuperiorRef: 'SF-UP-SR-005',
    tuboCamaraInferiorRef: 'SF-LOW-SR-005',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  // Thanner variants
  {
    model: 'PL-F',
    cylinderCo2: '2000',
    cylinderN2: '180',
    cylinderSistema: 'Thanner F (Fast Inflation)',
    tuboCamaraSuperiorRef: 'SF-UP-F-004',
    tuboCamaraInferiorRef: 'SF-LOW-F-004',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL-SR-F',
    cylinderCo2: '2500',
    cylinderN2: '200',
    cylinderSistema: 'Thanner SR-F (Self-Righting Fast)',
    tuboCamaraSuperiorRef: 'SF-UP-SR-F-005',
    tuboCamaraInferiorRef: 'SF-LOW-SR-F-005',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-M',
  },
  {
    model: 'PL-C-F',
    cylinderCo2: '1500',
    cylinderN2: '150',
    cylinderSistema: 'Thanner C-F (Coastal Fast)',
    tuboCamaraSuperiorRef: 'SF-UP-C-F-003',
    tuboCamaraInferiorRef: 'SF-LOW-C-F-003',
    cabecaDisparoRef: 'YY-SSF',
    valvulaAlivioRef: 'SF-VLV-S',
  },
];

export function getSeaSafeSpec(model?: string): SeaSafeModelSpec | undefined {
  if (!model) return undefined;
  
  const normalized = String(model)
    .toUpperCase()
    .replace(/\s+/g, '')
    .trim();
  
  return SEA_SAFE_CYLINDER_SPECS.find((spec) => {
    const specNorm = spec.model.toUpperCase().replace(/\s+/g, '');
    return normalized.includes(specNorm) || specNorm.includes(normalized);
  });
}
