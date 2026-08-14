import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getAccessContext } from "@/lib/access-control";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get("periodo") || "90"; // periodo em dias
    
    let dateLimit: Date | null = null;
    if (daysParam !== "all") {
      const days = parseInt(daysParam, 10);
      if (!isNaN(days)) {
        dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() + days);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar artigos da base de dados
    const queryWhere: Prisma.ArtigoJangadaWhereInput = {
      validade: {
        not: null,
      },
    };

    if (dateLimit) {
      queryWhere.validade = {
        gte: today,
        lte: dateLimit,
      };
    } else {
      // Se for "all", buscar todos os que expiram a partir de hoje
      queryWhere.validade = {
        gte: today,
      };
    }

    const artigos = await prisma.artigoJangada.findMany({
      where: queryWhere,
      include: {
        Jangada: {
          select: {
            serial: true,
            brand: true,
            model: true,
            capacity: true,
            shipNameManual: true,
            owner: true,
          },
        },
        inspecao: {
          select: {
            certificadoNumero: true,
            dataInspecao: true,
          },
        },
      },
      orderBy: {
        validade: "asc",
      },
    });

    // Se o formato pedido for JSON, retornar os dados diretamente
    const formatParam = searchParams.get("format");
    if (formatParam === "json") {
      const data = artigos.map((art) => {
        const validadeDate = new Date(art.validade!);
        const diffTime = validadeDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          id: art.id,
          nome: art.name,
          serial: art.Jangada.serial,
          marca: art.Jangada.brand || "—",
          modelo: art.Jangada.model || "—",
          capacidade: art.Jangada.capacity ? `${art.Jangada.capacity}P` : "—",
          navio: art.Jangada.shipNameManual || "—",
          armador: art.Jangada.owner || "—",
          certificado: art.inspecao?.certificadoNumero || "—",
          validade: art.validade,
          quantidade: art.quantidade,
          dias: diffDays >= 0 ? diffDays : -1, // -1 para expirados
        };
      });
      return NextResponse.json(data);
    }

    // Criar workbook Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Validades");

    // Cabeçalho da tabela
    worksheet.columns = [
      { header: "Nome do Artigo", key: "nome", width: 30 },
      { header: "Nº Série Jangada", key: "serial", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Modelo", key: "modelo", width: 15 },
      { header: "Lotação (P)", key: "capacidade", width: 12 },
      { header: "Embarcação", key: "navio", width: 25 },
      { header: "Armador / Cliente", key: "armador", width: 25 },
      { header: "Nº Certificado", key: "certificado", width: 15 },
      { header: "Validade", key: "validade", width: 15 },
      { header: "Quantidade", key: "quantidade", width: 12 },
      { header: "Dias Restantes", key: "dias", width: 15 },
    ];

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }, // Indigo primary color
    };

    // Preencher dados
    artigos.forEach((art) => {
      const validadeDate = new Date(art.validade!);
      const diffTime = validadeDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedValidade = `${String(validadeDate.getDate()).padStart(2, '0')}/${String(validadeDate.getMonth() + 1).padStart(2, '0')}/${validadeDate.getFullYear()}`;

      worksheet.addRow({
        nome: art.name,
        serial: art.Jangada.serial,
        marca: art.Jangada.brand || "—",
        modelo: art.Jangada.model || "—",
        capacidade: art.Jangada.capacity ? `${art.Jangada.capacity}P` : "—",
        navio: art.Jangada.shipNameManual || "—",
        armador: art.Jangada.owner || "—",
        certificado: art.inspecao?.certificadoNumero || "—",
        validade: formattedValidade,
        quantidade: art.quantidade,
        dias: diffDays >= 0 ? diffDays : "Expirado",
      });
    });

    // Alinhamentos e bordas simples
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Alternar cor de fundo nas linhas
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F9FAFB" },
          };
        }
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E5E7EB" } },
          left: { style: "thin", color: { argb: "E5E7EB" } },
          bottom: { style: "thin", color: { argb: "E5E7EB" } },
          right: { style: "thin", color: { argb: "E5E7EB" } },
        };
      });
    });

    // Gerar buffer e retornar
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=relatorio-validades-${daysParam}d.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Erro ao gerar relatório de validades:", error);
    return NextResponse.json(
      { error: "Erro ao gerar o relatório Excel." },
      { status: 500 }
    );
  }
}
