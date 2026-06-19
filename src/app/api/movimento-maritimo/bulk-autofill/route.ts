import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export const runtime = "nodejs";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function searchVesselFinder(name: string) {
  const searchUrl = `https://www.vesselfinder.com/vessels?name=${encodeURIComponent(name.trim())}`;
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const resultTableMatch = html.match(/<table class="results">([\s\S]*?)<\/table>/i);
    if (!resultTableMatch) return null;
    const firstRowMatch = resultTableMatch[1].match(/<tr[\s\S]*?<\/tr>/i);
    if (!firstRowMatch) return null;
    const htmlRow = firstRowMatch[0];

    const imoMatches = htmlRow.match(/(?:imo|IMO)[\s\=\-]*(\d{7})/i) || htmlRow.match(/\/details\/[0-9]{7}/i);
    const mmsiMatches = htmlRow.match(/mmsi[\s\=\-]*"?(\d{9})"?/i);

    let extractedImo = null;
    if (imoMatches && imoMatches[1]) extractedImo = imoMatches[1];
    else if (imoMatches && imoMatches[0]) extractedImo = imoMatches[0].replace(/\D/g, "");

    let extractedMmsi = mmsiMatches ? mmsiMatches[1] : null;

    if (!extractedImo && !extractedMmsi) {
      const digits9 = htmlRow.match(/\b\d{9}\b/);
      if (digits9) extractedMmsi = digits9[0];
      const digits7 = htmlRow.match(/(?<!\d)\d{7}(?!\d)/);
      if (digits7) extractedImo = digits7[0];
    }
    return { imo: extractedImo, mmsi: extractedMmsi };
  } catch {
    return null;
  }
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

async function fetchAisMovementsDeepSync() {
  const URL = "https://portosdosacores.pt/movimento-portuario/";
  // Testamos os portos principais e preenchemos
  const ports = ["PTPDL", "PTHOR", "PTPRV"];
  const allResults: any[] = [];

  for (const port of ports) {
    try {
      const body = new URLSearchParams({
        pdcsearchportos: port,
        npsearchportos: port,
        pdpsearchportos: port,
        crsearchportos: port,
        htsearchportos: port,
        typeform: "frmnaviosemporto",
      });
      const response = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      });
      if (!response.ok) continue;
      const html = await response.text();
      // Extrai IMOs e Nomes de forma bruta de todas as tabelas
      const rowMatches = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
      rowMatches.forEach(row => {
        const cells = Array.from(row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(c => c[1].replace(/<[^>]+>/g, "").trim());
        if (cells.length >= 5) {
          allResults.push({
            imo: cells[2],
            name: cells[3],
            type: cells[4]
          });
        }
      });
    } catch {}
  }
  return allResults;
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access || !access.isAdmin) {
      return NextResponse.json({ error: "Apenas administradores podem iniciar sincronização em massa." }, { status: 403 });
    }

    // 1. Sincronização profunda com PortosAcores (Nomes e IMOs)
    let portsUpdated = 0;
    const portMovements = await fetchAisMovementsDeepSync();
    
    // Busca TODOS os navios locais para cross-check
    const localNavios = await prisma.navio.findMany({ select: { id: true, nome: true, imo: true, tipoNavio: true } });

    for (const mov of portMovements) {
      const movName = normalizeText(mov.name);
      if (!movName || movName.length < 3) continue;

      const match = localNavios.find(n => normalizeText(n.nome) === movName);
      if (match) {
        const needsImo = !String(match.imo || "").trim() && String(mov.imo || "").trim().length >= 7;
        const needsType = !String(match.tipoNavio || "").trim() && String(mov.type || "").trim();

        if (needsImo || needsType) {
          await (prisma.navio as any).update({
            where: { id: match.id },
            data: {
              imo: needsImo ? mov.imo : match.imo,
              tipoNavio: needsType ? mov.type : (match as any).tipoNavio
            }
          }).catch(() => null);
          portsUpdated++;
        }
      }
    }

    // 2. Sincronização com VesselFinder para o que sobrou sem identificadores
    const candidates = await prisma.navio.findMany({
      where: {
        ativo: true,
        OR: [
          { mmsi: null }, { mmsi: "" },
          { imo: null }, { imo: "" }
        ]
      },
      select: { id: true, nome: true, mmsi: true, imo: true },
    });

    let updatedVfCount = 0;
    const subset = candidates.slice(0, 15);

    for (const navio of subset) {
      const result = await searchVesselFinder(navio.nome);
      if (result && (result.imo || result.mmsi)) {
        await (prisma.navio as any).update({
          where: { id: navio.id },
          data: {
            mmsi: navio.mmsi || result.mmsi,
            imo: navio.imo || result.imo,
          }
        }).catch(() => null);
        updatedVfCount++;
      }
      await delay(1200);
    }

    // 3. Correção de Inconsistências Porta <-> Ilha
    const PORTO_TO_ILHA: Record<string, string> = {
      'Ponta Delgada': 'São Miguel',
      'Vila Franca do Campo': 'São Miguel',
      'Ribeira Grande': 'São Miguel',
      'Vila do Porto': 'Santa Maria',
      'Angra do Heroísmo': 'Terceira',
      'Praia da Vitória': 'Terceira',
      'Santa Cruz da Graciosa': 'Graciosa',
      'Velas': 'São Jorge',
      'Calheta': 'São Jorge',
      'Madalena': 'Pico',
      'São Roque do Pico': 'Pico',
      'Lajes do Pico': 'Pico',
      'Horta': 'Faial',
      'Santa Cruz das Flores': 'Flores',
      'Lajes das Flores': 'Flores',
      'Corvo': 'Corvo',
      'Vila do Corvo': 'Corvo'
    };

    let geographicCorrections = 0;
    const allNavios = await prisma.navio.findMany({ select: { id: true, portoRegisto: true, ilha: true } });
    for (const n of allNavios) {
      const correctIlha = PORTO_TO_ILHA[n.portoRegisto || ""];
      if (correctIlha && n.ilha !== correctIlha) {
        await (prisma.navio as any).update({
          where: { id: n.id },
          data: { ilha: correctIlha }
        }).catch(() => null);
        geographicCorrections++;
      }
    }

    return NextResponse.json({
      success: true,
      portSyncCount: portsUpdated,
      vesselFinderCount: updatedVfCount,
      geographicCorrections,
      totalChecked: subset.length,
      remainingCandidates: Math.max(0, candidates.length - subset.length)
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
