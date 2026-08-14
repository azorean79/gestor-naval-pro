import { NextResponse } from 'next/server';
import { buildQuadroPDFArtifacts } from '@/lib/quadro-pdf-template';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { buffer, fileName } = await buildQuadroPDFArtifacts(payload);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar quadro PDF:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o quadro PDF.' },
      { status: 500 }
    );
  }
}