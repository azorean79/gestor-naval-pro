import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { summarizeImportRows } from '@/lib/ia-import-analysis';
import { beginApiRequest, captureApiError, finishApiRequest, withRequestId } from '@/lib/observability';

export const runtime = 'nodejs';
export const maxDuration = 30;

type FeedbackPayload = {
  fileName?: string;
  fileType?: 'pdf' | 'excel';
  extractedColumns?: string[];
  extractedHeader?: Record<string, string | number | null>;
  correctedHeader?: Record<string, string | number | null>;
  originalRows?: Record<string, string | number | null>[];
  correctedRows?: Record<string, string | number | null>[];
  notes?: string;
};

// In Vercel serverless, project files are read-only; use /tmp for runtime writes.
const FEEDBACK_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'scripts');
const FEEDBACK_FILE = path.join(FEEDBACK_DIR, 'ia_training_feedback.jsonl');

export async function POST(request: Request) {
  const context = beginApiRequest(request, 'ia-importacao');
  const respond = (body: unknown, init?: ResponseInit, extra?: Record<string, unknown>) => {
    const response = NextResponse.json(body, init);
    finishApiRequest(context, response.status, extra);
    return withRequestId(response, context);
  };

  try {
    const payload = (await request.json()) as FeedbackPayload;

    if (!payload || !Array.isArray(payload.correctedRows)) {
      return respond({ error: 'Payload inválido para treino.' }, { status: 400 });
    }

    const analysisSummary = summarizeImportRows(payload.correctedRows, payload.fileName || null);

    const entry = {
      createdAt: new Date().toISOString(),
      source: 'ia-importacao',
      fileName: payload.fileName || null,
      fileType: payload.fileType || null,
      extractedColumns: Array.isArray(payload.extractedColumns) ? payload.extractedColumns : [],
      extractedHeader: payload.extractedHeader || {},
      correctedHeader: payload.correctedHeader || {},
      originalRows: Array.isArray(payload.originalRows) ? payload.originalRows : [],
      correctedRows: payload.correctedRows,
      analysisSummary,
      autoRules: analysisSummary.autoRules,
      notes: String(payload.notes || '').trim() || null,
    };

    await fs.mkdir(FEEDBACK_DIR, { recursive: true });
    await fs.appendFile(FEEDBACK_FILE, `${JSON.stringify(entry)}\n`, 'utf8');

    return respond(
      { ok: true, message: 'Correções registadas para treino.', file: FEEDBACK_FILE },
      undefined,
      { fileName: payload.fileName || null, fileType: payload.fileType || null, correctedRowsCount: payload.correctedRows.length }
    );
  } catch (error) {
    captureApiError(context, error);
    const message = error instanceof Error ? error.message : 'Erro ao guardar correções.';
    return respond({ error: message }, { status: 500 });
  }
}
