import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const DEFAULT_OPTIONS = [
  { marca: "Viking", modelo: "PS4170", fabricante: "Viking", origem: "catalogo" },
  { marca: "Viking", modelo: "PS5002", fabricante: "Viking", origem: "catalogo" },
  { marca: "Viking", modelo: "PS5008", fabricante: "Viking", origem: "catalogo" },
  { marca: "Viking", modelo: "PS4029", fabricante: "Viking", origem: "catalogo" },
  { marca: "Survitec", modelo: "Crewsaver 8800", fabricante: "Survitec", origem: "catalogo" },
  { marca: "Survitec", modelo: "Crewsaver 8800Mk2 Endurance Plus", fabricante: "Survitec", origem: "catalogo" },
  { marca: "Survitec", modelo: "Crewsaver 8808 Endurance 140", fabricante: "Survitec", origem: "catalogo" },
  { marca: "Lalizas", modelo: "Neptune Immersion Suit", fabricante: "Lalizas", origem: "catalogo" },
  { marca: "Lalizas", modelo: "Immersion Suit", fabricante: "Lalizas", origem: "catalogo" },
  { marca: "Ocean Safety", modelo: "Solas Immersion Suit", fabricante: "Ocean Safety", origem: "catalogo" },
];

export async function GET() {
  try {
    const fromCatalog = await prisma.catalogMarcaModelo.findMany({
      where: { tipo: "FATO_IMERSAO" },
      select: { marca: true, modelo: true, origem: true },
      orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    });

    const fromDb = await prisma.fatoImersao.findMany({
      where: {
        AND: [{ marca: { not: null } }, { modelo: { not: null } }],
      },
      select: { marca: true, modelo: true },
      distinct: ["marca", "modelo"],
    });

    const map = new Map<string, { marca: string; modelo: string; origem?: string | null; source: string }>();

    for (const row of DEFAULT_OPTIONS) {
      const key = `${row.marca}::${row.modelo}`.toLowerCase();
      map.set(key, { ...row, source: "catalogo" });
    }
    for (const row of fromCatalog) {
      const key = `${row.marca}::${row.modelo}`.toLowerCase();
      map.set(key, { marca: row.marca, modelo: row.modelo, origem: row.origem, source: "catalogo" });
    }
    for (const row of fromDb) {
      if (!row.marca || !row.modelo) continue;
      const key = `${row.marca}::${row.modelo}`.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { marca: row.marca, modelo: row.modelo, source: "baseDados" });
      }
    }

    return NextResponse.json(Array.from(map.values()));
  } catch (error) {
    console.error("catalog-options fatos-imersao:", error);
    return NextResponse.json(DEFAULT_OPTIONS);
  }
}
