import { NextResponse } from "next/server";
import { getManualLibraryUrl } from "@/lib/external-tech-docs";

export async function GET() {
  return NextResponse.redirect(getManualLibraryUrl(), { status: 307 });
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Os manuais são geridos externamente no Google Drive." },
    { status: 405 }
  );
}
