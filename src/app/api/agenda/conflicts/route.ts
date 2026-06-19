import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeEventStatus } from "@/types/agenda";

export async function GET() {
  const eventos = await prisma.agendaEvento.findMany({
    where: { status: { in: ["scheduled", "confirmed"] } },
    orderBy: { date: "asc" },
  });

  type Conflict = {
    type: "slot_capacity" | "responsible_overlap";
    description: string;
    date: string;
    eventIds: number[];
  };

  const conflicts: Conflict[] = [];

  // Build per-day slot map
  const byDaySlot: Record<string, typeof eventos> = {};
  for (const ev of eventos) {
    const day = ev.date.toISOString().slice(0, 10);
    const hour = ev.date.getHours();
    const slot = hour < 13 ? "morning" : "afternoon";
    const key = `${day}__${slot}`;
    if (!byDaySlot[key]) byDaySlot[key] = [];
    byDaySlot[key].push(ev);
  }

  // Check slot capacity (morning ≤ 2, afternoon ≤ 1)
  for (const [key, evs] of Object.entries(byDaySlot)) {
    const isAfternoon = key.endsWith("afternoon");
    const limit = isAfternoon ? 1 : 2;
    if (evs.length > limit) {
      conflicts.push({
        type: "slot_capacity",
        description: `${isAfternoon ? "Tarde" : "Manhã"} do dia ${key.slice(0, 10)} tem ${evs.length} inspeções (limite: ${limit})`,
        date: key.slice(0, 10),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventIds: evs.map((e: { id: number }) => e.id),
      });
    }
  }

  // Check responsible overlap (same responsible, overlapping windows)
  for (let i = 0; i < eventos.length; i++) {
    for (let j = i + 1; j < eventos.length; j++) {
      const a = eventos[i];
      const b = eventos[j];
      if (!a.responsavel || !b.responsavel) continue;
      if (a.responsavel.toLowerCase() !== b.responsavel.toLowerCase()) continue;

      const aStart = new Date(a.date.getTime() - a.bufferBeforeMinutes * 60_000);
      const aEnd = new Date(a.date.getTime() + (a.durationMinutes + a.bufferAfterMinutes) * 60_000);
      const bStart = new Date(b.date.getTime() - b.bufferBeforeMinutes * 60_000);
      const bEnd = new Date(b.date.getTime() + (b.durationMinutes + b.bufferAfterMinutes) * 60_000);

      if (aStart < bEnd && bStart < aEnd) {
        const overlapMs = Math.min(aEnd.getTime(), bEnd.getTime()) - Math.max(aStart.getTime(), bStart.getTime());
        const overlapMinutes = Math.round(overlapMs / 60_000);
        conflicts.push({
          type: "responsible_overlap",
          description: `Responsável "${a.responsavel}" tem sobreposição de ${overlapMinutes} min entre agendamentos #${a.id} e #${b.id}`,
          date: a.date.toISOString().slice(0, 10),
          eventIds: [a.id, b.id],
        });
      }
    }
  }

  return NextResponse.json({
    total: conflicts.length,
    conflicts,
  });
}
