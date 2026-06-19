import { NextResponse } from 'next/server';
import { buildQuadroInspectionArtifacts, type QuadroTemplateInput } from '@/lib/quadro-template';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as QuadroTemplateInput;
    const { buffer, fileName } = await buildQuadroInspectionArtifacts(payload);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar quadro de inspeção:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar o quadro de inspeção.' },
      { status: 500 }
    );
  }
}
