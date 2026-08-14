import { NextRequest, NextResponse } from "next/server";
import { getManualLibraryUrl } from "@/lib/external-tech-docs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get("path");

    if (requestedPath) {
      return NextResponse.redirect(getManualLibraryUrl(), { status: 307 });
    }

    return NextResponse.json({
      external: true,
      driveUrl: getManualLibraryUrl(),
      message: "Os manuais são geridos externamente no Google Drive.",
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Não foi possível listar os manuais.", details },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Os manuais são geridos externamente no Google Drive." },
    { status: 405 }
  );
}
