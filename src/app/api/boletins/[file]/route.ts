import { NextRequest, NextResponse } from 'next/server';
import { getBoletinsLibraryUrl } from '@/lib/external-tech-docs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  return NextResponse.redirect(getBoletinsLibraryUrl(), { status: 307 });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  return NextResponse.json(
    { error: 'Os boletins são geridos externamente no Google Drive.' },
    { status: 405 }
  );
}
