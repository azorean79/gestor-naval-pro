import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const body = rows.map((row) => headers.map((h) => escape(row[h])).join(",")).join("\n");
  return `${headers.join(",")}\n${body}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = (searchParams.get("tipo") || "").toLowerCase();

    let filename = "relatorio.csv";
    let rows: Record<string, unknown>[] = [];

    if (tipo === "clientes") {
      const clientes = await prisma.cliente.findMany({
        include: { navios: { select: { id: true } } },
        orderBy: { nome: "asc" },
      });

      filename = "clientes.csv";
      rows = clientes.map((c) => ({
        id: c.id,
        nome: c.nome,
        numeroCliente: c.numeroCliente || "",
        nif: c.nif || "",
        email: c.email || "",
        telefone: c.telefone || "",
        telmovel: c.telmovel || "",
        ilha: c.ilha || "",
        totalNavios: c.navios.length,
      }));
    } else if (tipo === "navios") {
      const navios = await prisma.navio.findMany({
        include: { cliente: { select: { nome: true } } },
        orderBy: { nome: "asc" },
      });

      filename = "navios.csv";
      rows = navios.map((n) => ({
        id: n.id,
        nome: n.nome,
        matricula: n.matricula,
        ilha: n.ilha,
        tipoPesca: n.tipoPesca,
        portoRegisto: n.portoRegisto || "",
        mmsi: n.mmsi || "",
        imo: n.imo || "",
        callSignal: n.callSignal || "",
        cliente: n.cliente?.nome || "",
      }));
    } else if (tipo === "jangadas") {
      const jangadas = await prisma.jangada.findMany({
        include: { certificadoAtivo: true },
        orderBy: { serial: "asc" },
      });

      filename = "jangadas.csv";
      rows = jangadas.map((j) => ({
        id: j.id,
        serial: j.serial,
        brand: j.brand,
        model: j.model,
        capacity: j.capacity,
        owner: j.owner,
        shipId: j.shipId || "",
        shipNameManual: j.shipNameManual || "",
        dataInspecao: j.dataInspecao || "",
        dataProxInspecao: j.dataProxInspecao || "",
        certificadoAtivo: j.certificadoAtivo?.certificadoNumero || "",
      }));
    } else {
      return NextResponse.json(
        { error: "Tipo inválido. Use: clientes, navios ou jangadas." },
        { status: 400 }
      );
    }

    const csv = toCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
