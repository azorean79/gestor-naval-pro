import { NextResponse } from 'next/server';
import bwipjs from 'bwip-js';

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: params.code,
      scale: 3,
      includetext: true,
      textxalign: 'center',
    });
    return new NextResponse(png, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 });
  }
}
