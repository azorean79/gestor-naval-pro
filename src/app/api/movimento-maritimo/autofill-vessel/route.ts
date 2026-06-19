import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
    }

    const { formId, queryName } = await req.json();

    if (!queryName || typeof queryName !== "string") {
      return NextResponse.json({ error: "Nome de navio inválido." }, { status: 400 });
    }

    const searchUrl = `https://www.vesselfinder.com/vessels?name=${encodeURIComponent(queryName.trim())}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch VesselFinder:", response.status);
      return NextResponse.json({ error: "Falha ao contactar o VesselFinder." }, { status: 502 });
    }

    const html = await response.text();

    const resultTableMatch = html.match(/<table class="results">([\s\S]*?)<\/table>/i);
    if (!resultTableMatch) {
      return NextResponse.json({ error: "Nenhum resultado encontrado." }, { status: 404 });
    }

    const tableHtml = resultTableMatch[1];
    
    // Attempt to extract the first row
    const rowMatch = tableHtml.match(/<tr[\s\S]*?<\/tr>/i);
    if (!rowMatch) {
      return NextResponse.json({ error: "Lista de navios vazia na pesquisa." }, { status: 404 });
    }

    const firstRowHtml = rowMatch[0];

    // VesselFinder usually embeds imo and mmsi directly in the link or data-attributes of the row.
    // e.g. <a href="/vessels/details/9811000" ... or <tr data-mmsi="..." data-imo="...">
    // Let's capture name, flag, imo, mmsi via loose regex.
    const imoMatches = firstRowHtml.match(/(?:imo|IMO)[\s\=\-]*(\d{7})/i) || firstRowHtml.match(/\/details\/[0-9]{7}/i);
    const mmsiMatches = firstRowHtml.match(/mmsi[\s\=\-]*"?(\d{9})"?/i);
    const flagMatches = firstRowHtml.match(/class="flag-icon[^"]+" title="([^"]+)"/i);
    const typeMatches = firstRowHtml.match(/class="v3"[^>]*>([^<]+)<\/td>/i);
    const callsignMatches = firstRowHtml.match(/callsign[\s\=\-]*"?([\w\d]+)"?/i);

    let extractedImo = null;
    if (imoMatches && imoMatches[1]) {
      extractedImo = imoMatches[1];
    } else if (imoMatches && imoMatches[0]) {
      extractedImo = imoMatches[0].replace(/\D/g, "");
    }

    let extractedMmsi = mmsiMatches ? mmsiMatches[1] : null;

    if (!extractedImo && !extractedMmsi) {
      // Fallback: search the entire first row text for 9 or 7 digit numbers
      const digits9 = firstRowHtml.match(/\b\d{9}\b/);
      if (digits9) extractedMmsi = digits9[0];
      
      const digits7 = firstRowHtml.match(/(?<!\d)\d{7}(?!\d)/);
      if (digits7) extractedImo = digits7[0];
    }

    const payload = {
      baseNameRequested: queryName,
      imo: extractedImo || null,
      mmsi: extractedMmsi || null,
      flag: flagMatches ? flagMatches[1].trim() : null,
      type: typeMatches ? typeMatches[1].trim() : null,
      callSign: callsignMatches ? callsignMatches[1].trim() : null,
    };

    if (formId) {
      const dbNavio = await prisma.navio.findUnique({ where: { id: Number(formId) } });
      if (dbNavio && (payload.imo || payload.mmsi)) {
        await prisma.navio.update({
          where: { id: dbNavio.id },
          data: {
            imo: dbNavio.imo || payload.imo,
            mmsi: dbNavio.mmsi || payload.mmsi,
            bandeira: dbNavio.bandeira || payload.flag,
            callSignal: dbNavio.callSignal || payload.callSign,
          }
        });
      }
    }

    return NextResponse.json({ success: true, payload });

  } catch (error: any) {
    console.error("VesselFinder bridge error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
