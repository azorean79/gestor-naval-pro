import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Buscar todas as jangadas com data de próxima inspeção definida
    const jangadas = await prisma.jangada.findMany({
      where: {
        dataProxInspecao: {
          not: null,
        },
      },
      select: {
        id: true,
        serial: true,
        brand: true,
        model: true,
        capacity: true,
        shipNameManual: true,
        owner: true,
        dataProxInspecao: true,
        ultimoCertificadoNumero: true,
      },
    });

    const cleanDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;

    // Iniciar a construção do ficheiro iCalendar (.ics)
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Orey Tecnica Azores//Gestor de Jangadas//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Vistorias de Jangadas",
      "X-WR-TIMEZONE:Atlantic/Azores",
    ];

    for (const j of jangadas) {
      const rawDate = (j.dataProxInspecao || "").trim();
      if (!rawDate || rawDate.toUpperCase() === "N/D" || rawDate.toUpperCase() === "ND") continue;

      let dateObj: Date | null = null;

      // 1. Tentar parsear formato YYYY-MM-DD
      const matchYmd = rawDate.match(cleanDateRegex);
      if (matchYmd) {
        const year = parseInt(matchYmd[1], 10);
        const month = parseInt(matchYmd[2], 10) - 1;
        const day = parseInt(matchYmd[3], 10);
        dateObj = new Date(year, month, day);
      } else {
        // 2. Tentar outros formatos genéricos
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          dateObj = parsed;
        }
      }

      if (!dateObj) continue;

      // Formatar datas para o iCal (formato AAAAMMDD)
      const yearStr = dateObj.getFullYear();
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dayStr = String(dateObj.getDate()).padStart(2, "0");
      const dtStart = `${yearStr}${monthStr}${dayStr}`;

      // O evento dura todo o dia, então DTEND é o dia seguinte
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextYearStr = nextDay.getFullYear();
      const nextMonthStr = String(nextDay.getMonth() + 1).padStart(2, "0");
      const nextDayStr = String(nextDay.getDate()).padStart(2, "0");
      const dtEnd = `${nextYearStr}${nextMonthStr}${nextDayStr}`;

      const summary = `Vistoria: Jangada ${j.serial}`;
      const description = [
        `Número de Série: ${j.serial}`,
        `Marca/Modelo: ${j.brand || "—"} ${j.model || "—"} (${j.capacity}P)`,
        `Embarcação: ${j.shipNameManual || "—"}`,
        `Armador: ${j.owner || "—"}`,
        `Último Certificado: ${j.ultimoCertificadoNumero || "—"}`,
      ].join("\\n");

      icsContent.push(
        "BEGIN:VEVENT",
        `UID:jangada-inspeccao-${j.id}@oreytecnica.com`,
        `DTSTAMP:${yearStr}${monthStr}${dayStr}T000000Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      );
    }

    icsContent.push("END:VCALENDAR");

    const fileContent = icsContent.join("\r\n");

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Disposition": "attachment; filename=calendario-vistorias-jangadas.ics",
        "Content-Type": "text/calendar; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Erro ao gerar iCal:", error);
    return NextResponse.json(
      { error: "Erro ao gerar ficheiro de calendário iCal.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
