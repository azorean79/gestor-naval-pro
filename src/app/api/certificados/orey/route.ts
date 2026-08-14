import { NextResponse } from 'next/server';
import { buildOreyCertificateArtifacts, type OreyCertificateTemplateInput } from '@/lib/orey-certificate-template';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'html').toLowerCase();
    const payload = (await request.json()) as OreyCertificateTemplateInput;
    const { buffer, html, fileName } = await buildOreyCertificateArtifacts(payload);

    if (format === 'xlsx') {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ html, fileName });
  } catch (error) {
    console.error('Erro ao gerar certificado Orey:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o certificado Orey.' },
      { status: 500 }
    );
  }
}