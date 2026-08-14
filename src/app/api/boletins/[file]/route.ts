import { NextResponse } from 'next/server';
import { getBoletinsLibraryUrl } from '@/lib/external-tech-docs';

export async function GET() {
  return NextResponse.redirect(getBoletinsLibraryUrl(), { status: 307 });
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Os boletins são geridos externamente no Google Drive.' },
    { status: 405 }
  );
}
