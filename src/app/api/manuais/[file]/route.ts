import { NextRequest, NextResponse } from "next/server";
import { getManualLibraryUrl } from "@/lib/external-tech-docs";

export async function GET(_req: NextRequest, context: { params: Promise<{ file: string }> }) {
  return NextResponse.redirect(getManualLibraryUrl(), { status: 307 });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ file: string }> }) {
  return NextResponse.json(
    { error: "Os manuais são geridos externamente no Google Drive." },
    { status: 405 }
  );
}
