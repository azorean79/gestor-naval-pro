import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeEventStatus, normalizeInspectionType } from "@/types/agenda";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(20, Number(searchParams.get("limit") || 50)));

  const rows = await prisma.agendaEvento.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const entries = rows.map((row) => ({
    id: row.id,
    happenedAt: row.updatedAt.toISOString(),
    action: "upsert",
    event: {
      id: row.id,
      title: row.title,
      date: row.date.toISOString(),
      raftSerial: row.raftSerial,
      responsavel: row.responsavel || "",
      status: normalizeEventStatus(row.status),
      inspectionType: normalizeInspectionType(row.inspectionType),
      durationMinutes: row.durationMinutes,
      bufferBeforeMinutes: row.bufferBeforeMinutes,
      bufferAfterMinutes: row.bufferAfterMinutes,
    },
  }));

  return NextResponse.json({ total: entries.length, entries });
}
