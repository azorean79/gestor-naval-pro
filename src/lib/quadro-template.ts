import path from 'node:path';
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type QuadroTemplateInput = {
  numeroObra?: string;
  certNumber?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  shipName?: string;
  brand?: string;
  raftModel?: string;
  raftCapacity?: string | number;
  raftSerial?: string;
  manufactureDate?: string;
  cylinderSerial?: string;
  cylinderGrossWeight?: string | number;
  cylinderTare?: string | number;
  cylinderCo2?: string | number;
  cylinderN2?: string | number;
  cylinderHydroTestDate?: string;
  packType?: string;
  pressureUnit?: string;
  tempInitial?: string | number;
  tempFinal?: string | number;
  baroInitial?: string | number;
  baroFinal?: string | number;
  wpStartTime?: string;
  wpEndTime?: string;
  wpUpperStart?: string | number;
  wpUpperEnd?: string | number;
  wpUpperCorrected?: string | number;
  wpUpperDrop?: string | number;
  wpUpperDropPercent?: string | number;
  wpLowerStart?: string | number;
  wpLowerEnd?: string | number;
  wpLowerCorrected?: string | number;
  wpLowerDrop?: string | number;
  wpLowerDropPercent?: string | number;
  napTestDone?: unknown;
  fsTestDone?: unknown;
  giTestDone?: unknown;
  loadTestDone?: unknown;
  napTestDate?: string;
  fsTestDate?: string;
  giTestDate?: string;
  loadTestDate?: string;
  contentorClosureText?: string;
  contentorPainterLength?: string;
  checklist?: Record<string, string | number | boolean>;
};

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'template quadro.xlsx');
const SERVICE_STATION_NAME = 'OREY TÉCNICA – 50937';
const QUADRO_PRINT_AREA_MAX_ROW = 84;
const QUADRO_PRINT_AREA_MAX_COLUMN = 10;

type ChecklistCellKind = 'status' | 'date' | 'text';

const EXPLICIT_REPLACEMENT_KEY_BY_REFERENCE_FIELD: Record<string, string> = {
  ref_farmacia: 'substituicao_explicita__farmacia',
  ref_comprimidos: 'substituicao_explicita__comprimidos_p_enjoo',
  ref_paraquedas: 'substituicao_explicita__foguetes_paraquedas',
  ref_fachos: 'substituicao_explicita__fachos_de_mao',
  ref_potes: 'substituicao_explicita__potes_de_fumo',
  ref_bateria: 'substituicao_explicita__pilhas_para_lanterna',
};

function sanitizeFileNameSegment(value: unknown, fallback: string) {
  const text = asString(value) || fallback;
  return text
    .replace(/[\\/:*?"<>|\r\n\t]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || fallback;
}

function sanitizeFriendlyFileNameSegment(value: unknown) {
  return asString(value)
    .replace(/[\\/:*?"<>|\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function asString(value: unknown) {
  return String(value ?? '').trim();
}

function formatDateDDMMYYYY(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const ptMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ptMatch) {
    const day = String(Number(ptMatch[1])).padStart(2, '0');
    const month = String(Number(ptMatch[2])).padStart(2, '0');
    return `${day}/${month}/${ptMatch[3]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
}

function formatMonthYear(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';
  const match = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (match) return `${match[2]}-${match[1]}`;
  const mmYYYY = raw.match(/^(\d{2})\/(\d{4})$/);
  if (mmYYYY) return `${mmYYYY[1]}-${mmYYYY[2]}`;
  return raw;
}

function formatMonthYearSlash(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';
  const match = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (match) return `${match[2]}/${match[1]}`;
  const ptDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ptDate) return `${String(Number(ptDate[2])).padStart(2, '0')}/${ptDate[3]}`;
  const mmYYYY = raw.match(/^(\d{2})[\/-](\d{4})$/);
  if (mmYYYY) return `${mmYYYY[1]}/${mmYYYY[2]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
}

function formatCapacityForFileName(value: unknown) {
  const raw = sanitizeFriendlyFileNameSegment(value);
  if (!raw) return '';

  const normalized = raw.toUpperCase();
  if (/^\d+\s*P$/.test(normalized)) {
    return normalized.replace(/\s+/g, '');
  }

  const numeric = normalized.match(/\d+/);
  if (numeric) return `${Number(numeric[0])}P`;
  return normalized;
}

function buildQuadroFileName(input: QuadroTemplateInput & Record<string, unknown>) {
  const serial = sanitizeFriendlyFileNameSegment(input.raftSerial ?? input.serial);
  const brand = sanitizeFriendlyFileNameSegment(input.brand ?? input.marca);
  const model = sanitizeFriendlyFileNameSegment(input.raftModel ?? input.model);
  const capacity = formatCapacityForFileName(input.raftCapacity ?? input.capacity ?? input.lotacao);
  const inspectionMonthYear = formatMonthYearSlash(input.inspectionDate ?? input.dataInspecao);

  const mainLabel = [serial, brand, model, capacity].filter(Boolean).join(' ').trim() || 'jangada';
  const withDate = inspectionMonthYear ? `${mainLabel} (${inspectionMonthYear})` : mainLabel;

  return `${withDate.replace(/[\\/:*?"<>|\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)}.xlsx`;
}

function asYesNo(value: unknown, fallback = 'NO') {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['yes', 'sim', 'true', '1', 'y', 'ok'].includes(normalized)) return 'YES';
    if (['no', 'nao', 'não', 'false', '0', 'n', 'not_ok', 'n/a', 'na', 'n.d', 'nd'].includes(normalized)) return 'NO';
  }
  if (typeof value === 'boolean') return value ? 'YES' : 'NO';
  if (typeof value === 'number') return value ? 'YES' : 'NO';
  return fallback;
}

function asYesNoOrNA(value: unknown, fallback: 'YES' | 'NO' = 'NO'): 'YES' | 'NO' | 'N/A' {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (['n/a', 'na', 'n.d', 'nd', 'não aplicável', 'nao aplicavel', 'not applicable'].includes(normalized)) return 'N/A';
    if (['yes', 'sim', 'true', '1', 'y', 'ok'].includes(normalized)) return 'YES';
    if (['no', 'nao', 'não', 'false', '0', 'n', 'not_ok'].includes(normalized)) return 'NO';
  }
  if (typeof value === 'boolean') return value ? 'YES' : 'NO';
  if (typeof value === 'number') return value ? 'YES' : 'NO';
  return fallback;
}

function getTestDateCellValue(status: 'YES' | 'NO' | 'N/A', dateValue: string) {
  if (status === 'YES') return dateValue;
  if (status === 'N/A') return 'N/A';
  return '';
}

function buildPressureUnitText(unit: unknown) {
  const normalized = asString(unit).toLowerCase();
  const inH2O = normalized === 'inh2o' ? 'X' : ' ';
  const inHg = normalized === 'inhg' ? 'X' : ' ';
  const mbar = normalized === 'mbar' ? 'X' : ' ';
  return `inH2O [ ${inH2O} ] inHg [ ${inHg} ] mbar [ ${mbar} ]`;
}

function setCell(cell: ExcelJS.Cell, value: unknown) {
  cell.value = asString(value);
}

function clearCellFill(cell: ExcelJS.Cell) {
  cell.fill = {
    type: 'pattern',
    pattern: 'none',
  };
}

function setCenteredCell(cell: ExcelJS.Cell, value: unknown) {
  setCell(cell, value);
  cell.alignment = {
    ...(cell.alignment || {}),
    horizontal: 'center',
    vertical: 'middle',
  };
}

function setFittedTextCell(cell: ExcelJS.Cell, value: unknown) {
  setCell(cell, value);
  cell.alignment = {
    ...(cell.alignment || {}),
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
    shrinkToFit: true,
  };
}

function formatValueWithUnit(value: unknown, unit: string) {
  const raw = asString(value);
  if (!raw) return '';
  const normalized = raw.toLowerCase();
  const normalizedUnit = unit.toLowerCase();
  if (normalized.includes(normalizedUnit)) return raw;
  return `${raw} ${unit}`;
}

function inferBatteryModel(value: unknown) {
  const raw = asString(value);
  if (!raw) return '';

  const normalized = raw.toUpperCase();
  if (normalized.includes('MASTER1') || normalized.includes('MASTER 1')) return 'Master1';
  if (normalized.includes('RB2')) return 'RB2';
  if (normalized.includes('RL6') || normalized.includes('RL06')) return 'RL6';
  if (normalized.includes('RL5') || normalized.includes('RL05')) return 'RL5';
  return raw;
}

function isChecklistTruthy(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  const normalized = asString(value).toLowerCase();
  if (['no', 'nao', 'não', 'false', '0', 'n/a', 'na', 'n.d', 'nd'].includes(normalized)) {
    return false;
  }
  return true;
}

function formatChecklistCellValue(kind: ChecklistCellKind, value: unknown) {
  if (kind === 'status') {
    return isChecklistTruthy(value) ? '☑' : '☐';
  }

  if (kind === 'date') {
    const raw = asString(value);
    if (!raw) return '';
    return formatMonthYearSlash(raw) || raw;
  }

  return asString(value);
}

function formatWeightKg(value: unknown) {
  return formatValueWithUnit(value, 'kg');
}

function formatPercentage(value: unknown) {
  return formatValueWithUnit(value, '%');
}

function formatReferenceWithQuantity(
  checklist: Record<string, string | number | boolean>,
  refKey: string,
  qtyKey: string,
  fallbackQty = 1,
) {
  const explicitReplacementKey = EXPLICIT_REPLACEMENT_KEY_BY_REFERENCE_FIELD[refKey];
  if (explicitReplacementKey) {
    const replacementQtyRaw = asString(checklist[explicitReplacementKey]);
    const replacementQty = Number(replacementQtyRaw);
    if (!Number.isFinite(replacementQty) || replacementQty <= 0) return '';
  }

  const reference = asString(checklist[refKey]);
  if (!reference) return '';

  const qtyRaw = asString(checklist[qtyKey]);
  const parsedQty = Number(qtyRaw);
  const quantity = Number.isFinite(parsedQty) && parsedQty > 0 ? Math.round(parsedQty) : fallbackQty;

  return quantity > 1 ? `${reference}(${quantity})` : reference;
}

function setChecklistCell(
  ws: ExcelJS.Worksheet,
  checklist: Record<string, string | number | boolean>,
  key: string,
  cellAddress: string,
  kind: ChecklistCellKind,
) {
  const value = formatChecklistCellValue(kind, checklist[key]);
  const cell = ws.getCell(cellAddress);
  if (kind === 'status') {
    setCenteredCell(cell, value);
    return;
  }
  if (!value) return;
  setCell(cell, value);
}

function clearWorksheetFills(ws: ExcelJS.Worksheet) {
  for (let row = 1; row <= QUADRO_PRINT_AREA_MAX_ROW; row += 1) {
    for (let col = 1; col <= QUADRO_PRINT_AREA_MAX_COLUMN; col += 1) {
      clearCellFill(ws.getCell(row, col));
    }
  }
}

function fillTemplate(ws: ExcelJS.Worksheet, input: QuadroTemplateInput) {
  clearWorksheetFills(ws);

  setCell(ws.getCell('I3'), input.numeroObra);
  setCell(ws.getCell('I5'), input.certNumber);

  setCell(ws.getCell('C7'), input.raftSerial);
  setCell(ws.getCell('E7'), input.shipName);
  setCell(ws.getCell('H7'), input.brand);
  setFittedTextCell(ws.getCell('I7'), input.raftModel);
  setCell(ws.getCell('J7'), input.raftCapacity);

  setCell(ws.getCell('G79'), formatDateDDMMYYYY(input.manufactureDate));
  setCell(ws.getCell('F81'), formatDateDDMMYYYY(input.inspectionDate));
  setCell(ws.getCell('C81'), SERVICE_STATION_NAME);

  setCell(ws.getCell('E47'), input.packType);
  setCell(ws.getCell('F47'), input.packType);

  setCell(ws.getCell('I56'), input.cylinderSerial);
  setCell(ws.getCell('I58'), formatWeightKg(input.cylinderGrossWeight));
  const cylinderTareValue = input.cylinderTare ?? (input as any).cylinderTara;
  setCell(ws.getCell('I60'), formatWeightKg(cylinderTareValue));
  setCell(ws.getCell('I62'), formatWeightKg(input.cylinderCo2));
  setCell(ws.getCell('I64'), formatWeightKg(input.cylinderN2));
  setCell(ws.getCell('I66'), formatMonthYear(input.cylinderHydroTestDate));

  // Preserve the template's formulas and labels in the pressure block.
  setCell(ws.getCell('D69'), buildPressureUnitText(input.pressureUnit || 'inh2o'));
  setCell(ws.getCell('H69'), formatValueWithUnit(input.tempInitial, '°C'));
  setCell(ws.getCell('J69'), formatValueWithUnit(input.tempFinal, '°C'));
  setCell(ws.getCell('H71'), formatValueWithUnit(input.baroInitial, 'hPa'));
  setCell(ws.getCell('J71'), formatValueWithUnit(input.baroFinal, 'hPa'));
  setCenteredCell(ws.getCell('C72'), input.wpStartTime);
  setCenteredCell(ws.getCell('C73'), input.wpUpperStart);
  setCenteredCell(ws.getCell('D73'), input.wpUpperCorrected || input.wpUpperEnd);
  setCenteredCell(ws.getCell('E73'), input.wpUpperDropPercent ? formatPercentage(input.wpUpperDropPercent) : input.wpUpperDrop);
  setCenteredCell(ws.getCell('C75'), input.wpLowerStart);
  setCenteredCell(ws.getCell('D75'), input.wpLowerCorrected || input.wpLowerEnd);
  setCenteredCell(ws.getCell('E75'), input.wpLowerDropPercent ? formatPercentage(input.wpLowerDropPercent) : input.wpLowerDrop);

  const napDone = asYesNoOrNA(input.napTestDone, input.inspectionDate ? 'YES' : 'NO');
  const fsDone = asYesNoOrNA(input.fsTestDone, 'NO');
  const giDone = asYesNoOrNA(input.giTestDone, 'NO');
  const loadDone = asYesNoOrNA(input.loadTestDone, 'NO');

  setCell(ws.getCell('H46'), napDone);
  setCell(ws.getCell('H48'), fsDone);
  setCell(ws.getCell('H50'), giDone);
  setCell(ws.getCell('H52'), loadDone);

  const defaultTestDate = formatMonthYearSlash(input.inspectionDate);
  setCell(ws.getCell('J47'), getTestDateCellValue(napDone, formatMonthYearSlash(input.napTestDate || defaultTestDate)));
  setCell(ws.getCell('J49'), getTestDateCellValue(fsDone, formatMonthYearSlash(input.fsTestDate || defaultTestDate)));
  setCell(ws.getCell('J51'), getTestDateCellValue(giDone, formatMonthYearSlash(input.giTestDate || defaultTestDate)));
  setCell(ws.getCell('J53'), getTestDateCellValue(loadDone, formatMonthYearSlash(input.loadTestDate || defaultTestDate)));

  const checklist = input.checklist || {};
  const batteryModel = inferBatteryModel(checklist.modelo_bateria || checklist.ref_bateria);

  const statusMappings: Array<[string, string]> = [
    ['cobertura_exterior', 'C12'],
    ['saida_antena', 'C14'],
    ['refletores', 'C16'],
    ['tubo_identificacao', 'C18'],
    ['costuras_juntas', 'C20'],
    ['camara_fundos', 'C22'],
    ['sistema_endireitar', 'C24'],
    ['bolsas_estabilizacao', 'C26'],
    ['luz_exterior_bateria', 'C28'],
    ['escada_borda', 'C32'],
    ['valvulas_seguranca', 'C34'],
    ['uniao_banjo_superior', 'C36'],
    ['uniao_banjo_inferior', 'C38'],
    ['grinalda_espelhos', 'C40'],
    ['alca_retenida_espelhos', 'C42'],
    ['tubos_alta_pressao', 'C44'],
    ['cabo_disparo', 'C50'],
    ['capa_sistema_insuflacao', 'C52'],
    ['bolsa_cilindro', 'C54'],
    ['fecho_cobertura', 'E10'],
    ['protectores_juntas_interior', 'E12'],
    ['colectores_agua', 'E14'],
    ['manual_instrucoes', 'E16'],
    ['tecido_camara_fundo', 'E18'],
    ['fecho_saco_emergencia', 'E20'],
    ['luz_interior_bateria', 'E22'],
    ['bateria_litio', 'E24'],
    ['valvulas_insuflacao', 'E26'],
    ['valvulas_atestar_interior', 'E28'],
    ['suporte_antena', 'E30'],
    ['arco_cinta_remate', 'E32'],
    ['cinta_fecho', 'E36'],
    ['saco_retenida', 'E38'],
    ['marcas_involucro', 'E42'],
    ['pagaias', 'E48'],
    ['fole', 'E50'],
    ['jogo_reparacao', 'E52'],
    ['ancora_flutuante_linha', 'E54'],
    ['batedouro', 'E56'],
    ['reflector_radar', 'E58'],
    ['escada_entrada', 'C58'],
    ['grinalda_interior', 'C60'],
    ['anel_linha', 'C62'],
    ['faca_seguranca', 'C64'],
    ['cobertura_interior', 'C66'],
    ['ajudas_termicas', 'H10'],
    ['ambulancia', 'H12'],
    ['comprimidos_enjoo', 'H14'],
    ['foguetoes_paraquedas', 'H16'],
    ['fachos_mao', 'H18'],
    ['potes_fumo', 'H20'],
    ['lanterna', 'H22'],
    ['pilhas_lanterna', 'H24'],
    ['apito', 'H26'],
    ['estojo_pesca', 'H28'],
    ['esponjas', 'H30'],
    ['abre_latas', 'H32'],
    ['tesouras', 'H34'],
    ['sacos_enjoo', 'H36'],
    ['heliografo', 'H38'],
    ['manual_sobrevivencia', 'H40'],
    ['quadro_sinais', 'H42'],
    ['saco_agua', 'E62'],
    ['copo_graduado', 'E64'],
    ['racoes_alimentares', 'E66'],
  ];

  const dateMappings: Array<[string, string]> = [
    ['validade_luzes_exteriores', 'C29'],
    ['validade_bateria', 'F23'],
    ['validade_agua', 'F63'],
    ['validade_racoes', 'F67'],
    ['validade_farmacia', 'J13'],
    ['validade_comprimidos', 'J15'],
    ['validade_paraquedas', 'J17'],
    ['validade_fachos_mao', 'J19'],
    ['validade_potes_fumo', 'J21'],
    ['validade_lanterna', 'J23'],
    ['validade_pilhas_lanterna', 'J25'],
  ];

  const textMappings: Array<[string, string]> = [
    ['cilindro_co2', 'C47'],
    ['cabeca_disparo', 'C49'],
    ['comprimento_retenida', 'F41'],
    ['lote_farmacia', 'I12'],
    ['lote_comprimidos', 'I14'],
    ['lote_paraquedas', 'I16'],
    ['lote_fachos', 'I18'],
    ['lote_potes', 'I20'],
    ['lote_lanterna', 'I22'],
    ['lote_bateria', 'I24'],
  ];

  const referenceWithQuantityMappings: Array<[string, string, string, number]> = [
    ['ref_farmacia', 'qtd_farmacia', 'J12', 1],
    ['ref_comprimidos', 'qtd_comprimidos', 'J14', 1],
    ['ref_paraquedas', 'qtd_paraquedas', 'J16', 2],
    ['ref_fachos', 'qtd_fachos', 'J18', 2],
    ['ref_potes', 'qtd_potes', 'J20', 1],
    ['ref_lanterna', 'qtd_lanterna', 'J22', 1],
    ['ref_bateria', 'qtd_pilhas_lanterna', 'J24', 4],
    ['ref_cinta_fecho', 'qtd_cinta_fecho', 'F37', 1],
    ['ref_jogo_reparacao', 'qtd_jogo_reparacao', 'F53', 1],
  ];

  statusMappings.forEach(([key, cellAddress]) => setChecklistCell(ws, checklist, key, cellAddress, 'status'));
  dateMappings.forEach(([key, cellAddress]) => setChecklistCell(ws, checklist, key, cellAddress, 'date'));
  textMappings.forEach(([key, cellAddress]) => setChecklistCell(ws, checklist, key, cellAddress, 'text'));
  referenceWithQuantityMappings.forEach(([refKey, qtyKey, cellAddress, fallbackQty]) => {
    const value = formatReferenceWithQuantity(checklist, refKey, qtyKey, fallbackQty);
    if (!value) return;
    setCell(ws.getCell(cellAddress), value);
  });

  setCell(ws.getCell('F25'), batteryModel);
  setCell(ws.getCell('F37'), input.contentorClosureText);
  setCell(ws.getCell('F41'), input.contentorPainterLength || checklist.comprimento_retenida);
}

function configureQuadroPrintLayout(ws: ExcelJS.Worksheet) {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    verticalCentered: false,
    printArea: 'A1:J84',
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.2,
      footer: 0.2,
    },
  };
}

export async function buildQuadroInspectionArtifacts(input: QuadroTemplateInput) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  const worksheet = workbook.getWorksheet('QUADRO') || workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('Folha QUADRO não encontrada no template quadro.');
  }

  fillTemplate(worksheet, input);
  configureQuadroPrintLayout(worksheet);

  const written = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.isBuffer(written) ? written : Buffer.from(written as ArrayBuffer);

  const fileName = buildQuadroFileName(input as QuadroTemplateInput & Record<string, unknown>);
  return { buffer, fileName };
}
