import { PrismaClient } from '@prisma/client';
import { canonicalizeRaftBrand, canonicalizeRaftModel } from '../src/lib/text-normalization';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

// Paths
const dir2025 = "C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\gestornaval\\gestor-naval-pro\\OREY DIGITAL 2026\\2025\\CERTIFICADOS 2025";
const dir2026 = "D:\\CERTIFICADOS 2026";
const file2025Validades = "C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\oreyazores26\\scripts\\jangadas_pack_validades_2025.json";
const file2026Validades = "C:\\Users\\julio\\Desktop\\APLICACAO MASTER\\oreyazores26\\scripts\\jangadas_pack_validades_2026.json";

interface ValidadeItem {
  item: string;
  validade: string;
  row?: number;
}

interface RowValidades {
  file: string;
  raftSerial?: string;
  shipName?: string;
  owner?: string;
  validities: ValidadeItem[];
}

interface InspectionRecord {
  certNo: string;
  shipName: string;
  clientName: string;
  raftSerial: string;
  brand: string;
  model: string;
  capacity: number;
  manufDate: string;
  fabricType: string;
  painterLength: string;
  maxStowageHeight: string;
  cylinderSerial: string;
  cylinderCo2: string;
  cylinderN2: string;
  cylinderDataTeste: string;
  cylinderPesoBruto?: string;
  cylinderTara?: string;
  packType: string;
  flag: string;
  inspectionDate: string;
  nextInspectionDate: string;
  validities: ValidadeItem[];
  fileName: string;
  year: number;
}

// Helper functions
function clean(value: any): string {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/\.\s+/g, '.').trim();
}

function norm(value: any): string {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function toMatrix(sheet: XLSX.WorkSheet): string[][] {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  return rows.map((row) => row.map((cell) => clean(cell)));
}

function getCell(rows: string[][], r: number, c: number): string {
  return rows[r]?.[c] || '';
}

function findLabel(rows: string[][], labels: string[], maxRow?: number): { r: number; c: number } | null {
  const targets = labels.map(norm);
  for (let r = 0; r < rows.length; r += 1) {
    if (typeof maxRow === 'number' && r > maxRow) break;
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c += 1) {
      const cell = norm(row[c]);
      if (!cell) continue;
      if (targets.some((t) => cell === t || cell.startsWith(`${t} `))) {
        return { r, c };
      }
    }
  }
  return null;
}

function extractValueForLabel(rows: string[][], pos: { r: number; c: number } | null): string {
  if (!pos) return '';
  // Procurar na mesma linha de pos.c + 1 a pos.c + 9
  for (let c = pos.c + 1; c < pos.c + 10; c++) {
    const val = clean(getCell(rows, pos.r, c));
    if (val && !isLikelyLabel(val)) return val;
  }
  // Tentar na linha seguinte, ignorando placeholders/traduções conhecidas
  for (let c = pos.c; c < pos.c + 5; c++) {
    const val = clean(getCell(rows, pos.r + 1, c));
    if (val && !isLikelyLabel(val) && !val.toLowerCase().includes("nome do navio") && !val.toLowerCase().includes("armador") && !val.toLowerCase().includes("nacionalidade")) {
      return val;
    }
  }
  return '';
}

function valueNear(rows: string[][], pos: { r: number; c: number } | null): string {
  return extractValueForLabel(rows, pos);
}

function isLikelyLabel(text: string): boolean {
  const v = clean(text);
  if (!v) return false;
  if (v.endsWith(':')) return true;
  const n = norm(v);
  return (
    n.includes('CERTIFICATE') ||
    n.includes('CERTIFICADO') ||
    n.includes('INSPECTION') ||
    n.includes('SERIAL NO') ||
    n.includes('NO. SERIE') ||
    n.includes('DATA DE FABR') ||
    n.includes('DATE OF MANUF') ||
    n.includes('NAME OF SHIP') ||
    n.includes('NOME DO NAVIO') ||
    n.includes('SHIP OWNER') ||
    n.includes('ARMADOR')
  );
}

function valueBelowSameColumn(rows: string[][], pos: { r: number; c: number } | null, maxLookahead = 4): string {
  if (!pos) return '';
  for (let i = 1; i <= maxLookahead; i += 1) {
    const v = clean(getCell(rows, pos.r + i, pos.c));
    if (v && !isLikelyLabel(v)) return v;
  }
  return '';
}

function excelDateToJsDate(excelSerial: any): Date | null {
  if (!excelSerial) return null;
  const num = Number(excelSerial);
  if (isNaN(num)) return null;
  return new Date(Math.round((num - 25569) * 86400 * 1000));
}

function parseExcelDate(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (!isNaN(val) && String(val).trim() !== '') {
    const d = excelDateToJsDate(val);
    if (d && !isNaN(d.getTime())) return d;
  }
  const str = String(val).trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(str + 'T00:00:00.000Z');
  }
  const dmy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month, day));
  }
  
  const my = str.match(/^(\d{1,2})[\/-](\d{2,4})$/);
  if (my) {
    const month = parseInt(my[1], 10) - 1;
    let year = parseInt(my[2], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month, 1));
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function formatDateToIso(date: Date | null): string {
  if (!date) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseCapacity(text: string): number {
  const compact = norm(text);
  const m = compact.match(/\b(\d{1,2})\s*P\b/) || compact.match(/\b(\d{1,2})\b/);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : 0;
}

function inferBrand(typeText: string): string {
  const t = norm(typeText);
  if (t.includes('ZODIAC')) return 'ZODIAC';
  if (t.includes('RFD')) return 'RFD';
  if (t.includes('PLASTIMO') || t.includes('PLASTIMAR')) return 'PLASTIMO';
  if (t.includes('LALIZAS')) return 'LALIZAS';
  if (t.includes('EUROVINIL')) return 'EUROVINIL';
  if (t.includes('SEA-SAFE') || t.includes('SEA SAFE')) return 'SEA-SAFE';
  if (t.includes('DSB')) return 'DSB';
  if (t.includes('ARIMAR')) return 'ARIMAR';
  if (t.includes('OSCULATI') || t.includes('OSCALTI')) return 'OSCULATI';
  if (t.includes('ALMAR')) return 'ALMAR';
  return 'N/D';
}

function normalizePackType(value: string): string {
  const normalized = norm(value);
  if (!normalized) return 'N/D';

  if (normalized.includes('SOLAS A')) return 'SOLAS A';
  if (normalized.includes('SOLAS B')) return 'SOLAS B';
  if (normalized.includes('ISO')) return 'ISO-RAFT';
  if (normalized.includes('OFFSHORE')) return 'OFFSHORE';
  if (normalized.includes('COASTAL')) return 'COASTAL';
  if (normalized.includes('ORC+')) return 'OFFSHORE';
  if (normalized.includes('ORC')) return 'COASTAL';
  if (normalized.includes('STD') || normalized.includes('STANDARD') || normalized === 'R') return 'R';

  return clean(value) || 'N/D';
}

// Custom parser for 2025 layout (CERTIFICADO sheet)
function parseWorkbook2025(wb: XLSX.WorkBook, filePath: string) {
  const certSheetName = wb.SheetNames.find((s) => norm(s) === 'CERTIFICADO') || wb.SheetNames[0];
  const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];

  const certNoPos = findLabel(certRows, ['CERTIFICATE NO.:', 'CERTIFICADO NO.:', 'CERTIFICADO NO']);
  const shipPos = findLabel(certRows, ['NAME OF SHIP:', 'NOME DO NAVIO']);
  const ownerPos = findLabel(certRows, ['SHIP OWNER:', 'ARMADOR:']);
  const flagPos = findLabel(certRows, ['FLAG OF SHIP:', 'NACIONALIDADE:']);
  
  const idPos = findLabel(certRows, ['IDENTIFICATION:', 'IDENTIFICAÇÃO:']);
  const cylPos = findLabel(certRows, ['CYLINDERS:', 'CILINDROS:']);
  const verPos = findLabel(certRows, ['VERIFICATION:', 'VERIFICAÇÃO:']);

  const fileName = path.basename(filePath);

  const certNo = certNoPos ? clean(extractValueForLabel(certRows, certNoPos)) : '';
  const shipName = (clean(valueNear(certRows, shipPos)) || valueBelowSameColumn(certRows, shipPos, 3) || clean(fileName.replace(/\.xlsx$/i, '').replace(/^AZ\d{2}-\d+\s*/i, ''))).replace(/\s+SOS$/i, '');
  const owner = clean(valueNear(certRows, ownerPos)) || valueBelowSameColumn(certRows, ownerPos, 3);
  const flag = clean(valueNear(certRows, flagPos));

  const idValRow = idPos ? idPos.r + 2 : 11;
  const type = clean(getCell(certRows, idValRow, 2));
  const capacity = parseCapacity(getCell(certRows, idValRow, 6));
  const serial = clean(getCell(certRows, idValRow, 8));
  const manufDate = formatDateToIso(parseExcelDate(getCell(certRows, idValRow, 10)));
  
  const fabricType = clean(getCell(certRows, idValRow + 3, 2));
  const painterLength = clean(getCell(certRows, idValRow + 3, 6));
  const maxStowageHeight = clean(getCell(certRows, idValRow + 3, 10));

  const cylValRow = cylPos ? cylPos.r + 2 : 18;
  const cylinderSerial = clean(getCell(certRows, cylValRow, 2));
  const cylinderCo2 = clean(getCell(certRows, cylValRow, 6));
  const cylinderN2 = clean(getCell(certRows, cylValRow, 8));
  const cylinderDataTeste = formatDateToIso(parseExcelDate(getCell(certRows, cylValRow, 10)));

  const verValRow = verPos ? verPos.r + 2 : 46;
  const inspectionDate = formatDateToIso(parseExcelDate(getCell(certRows, verValRow, 2)));
  const nextInspectionDate = formatDateToIso(parseExcelDate(getCell(certRows, verValRow, 10)));

  const packType = clean(getCell(certRows, 25, 6));

  return {
    fileName,
    certNo,
    shipName,
    serial,
    owner,
    type,
    capacity,
    manufDate,
    fabricType,
    painterLength,
    maxStowageHeight,
    cylinderSerial,
    cylinderCo2,
    cylinderN2,
    cylinderDataTeste,
    inspectionDate,
    nextInspectionDate,
    packType,
    flag,
  };
}

// Custom parser for 2026 layout (QUADRO sheet)
function parseWorkbook2026(wb: XLSX.WorkBook, filePath: string) {
  const certSheetName = wb.SheetNames.find((s) => norm(s) === 'QUADRO') || wb.SheetNames[0];
  const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];

  const certNoPos = findLabel(certRows, ['CERT. Nº', 'CERT. NO']);
  const shipPos = findLabel(certRows, ['NAVIO:', 'SHIP:']);
  const serialPos = findLabel(certRows, ['JANGADA:', 'LIFERAFT:']);
  const typePos = findLabel(certRows, ['MARCA/MODELO:', 'BRAND/TYPE:']);

  const fileName = path.basename(filePath);

  const certNo = certNoPos ? clean(getCell(certRows, certNoPos.r, certNoPos.c + 1)) : '';
  const shipName = shipPos ? clean(getCell(certRows, shipPos.r, shipPos.c + 1)) : '';
  const serial = serialPos ? clean(getCell(certRows, serialPos.r, serialPos.c + 1)) : '';
  
  const brand = typePos ? clean(getCell(certRows, typePos.r, typePos.c + 1)) : '';
  const model = typePos ? clean(getCell(certRows, typePos.r, typePos.c + 2)) : '';
  const capacity = typePos ? parseCapacity(getCell(certRows, typePos.r, typePos.c + 3)) : 0;

  const painterLength = clean(getCell(certRows, 40, 5));
  const packType = clean(getCell(certRows, 46, 4));

  const cylinderSerial = clean(getCell(certRows, 55, 8));
  const cylinderPesoBruto = clean(getCell(certRows, 57, 8));
  const cylinderTara = clean(getCell(certRows, 59, 8));
  const cylinderCo2 = clean(getCell(certRows, 61, 8));
  const cylinderN2 = clean(getCell(certRows, 63, 8));
  const cylinderDataTeste = formatDateToIso(parseExcelDate(getCell(certRows, 65, 8)));

  const manufDate = formatDateToIso(parseExcelDate(getCell(certRows, 78, 6)));
  const inspectionDate = formatDateToIso(parseExcelDate(getCell(certRows, 80, 5)));
  
  let nextInspectionDate = '';
  if (inspectionDate) {
    const d = new Date(inspectionDate + 'T00:00:00.000Z');
    d.setUTCFullYear(d.getUTCFullYear() + 1);
    nextInspectionDate = formatDateToIso(d);
  }

  return {
    fileName,
    certNo,
    shipName,
    serial,
    brand,
    model,
    capacity,
    painterLength,
    packType,
    cylinderSerial,
    cylinderPesoBruto,
    cylinderTara,
    cylinderCo2,
    cylinderN2,
    cylinderDataTeste,
    manufDate,
    inspectionDate,
    nextInspectionDate,
  };
}

// Unified parser that auto-detects layout
function parseWorkbook(filePath: string): any {
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheets = wb.SheetNames.map(s => s.toUpperCase());
  
  let res: any = null;
  if (sheets.includes("CERTIFICADO")) {
    res = parseWorkbook2025(wb, filePath);
    res.layout = "CERTIFICADO";
    res.model = res.type;
    res.brand = inferBrand(res.type);
    if (path.basename(filePath).toUpperCase().includes("SOS")) {
      res.model = "SOS";
      if (res.brand === 'N/D') {
        res.brand = inferBrand(path.basename(filePath) + ' ' + res.type);
      }
    }
  } else if (sheets.includes("QUADRO")) {
    res = parseWorkbook2026(wb, filePath);
    res.layout = "QUADRO";
    res.type = res.model;
    if (path.basename(filePath).toUpperCase().includes("SOS")) {
      res.model = "SOS";
    }
  } else {
    res = {
      layout: "UNKNOWN",
      fileName: path.basename(filePath),
      certNo: '',
      shipName: '',
      serial: '',
      owner: '',
      type: '',
      brand: '',
      model: '',
      capacity: 0,
      manufDate: '',
      fabricType: '',
      painterLength: '',
      maxStowageHeight: '',
      cylinderSerial: '',
      cylinderCo2: '',
      cylinderN2: '',
      cylinderDataTeste: '',
      cylinderPesoBruto: '',
      cylinderTara: '',
      inspectionDate: '',
      nextInspectionDate: '',
      packType: '',
      flag: ''
    };
  }
  return res;
}

async function main() {
  console.log("🚀 INICIANDO SEED DE JANGADAS E CERTIFICADOS AUTOMÁTICO 🚀\n");

  let station = await prisma.serviceStation.findFirst({ where: { codigo: 'ACORES' } });
  if (!station) {
    console.log("Criando Estação de Serviço ACORES...");
    station = await prisma.serviceStation.create({
      data: {
        codigo: 'ACORES',
        nome: 'Orey Técnica Açores',
        ativo: true
      }
    });
  }
  const serviceStationId = station.id;

  const validades2025: RowValidades[] = JSON.parse(fs.readFileSync(file2025Validades, 'utf8')).rows || [];
  const validades2026: RowValidades[] = JSON.parse(fs.readFileSync(file2026Validades, 'utf8')).rows || [];

  console.log(`Lidas ${validades2025.length} validades de 2025`);
  console.log(`Lidas ${validades2026.length} validades de 2026`);

  const clientMap = new Map<string, number>();
  const shipMap = new Map<string, number>();
  const jangadaMap = new Map<string, number>();
  const inspecaoMap = new Map<string, number>();

  console.log("Carregando registos existentes da base de dados para cache...");
  const dbClients = await prisma.cliente.findMany();
  dbClients.forEach(c => clientMap.set(c.nome, c.id));
  
  const dbShips = await prisma.navio.findMany();
  dbShips.forEach(s => shipMap.set(s.nome, s.id));

  const dbJangadas = await prisma.jangada.findMany();
  dbJangadas.forEach(j => jangadaMap.set(j.serial, j.id));

  const dbInspecoes = await prisma.inspecao.findMany();
  dbInspecoes.forEach(i => inspecaoMap.set(i.certificadoNumero, i.id));

  const uniqueLiferafts = new Map<string, InspectionRecord[]>();

  // Process 2025
  for (const row of validades2025) {
    const filePath = path.join(dir2025, row.file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const parsed = parseWorkbook(filePath);
      const serial = parsed.serial || row.raftSerial;
      if (!serial) continue;

      const clientName = clean(parsed.owner) || "CLIENTE DESCONHECIDO";
      const shipName = clean(parsed.shipName) || clean(row.shipName) || "NAVIO DESCONHECIDO";
      const certNo = parsed.certNo || row.file.replace('.xlsx', '');

      const inspection: InspectionRecord = {
        certNo,
        shipName,
        clientName,
        raftSerial: serial,
        brand: parsed.brand || inferBrand(parsed.type),
        model: parsed.model || '',
        capacity: parsed.capacity || 0,
        manufDate: parsed.manufDate || '',
        fabricType: parsed.fabricType || '',
        painterLength: parsed.painterLength || '',
        maxStowageHeight: parsed.maxStowageHeight || '',
        cylinderSerial: parsed.cylinderSerial || '',
        cylinderCo2: parsed.cylinderCo2 || '',
        cylinderN2: parsed.cylinderN2 || '',
        cylinderDataTeste: parsed.cylinderDataTeste || '',
        packType: normalizePackType(parsed.packType),
        flag: parsed.flag || 'PORTUGAL',
        inspectionDate: parsed.inspectionDate || '2025-01-01',
        nextInspectionDate: parsed.nextInspectionDate || '2026-01-01',
        validities: row.validities || [],
        fileName: row.file,
        year: 2025
      };

      if (!uniqueLiferafts.has(serial)) uniqueLiferafts.set(serial, []);
      uniqueLiferafts.get(serial)!.push(inspection);
    } catch (e: any) {
      console.error(`Erro ao ler 2025 ${row.file}:`, e.message);
    }
  }

  // Process 2026
  for (const row of validades2026) {
    const filePath = path.join(dir2026, row.file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const parsed = parseWorkbook(filePath);
      const serial = parsed.serial || row.raftSerial;
      if (!serial) continue;

      const clientName = clean(row.owner) || "CLIENTE DESCONHECIDO";
      const shipName = clean(parsed.shipName) || clean(row.shipName) || "NAVIO DESCONHECIDO";
      const certNo = parsed.certNo || row.certNumber || row.file.replace('.xlsx', '');

      const inspection: InspectionRecord = {
        certNo,
        shipName,
        clientName,
        raftSerial: serial,
        brand: parsed.brand || inferBrand(parsed.model),
        model: parsed.model || '',
        capacity: parsed.capacity || 0,
        manufDate: parsed.manufDate || '',
        fabricType: '',
        painterLength: parsed.painterLength || '',
        maxStowageHeight: '',
        cylinderSerial: parsed.cylinderSerial || '',
        cylinderPesoBruto: parsed.cylinderPesoBruto || '',
        cylinderTara: parsed.cylinderTara || '',
        cylinderCo2: parsed.cylinderCo2 || '',
        cylinderN2: parsed.cylinderN2 || '',
        cylinderDataTeste: parsed.cylinderDataTeste || '',
        packType: normalizePackType(parsed.packType),
        flag: 'PORTUGAL',
        inspectionDate: parsed.inspectionDate || '2026-01-01',
        nextInspectionDate: parsed.nextInspectionDate || '2027-01-01',
        validities: row.validities || [],
        fileName: row.file,
        year: 2026
      };

      if (!uniqueLiferafts.has(serial)) uniqueLiferafts.set(serial, []);
      uniqueLiferafts.get(serial)!.push(inspection);
    } catch (e: any) {
      console.error(`Erro ao ler 2026 ${row.file}:`, e.message);
    }
  }

  console.log(`Escrevendo na base de dados...`);
  
  let index = 0;
  for (const [serial, certs] of uniqueLiferafts.entries()) {
    index++;
    if (index % 50 === 0) {
      console.log(`  Jangada ${index}/${uniqueLiferafts.size}...`);
    }

    const sortedCerts = [...certs].sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());
    const latest = sortedCerts[0];

    // Client
    let clientId: number | null = null;
    const clientName = latest.clientName;
    if (clientName && clientName !== "CLIENTE DESCONHECIDO") {
      if (clientMap.has(clientName)) {
        clientId = clientMap.get(clientName)!;
      } else {
        let dbClient = await prisma.cliente.findFirst({ where: { nome: clientName } });
        if (!dbClient) {
          const allClients = await prisma.cliente.findMany();
          const codes = allClients.map(c => c.numeroCliente).filter(Boolean).map(code => {
            const m = code.match(/^C(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
          });
          const max = codes.length > 0 ? Math.max(...codes) : 0;
          const nextCode = `C${String(max + 1).padStart(3, '0')}`;

          dbClient = await prisma.cliente.create({
            data: {
              nome: clientName,
              numeroCliente: nextCode,
              ilha: 'São Miguel',
              serviceStationId
            }
          });
        }
        clientId = dbClient.id;
        clientMap.set(clientName, clientId);
      }
    }

    // Ship
    let shipId: number | null = null;
    const shipName = latest.shipName;
    if (shipName && shipName !== "NAVIO DESCONHECIDO") {
      if (shipMap.has(shipName)) {
        shipId = shipMap.get(shipName)!;
      } else {
        let dbShip = await prisma.navio.findFirst({ where: { nome: shipName } });
        if (!dbShip) {
          dbShip = await prisma.navio.create({
            data: {
              nome: shipName,
              matricula: 'N/D',
              ilha: 'São Miguel',
              tipoPesca: 'N/D',
              clienteId: clientId,
              serviceStationId
            }
          });
        } else if (dbShip.clienteId !== clientId) {
          dbShip = await prisma.navio.update({
            where: { id: dbShip.id },
            data: { clienteId: clientId }
          });
        }
        shipId = dbShip.id;
        shipMap.set(shipName, shipId);
      }
    }

    // Jangada
    const rawBrand = latest.brand || 'N/D';
    const rawModel = latest.model || 'N/D';
    const brand = canonicalizeRaftBrand(rawBrand);
    const model = canonicalizeRaftModel(rawModel, brand, latest.packType, serial);
    
    const dbJangada = await prisma.jangada.upsert({
      where: { serial },
      update: {
        brand,
        model,
        capacity: latest.capacity,
        packType: latest.packType,
        owner: clientName,
        shipId,
        shipNameManual: shipName,
        dataInspecao: latest.inspectionDate,
        dataProxInspecao: latest.nextInspectionDate,
        ultimoCertificadoNumero: latest.certNo,
        dataFabrico: latest.manufDate,
        launchType: latest.maxStowageHeight ? 'TO' : 'Queda-Livre',
        painterLength: latest.painterLength,
        maxStowageHeight: latest.maxStowageHeight,
        fabricType: latest.fabricType || undefined,
        cylinderSerial: latest.cylinderSerial || undefined,
        cylinderCo2: latest.cylinderCo2 || undefined,
        cylinderN2: latest.cylinderN2 || undefined,
        cylinderDataTeste: latest.cylinderDataTeste || undefined,
        cylinderTara: latest.cylinderTara || undefined,
        cylinderPesoBruto: latest.cylinderPesoBruto || undefined,
        serviceStationId
      },
      create: {
        serial,
        brand,
        model,
        capacity: latest.capacity,
        packType: latest.packType,
        owner: clientName,
        shipId,
        shipNameManual: shipName,
        dataInspecao: latest.inspectionDate,
        dataProxInspecao: latest.nextInspectionDate,
        ultimoCertificadoNumero: latest.certNo,
        dataFabrico: latest.manufDate,
        launchType: latest.maxStowageHeight ? 'TO' : 'Queda-Livre',
        painterLength: latest.painterLength,
        maxStowageHeight: latest.maxStowageHeight,
        fabricType: latest.fabricType,
        cylinderSerial: latest.cylinderSerial,
        cylinderCo2: latest.cylinderCo2,
        cylinderN2: latest.cylinderN2,
        cylinderDataTeste: latest.cylinderDataTeste,
        cylinderTara: latest.cylinderTara,
        cylinderPesoBruto: latest.cylinderPesoBruto,
        serviceStationId
      }
    });

    jangadaMap.set(serial, dbJangada.id);

    // Inspecoes
    for (const cert of sortedCerts) {
      const dbInspecao = await prisma.inspecao.upsert({
        where: { certificadoNumero: cert.certNo },
        update: {
          navioNome: cert.shipName,
          navioId: shipId,
          jangadaId: dbJangada.id,
          jangadaSerial: serial,
          dataInspecao: cert.inspectionDate,
          dataProxInspecao: cert.nextInspectionDate,
          sourceFile: cert.fileName
        },
        create: {
          certificadoNumero: cert.certNo,
          navioNome: cert.shipName,
          navioId: shipId,
          jangadaId: dbJangada.id,
          jangadaSerial: serial,
          dataInspecao: cert.inspectionDate,
          dataProxInspecao: cert.nextInspectionDate,
          sourceFile: cert.fileName,
          status: 'Concluída'
        }
      });

      await prisma.artigoJangada.deleteMany({ where: { inspecaoId: dbInspecao.id } });

      for (const val of cert.validities) {
        const itemValidade = parseExcelDate(val.validade);
        await prisma.artigoJangada.create({
          data: {
            name: val.item,
            quantidade: val.item.includes("Rações") || val.item.includes("Water") ? 6 : 1,
            validade: itemValidade,
            referencia: val.item.toLowerCase().includes("first aid") ? "30202207" : null,
            jangadaId: dbJangada.id,
            inspecaoId: dbInspecao.id
          }
        });
      }

      if (cert.certNo === latest.certNo) {
        await prisma.artigoJangada.deleteMany({ where: { jangadaId: dbJangada.id, inspecaoId: null } });

        for (const val of cert.validities) {
          const itemValidade = parseExcelDate(val.validade);
          await prisma.artigoJangada.create({
            data: {
              name: val.item,
              quantidade: val.item.includes("Rações") || val.item.includes("Water") ? 6 : 1,
              validade: itemValidade,
              referencia: val.item.toLowerCase().includes("first aid") ? "30202207" : null,
              jangadaId: dbJangada.id,
              inspecaoId: null
            }
          });
        }
      }
    }
  }

  console.log("\n=== SEED JANGADAS COMPACTO CONCLUÍDO COM SUCESSO ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
