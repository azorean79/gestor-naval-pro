import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { fmtPeso } from "@/lib/liferaft-diagram-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const navioId = parseInt(idStr, 10);
    if (isNaN(navioId)) {
      return NextResponse.json({ error: "ID de navio inválido." }, { status: 400 });
    }

    const navio = await prisma.navio.findUnique({
      where: { id: navioId },
    });

    if (!navio) {
      return NextResponse.json({ error: "Navio não encontrado." }, { status: 404 });
    }

    // Fetch all rafts associated with this navio
    const rafts = await prisma.jangada.findMany({
      where: { shipId: navioId },
      include: {
        artigos: {
          where: { inspecaoId: null },
        },
      },
    });

    // 1. Create Consolidated Excel
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Fleet Summary
    const summarySheet = workbook.addWorksheet("Resumo da Frota");
    summarySheet.columns = [
      { header: "Nº Série", key: "serial", width: 15 },
      { header: "Marca", key: "brand", width: 15 },
      { header: "Modelo", key: "model", width: 15 },
      { header: "Lotação", key: "capacity", width: 12 },
      { header: "Pack", key: "packType", width: 12 },
      { header: "Última Inspeção", key: "lastInsp", width: 18 },
      { header: "Próxima Inspeção", key: "nextInsp", width: 18 },
      { header: "Último Certificado", key: "cert", width: 20 },
      { header: "Cilindro Série", key: "cylinder", width: 15 },
      { header: "Validade HRU", key: "hru", width: 15 },
    ];
    
    // Style Header
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" }, // Slate-800
    };

    rafts.forEach((r) => {
      summarySheet.addRow({
        serial: r.serial,
        brand: r.brand || "—",
        model: r.model || "—",
        capacity: r.capacity ? `${r.capacity}P` : "—",
        packType: r.packType || "—",
        lastInsp: r.dataInspecao || "—",
        nextInsp: r.dataProxInspecao || "—",
        cert: r.ultimoCertificadoNumero || "—",
        cylinder: r.cylinderSerial || "—",
        hru: r.hruValidade || "—",
      });
    });

    // Sheet 2: Detailed Expirations
    const expSheet = workbook.addWorksheet("Artigos a Expirar");
    expSheet.columns = [
      { header: "Nº Série Jangada", key: "raftSerial", width: 20 },
      { header: "Equipamento", key: "raftInfo", width: 25 },
      { header: "Nome do Artigo", key: "articleName", width: 30 },
      { header: "Referência", key: "ref", width: 15 },
      { header: "Quantidade", key: "qty", width: 12 },
      { header: "Validade", key: "validity", width: 15 },
      { header: "Dias Restantes", key: "daysLeft", width: 15 },
    ];
    
    expSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    expSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4F46E5" }, // Indigo-600
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    type RaftArticle = {
      raftSerial: string;
      raftInfo: string;
      articleName: string;
      ref: string;
      qty: number;
      validity: Date | null;
    };
    const allArticles: RaftArticle[] = [];
    rafts.forEach((r) => {
      r.artigos.forEach((a) => {
        allArticles.push({
          raftSerial: r.serial,
          raftInfo: `${r.brand || ""} ${r.model || ""} (${r.capacity}P)`.trim(),
          articleName: a.name,
          ref: a.referencia || "—",
          qty: a.quantidade,
          validity: a.validade,
        });
      });
    });

    // Sort by validity date
    allArticles.sort((a, b) => {
      if (!a.validity) return 1;
      if (!b.validity) return -1;
      return new Date(a.validity).getTime() - new Date(b.validity).getTime();
    });

    allArticles.forEach((art) => {
      let formattedVal = "—";
      let diffDays: string | number = "—";
      
      if (art.validity) {
        const valDate = new Date(art.validity);
        formattedVal = `${String(valDate.getDate()).padStart(2, "0")}/${String(valDate.getMonth() + 1).padStart(2, "0")}/${valDate.getFullYear()}`;
        const diffTime = valDate.getTime() - today.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) diffDays = "Expirado";
      }

      expSheet.addRow({
        raftSerial: art.raftSerial,
        raftInfo: art.raftInfo,
        articleName: art.articleName,
        ref: art.ref,
        qty: art.qty,
        validity: formattedVal,
        daysLeft: diffDays,
      });
    });

    // Style both sheets cell borders
    [summarySheet, expSheet].forEach((ws) => {
      ws.eachRow((row, rowNum) => {
        if (rowNum > 1) {
          if (rowNum % 2 === 0) {
            row.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8FAFC" },
            };
          }
        }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "E2E8F0" } },
            left: { style: "thin", color: { argb: "E2E8F0" } },
            bottom: { style: "thin", color: { argb: "E2E8F0" } },
            right: { style: "thin", color: { argb: "E2E8F0" } },
          };
        });
      });
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    // 2. Initialize JSZip
    const zip = new JSZip();
    
    // Add Excel Report
    const cleanNavioName = navio.nome.replace(/[^a-zA-Z0-9_-]/g, "_");
    zip.file(`Resumo_Seguranca_${cleanNavioName}.xlsx`, excelBuffer);

    // Add individual text dossier summaries for each liferaft
    rafts.forEach((r) => {
      let fileContent = `======================================================\n`;
      fileContent += `DOSSIER TÉCNICO INDIVIDUAL - JANGADA SALVA-VIDAS\n`;
      fileContent += `======================================================\n\n`;
      fileContent += `EQUIPAMENTO:\n`;
      fileContent += `- Nº Série: ${r.serial}\n`;
      fileContent += `- Fabricante/Marca: ${r.brand || "N/D"}\n`;
      fileContent += `- Modelo: ${r.model || "N/D"}\n`;
      fileContent += `- Lotação: ${r.capacity ? `${r.capacity} Pessoas` : "N/D"}\n`;
      fileContent += `- Tipo de Pack: ${r.packType || "N/D"}\n`;
      fileContent += `- Data Fabrico: ${r.dataFabrico || "N/D"}\n\n`;
      
      fileContent += `VISTORIA ATIVA:\n`;
      fileContent += `- Última Inspeção: ${r.dataInspecao || "N/D"}\n`;
      fileContent += `- Próxima Inspeção: ${r.dataProxInspecao || "N/D"}\n`;
      fileContent += `- Nº Certificado Ativo: ${r.ultimoCertificadoNumero || "N/D"}\n\n`;

      fileContent += `ELEMENTOS DE DISPARO & CILINDRO:\n`;
      fileContent += `- Série Cilindro: ${r.cylinderSerial || "N/D"}\n`;
      fileContent += `- Tara: ${fmtPeso(r.cylinderTara, " kg")}\n`;
      fileContent += `- Peso Bruto: ${fmtPeso(r.cylinderPesoBruto, " kg")}\n`;
      fileContent += `- Carga CO2/N2: ${fmtPeso(r.cylinderCo2, " kg")}/${fmtPeso(r.cylinderN2, " kg")}\n`;
      fileContent += `- Teste Hidráulico: ${r.cylinderDataTeste || "N/D"} (Próximo: ${r.cylinderDataProxTeste || "N/D"})\n`;
      fileContent += `- Referência HRU: ${r.hruReferencia || "N/D"}\n`;
      fileContent += `- Instalação HRU: ${r.hruDataInstalacao || "N/D"}\n`;
      fileContent += `- Validade HRU: ${r.hruValidade || "N/D"}\n\n`;

      fileContent += `ARTIGOS DO PACK ACTIVOS:\n`;
      if (r.artigos.length === 0) {
        fileContent += `  Nenhum artigo registado.\n`;
      } else {
        r.artigos.forEach((art) => {
          const valStr = art.validade ? new Date(art.validade).toLocaleDateString("pt-PT") : "N/D";
          fileContent += `  [x] ${art.name} (Ref: ${art.referencia || "—"}) - Qtd: ${art.quantidade} - Validade: ${valStr}\n`;
        });
      }

      zip.file(`Jangada_${r.serial}_Resumo.txt`, fileContent);
    });

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="Safety_Pack_${cleanNavioName}.zip"`,
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    console.error("Error generating vessel safety pack:", error);
    return NextResponse.json({ error: "Erro interno ao gerar o ZIP de segurança." }, { status: 500 });
  }
}
