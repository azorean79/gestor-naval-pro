import { NextResponse } from 'next/server';
import { buildSurvitecModernReportHtml } from '@/lib/survitec-modern-report-template';
import type { OreyCertificateTemplateInput } from '@/lib/orey-certificate-template';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OreyCertificateTemplateInput;
    const { html, fileName } = buildSurvitecModernReportHtml(payload);
    return NextResponse.json({ html, fileName });
  } catch (error) {
    console.error('Erro ao gerar relatório moderno Survitec:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o relatório de inspeção moderno.' },
      { status: 500 }
    );
  }
}
