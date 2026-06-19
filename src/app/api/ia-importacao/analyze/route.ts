import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { summarizeImportRows, type ImportAnalysisSummary } from '@/lib/ia-import-analysis';
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

type AnalyzeResponse = {
  fileName: string;
  fileType: 'pdf' | 'excel';
  sizeBytes: number;
  summary: {
    estimatedRecords?: number;
    sheetCount?: number;
    words?: number;
    lines?: number;
  };
  preview: {
    columns: string[];
    rows: Record<string, string | number | null>[];
    rawTextFull?: string;
    originalSheetHtml?: string;
    sourceSheetName?: string;
    analysis?: ImportAnalysisSummary;
  };
};

function cleanCellValue(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  return text.length ? text : null;
}

function formatCellValue(cell: any): string {
  if (!cell || cell.v == null) return "";
  const v = cell.v;
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const excelEpochUtc = Date.UTC(1899, 11, 30);
    const converted = new Date(excelEpochUtc + v * 24 * 60 * 60 * 1000);
    return converted.toISOString().slice(0, 10);
  }
  return String(v).trim();
}

function tryExtractFromGeneratedDocument(sheet: XLSX.WorkSheet): { documentKind: 'generated-certificate' | 'generated-quadro'; header: any; rows: any[] } | null {
  if (!sheet) return null;

  // 1. Detect and parse generated Quadro
  const qCert = sheet['I5']?.v;
  const qSerial = sheet['C7']?.v;
  const isQuadro = qCert && qSerial && sheet['H7']?.v;
  if (isQuadro) {
    const header = {
      certificadoNumero: String(qCert).trim(),
      raftSerial: String(qSerial).trim(),
      shipName: String(sheet['E7']?.v || '').trim(),
      brand: String(sheet['H7']?.v || '').trim(),
      model: String(sheet['I7']?.v || '').trim(),
      capacity: String(sheet['J7']?.v || '').trim(),
      dataInspecao: formatCellValue(sheet['F81']),
      dataProxInspecao: '',
      emergencyPackType: String(sheet['E47']?.v || sheet['F47']?.v || '').trim(),
      cylinderSerial: String(sheet['I56']?.v || '').trim(),
      cylinderPesoBruto: String(sheet['I58']?.v || '').trim(),
      cylinderTara: String(sheet['I60']?.v || '').trim(),
      cylinderCo2: String(sheet['I62']?.v || '').trim(),
      cylinderN2: String(sheet['I64']?.v || '').trim(),
      cylinderHydroTestDate: formatCellValue(sheet['I66']),
      cylinderSistema: String(sheet['H71']?.v || '').trim(),
    };

    const rows: any[] = [];
    const items = [
      { key: 'Luzes Exteriores', validityCell: 'C29', refCell: '', qty: 1 },
      { key: 'Bateria de Lítio', validityCell: 'F23', refCell: '', qty: 1 },
      { key: 'Saco de Água', validityCell: 'F63', refCell: '', qty: 1 },
      { key: 'Rações Alimentares 0,5 Kg', validityCell: 'F67', refCell: '', qty: 1 },
      { key: 'Farmácia Solas', validityCell: 'J13', refCell: 'J12', qty: 1 },
      { key: 'Comprimidos p/ Enjoo', validityCell: 'J15', refCell: 'J14', qty: 1 },
      { key: 'Foguetes Paraquedas', validityCell: 'J17', refCell: 'J16', qty: 2 },
      { key: 'Fachos de Mão', validityCell: 'J19', refCell: 'J18', qty: 2 },
      { key: 'Potes de Fumo', validityCell: 'J21', refCell: 'J20', qty: 1 },
      { key: 'Lanterna', validityCell: 'J23', refCell: 'J22', qty: 1 },
      { key: 'Pilhas para Lanterna', validityCell: 'J25', refCell: 'J24', qty: 4 },
    ];

    for (const item of items) {
      const val = formatCellValue(sheet[item.validityCell]);
      if (val) {
        let ref = item.refCell ? String(sheet[item.refCell]?.v || '').trim() : '';
        let qty = item.qty;
        if (ref) {
          const parts = ref.split(/\s+/);
          if (parts.length > 1) {
            ref = parts[0];
            const parsedQty = parseInt(parts[1], 10);
            if (!isNaN(parsedQty)) qty = parsedQty;
          }
        }
        rows.push({
          item: item.key,
          validade: val,
          referencia: ref,
          quantidade: qty,
        });
      }
    }

    return { documentKind: 'generated-quadro', header, rows };
  }

  // 2. Detect and parse generated Certificate
  const cCert = sheet['K3']?.v;
  const cSerial = sheet['I13']?.v || sheet['I27']?.v;
  const isCert = cCert && cSerial && sheet['C13']?.v;
  if (isCert) {
    const header = {
      certificadoNumero: String(cCert).trim(),
      raftSerial: String(cSerial).trim(),
      shipName: String(sheet['D65']?.v || '').trim(),
      brand: String(sheet['C3']?.v || '').trim(),
      model: String(sheet['C13']?.v || '').replace(String(sheet['C3']?.v || ''), '').trim(),
      capacity: String(sheet['G13']?.v || '').trim(),
      dataInspecao: formatCellValue(sheet['C48']),
      dataProxInspecao: formatCellValue(sheet['K48']),
      emergencyPackType: String(sheet['G27']?.v || '').trim(),
      ownerName: String(sheet['D67']?.v || '').trim(),
      cylinderSerial: String(sheet['D18']?.v || '').trim(),
      cylinderPesoBruto: '',
      cylinderTara: '',
      cylinderCo2: String(sheet['E18']?.v || '').trim(),
      cylinderN2: String(sheet['G18']?.v || '').trim(),
      cylinderHydroTestDate: formatCellValue(sheet['K18']),
      cylinderSistema: '',
    };

    const rows: any[] = [];
    const valFarmacia = formatCellValue(sheet['K35']);
    if (valFarmacia) {
      rows.push({
        item: 'Farmácia Solas',
        validade: valFarmacia,
        referencia: '',
        quantidade: 1,
      });
    }

    const valRadar = formatCellValue(sheet['K33']);
    if (valRadar) {
      rows.push({
        item: 'Reflector de Radar',
        validade: valRadar,
        referencia: String(sheet['G33']?.v || '').trim(),
        quantidade: 1,
      });
    }

    return { documentKind: 'generated-certificate', header, rows };
  }

  return null;
}

function analyzeExcel(buffer: Buffer, fileName: string, sizeBytes: number): AnalyzeResponse {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Scan all sheets to detect generated documents
  let certDoc: any = null;
  let quadroDoc: any = null;
  let certSheetName = '';
  let quadroSheetName = '';
  let certSheet: XLSX.WorkSheet | null = null;
  let quadroSheet: XLSX.WorkSheet | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const doc = tryExtractFromGeneratedDocument(sheet);
      if (doc) {
        if (doc.documentKind === 'generated-certificate') {
          certDoc = doc;
          certSheetName = sheetName;
          certSheet = sheet;
        } else if (doc.documentKind === 'generated-quadro') {
          quadroDoc = doc;
          quadroSheetName = sheetName;
          quadroSheet = sheet;
        }
      }
    }
  }

  // Case 1: Both certificate and quadro sheets are found -> Merge them
  if (certDoc && quadroDoc) {
    const mergedHeader = {
      ...quadroDoc.header,
      ...certDoc.header,
    };
    // Ensure non-empty/non-null values are preferred
    for (const key of Object.keys(mergedHeader)) {
      const k = key as keyof typeof mergedHeader;
      if (!mergedHeader[k] && quadroDoc.header[k]) {
        (mergedHeader as any)[k] = quadroDoc.header[k];
      }
    }

    const combinedRows = [...certDoc.rows, ...quadroDoc.rows];
    const dedupedRows: any[] = [];
    const seenItems = new Set<string>();

    for (const row of combinedRows) {
      const normalizedItemName = String(row.item || '').trim().toLowerCase();
      if (!seenItems.has(normalizedItemName)) {
        seenItems.add(normalizedItemName);
        dedupedRows.push({ ...row });
      } else {
        const existing = dedupedRows.find(
          (r) => String(r.item || '').trim().toLowerCase() === normalizedItemName
        );
        if (existing) {
          if (!existing.validade && row.validade) existing.validade = row.validade;
          if (!existing.referencia && row.referencia) existing.referencia = row.referencia;
          if ((!existing.quantidade || existing.quantidade < row.quantidade) && row.quantidade) {
            existing.quantidade = row.quantidade;
          }
        }
      }
    }

    const html1 = certSheet ? `<div class="sheet-section mb-4"><h3>Aba: ${certSheetName} (Certificado)</h3>${XLSX.utils.sheet_to_html(certSheet)}</div>` : '';
    const html2 = quadroSheet ? `<div class="sheet-section mt-4"><hr class="my-4"/><h3>Aba: ${quadroSheetName} (Quadro de Validades)</h3>${XLSX.utils.sheet_to_html(quadroSheet)}</div>` : '';
    const originalSheetHtml = html1 + html2;

    const analysisSummary = {
      documentKind: 'generated-certificate', // treat as generated-certificate to trigger proper UI fields
      totalRows: dedupedRows.length,
      flaggedRowsCount: 0,
      manufacturingDateRows: 0,
      nonExpiringRows: 0,
      flaggedRows: [],
      autoRules: ['Detetadas abas de Certificado e Quadro de Validades. Dados fundidos com sucesso.'],
    };

    return {
      fileName,
      fileType: 'excel',
      sizeBytes,
      summary: {
        estimatedRecords: dedupedRows.length,
        sheetCount: workbook.SheetNames.length,
      },
      preview: {
        columns: ['item', 'validade', 'referencia', 'quantidade'],
        rows: dedupedRows,
        originalSheetHtml,
        sourceSheetName: `${certSheetName} + ${quadroSheetName}`,
        analysis: analysisSummary as any,
        extractedHeader: mergedHeader,
      } as any,
    };
  }

  // Case 2: Only one of them is found
  const singleDoc = certDoc || quadroDoc;
  const singleSheet = certSheet || quadroSheet;
  const singleSheetName = certSheetName || quadroSheetName;
  if (singleDoc && singleSheet) {
    const analysisSummary = {
      documentKind: singleDoc.documentKind,
      totalRows: singleDoc.rows.length,
      flaggedRowsCount: 0,
      manufacturingDateRows: 0,
      nonExpiringRows: 0,
      flaggedRows: [],
      autoRules: [`Ficheiro gerado pelo sistema detetado (Aba: ${singleSheetName}). Dados extraídos com precisão celular.`],
    };

    return {
      fileName,
      fileType: 'excel',
      sizeBytes,
      summary: {
        estimatedRecords: singleDoc.rows.length,
        sheetCount: workbook.SheetNames.length,
      },
      preview: {
        columns: ['item', 'validade', 'referencia', 'quantidade'],
        rows: singleDoc.rows,
        originalSheetHtml: XLSX.utils.sheet_to_html(singleSheet),
        sourceSheetName: singleSheetName,
        analysis: analysisSummary as any,
        extractedHeader: singleDoc.header,
      } as any,
    };
  }

  // Case 3: Standard generic Excel file (analyze first sheet)
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

  if (!firstSheet) {
    return {
      fileName,
      fileType: 'excel',
      sizeBytes,
      summary: { estimatedRecords: 0, sheetCount: workbook.SheetNames.length },
      preview: { columns: [], rows: [] },
    };
  }

  const asRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: null,
    raw: false,
  });

  const originalSheetHtml = XLSX.utils.sheet_to_html(firstSheet);

  const columns = asRows.length ? Object.keys(asRows[0] || {}) : [];
  const rows = asRows.map((row) => {
    const mapped: Record<string, string | number | null> = {};
    for (const key of columns) {
      mapped[key] = cleanCellValue(row[key]);
    }
    return mapped;
  });

  return {
    fileName,
    fileType: 'excel',
    sizeBytes,
    summary: {
      estimatedRecords: asRows.length,
      sheetCount: workbook.SheetNames.length,
    },
    preview: {
      columns,
      rows,
      originalSheetHtml,
      sourceSheetName: firstSheetName,
      analysis: summarizeImportRows(rows, fileName, firstSheetName),
    },
  };
}

async function analyzePdf(buffer: Buffer, fileName: string, sizeBytes: number): Promise<AnalyzeResponse> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  const rawText = pageTexts.join('\n').replace(/\r/g, '');
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const words = rawText
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;

  const previewRows = lines.map((line, idx) => ({
    linha: idx + 1,
    conteudo: line,
  }));

  return {
    fileName,
    fileType: 'pdf',
    sizeBytes,
    summary: {
      words,
      lines: lines.length,
      estimatedRecords: lines.length,
    },
    preview: {
      columns: ['linha', 'conteudo'],
      rows: previewRows,
      rawTextFull: rawText,
      analysis: summarizeImportRows(previewRows, fileName),
    },
  };
}

export async function POST(request: Request) {
  const context = beginApiRequest(request, 'ia-importacao');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return respond({ error: 'Ficheiro inválido.' }, { status: 400 });
    }

    const fileName = file.name || 'ficheiro';
    const lower = fileName.toLowerCase();
    const sizeBytes = file.size;

    if (sizeBytes > MAX_UPLOAD_BYTES) {
      return respond(
        { error: `Ficheiro demasiado grande (${Math.round(sizeBytes / (1024 * 1024))}MB). Limite: 20MB.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const result = analyzeExcel(buffer, fileName, sizeBytes);
      return respond(result, undefined, {
        fileName,
        fileType: 'excel',
        estimatedRecords: result.summary.estimatedRecords,
      });
    }

    if (lower.endsWith('.pdf')) {
      const result = await analyzePdf(buffer, fileName, sizeBytes);
      return respond(result, undefined, {
        fileName,
        fileType: 'pdf',
        estimatedRecords: result.summary.estimatedRecords,
      });
    }

    return respond(
      { error: 'Formato não suportado. Use PDF, XLS ou XLSX.' },
      { status: 400 }
    );
  } catch (error) {
    captureApiError(context, error);
    const message = error instanceof Error ? error.message : 'Falha ao analisar ficheiro.';
    return respond({ error: message }, { status: 500 });
  }
}
