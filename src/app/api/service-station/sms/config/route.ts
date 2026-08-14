import { NextRequest, NextResponse } from "next/server";
import { getSmsConfig, saveSmsConfig } from "@/lib/sms-config";

export const runtime = "nodejs";

export async function GET() {
  const config = await getSmsConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }
    const config = await saveSmsConfig(body as Partial<import("@/lib/sms-config").SmsConfig>);
    return NextResponse.json({ config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao guardar configuração.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}