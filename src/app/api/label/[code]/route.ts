import { NextResponse } from 'next/server';
import bwipjs from 'bwip-js';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const resolvedParams = await context.params;
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: resolvedParams.code,
      scale: 3,
      includetext: true,
      textxalign: 'center',
    });
    return new NextResponse(png as unknown as BodyInit, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 });
  }
}
