import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getAccessContext } from "@/lib/access-control";
import { getIvaRate } from "@/lib/iva";

const ISSUER_NAME = "Orey Técnica - Serviços Navais";

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const order = await prisma.ordemServico.findUnique({
      where: { id },
      include: {
        jangada: {
          select: {
            serial: true,
            brand: true,
            model: true,
            owner: true,
            shipNameManual: true,
          },
        },
        cliente: {
          select: {
            nome: true,
            numeroCliente: true,
            nif: true,
            morada: true,
            localidade: true,
            ilha: true,
          },
        },
        serviceStation: {
          select: { codigo: true, nome: true },
        },
        tecnico: {
          select: { nome: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });
    }

    if (order.status !== "concluida") {
      return NextResponse.json(
        { error: "A nota de crédito só pode ser emitida para faturas de ordens de serviço concluídas." },
        { status: 400 },
      );
    }

    const pecas = Number(order.valorPecas || 0);
    const maoObra = Number(order.valorMaoObra || 0);
    const desconto = Number(order.valorDesconto || 0);
    const isentoIva = Boolean(order.isIsentoIva);
    const subtotal = pecas + maoObra - desconto;
    const iva = isentoIva ? 0 : subtotal * getIvaRate();
    const total = subtotal + iva;

    const jangada = order.jangada || null;
    const cliente = order.cliente || null;
    const clienteNome = cliente?.nome || jangada?.owner || "Cliente particular";
    const navio = jangada?.shipNameManual || "—";
    const issuer = order.serviceStation?.nome || ISSUER_NAME;
    const emissao = new Date();
    const numeroFatura = order.numeroOrdem || `FAT-${order.id}`;
    const numeroNotaCredito = `NC-${numeroFatura}`;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Nota de Crédito");

    worksheet.columns = [
      { header: "", key: "a", width: 34 },
      { header: "", key: "b", width: 56 },
      { header: "", key: "c", width: 12 },
      { header: "", key: "d", width: 16 },
    ];

    // Título
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "NOTA DE CRÉDITO";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "B91C1C" },
    };
    worksheet.getRow(1).height = 30;
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    // Cabeçalho emissor + dados do documento
    let rowIndex = 2;
    const issuerRows: Array<[string, string]> = [
      ["Fornecedor", issuer],
      ["Cliente", clienteNome],
    ];
    if (cliente?.nif) issuerRows.push(["NIF Cliente", cliente.nif]);
    if (cliente?.morada) issuerRows.push(["Morada", cliente.morada]);
    if (cliente?.localidade || cliente?.ilha) issuerRows.push(["Localidade / Ilha", `${cliente.localidade || ""} ${cliente.ilha || ""}`.trim()]);
    issuerRows.push(["Nota de Crédito Nº", numeroNotaCredito]);
    issuerRows.push(["Fatura de Referência Nº", numeroFatura]);
    issuerRows.push(["Data de emissão", formatDate(emissao)]);
    issuerRows.push(["Data de trabalho", formatDate(order.dataConclusao || order.dataAbertura || order.createdAt)]);
    issuerRows.push(["Embarcação", navio]);
    issuerRows.push(["Jangada", `${jangada?.brand || ""} ${jangada?.model || ""}`.trim() || "—"]);
    if (jangada?.serial) issuerRows.push(["Nº Série Jangada", jangada.serial]);
    if (order.tecnico?.nome) issuerRows.push(["Técnico responsável", order.tecnico.nome]);
    issuerRows.push(["Motivo", "Anulação / correção da fatura de referência"]);

    issuerRows.forEach(([label, value]) => {
      worksheet.getCell(`A${rowIndex}`).value = label;
      worksheet.getCell(`A${rowIndex}`).font = { bold: true };
      worksheet.getCell(`B${rowIndex}`).value = value;
      rowIndex += 1;
    });

    // Tabela de linhas (valores a crédito do cliente)
    rowIndex += 1;
    worksheet.getCell(`A${rowIndex}`).value = "Referência";
    worksheet.getCell(`B${rowIndex}`).value = "Descrição";
    worksheet.getCell(`C${rowIndex}`).value = "Qtd";
    worksheet.getCell(`D${rowIndex}`).value = "Valor";
    worksheet.getRow(rowIndex).font = { bold: true };
    worksheet.getRow(rowIndex).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FEE2E2" },
    };
    const headerRow = rowIndex;
    rowIndex += 1;

    const lineRows: Array<string[]> = [
      ["MDO", "Mão-de-obra (trabalhos executados)", "1", `-${formatEuro(maoObra)}`],
      ["MAT", "Peças / materiais", "1", `-${formatEuro(pecas)}`],
    ];
    if (desconto > 0) {
      lineRows.push(["DESC", "Desconto (reposto)", "1", formatEuro(desconto)]);
    }

    lineRows.forEach((row) => {
      row.forEach((value, colIndex) => {
        worksheet.getCell(`${String.fromCharCode(65 + colIndex)}${rowIndex}`).value = value;
      });
      rowIndex += 1;
    });

    // Totais (valores negativos — crédito a favor do cliente)
    const totalRows: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: "Subtotal", value: `-${formatEuro(subtotal)}` },
      { label: "IVA", value: isentoIva ? "Isento" : `-${formatEuro(iva)}` },
      { label: "TOTAL (crédito)", value: `-${formatEuro(total)}`, bold: true },
    ];
    totalRows.forEach((entry) => {
      worksheet.getCell(`A${rowIndex}`).value = "";
      worksheet.getCell(`B${rowIndex}`).value = entry.label;
      worksheet.getCell(`D${rowIndex}`).value = entry.value;
      if (entry.bold) {
        worksheet.getCell(`B${rowIndex}`).font = { bold: true };
        worksheet.getCell(`D${rowIndex}`).font = { bold: true };
        worksheet.getCell(`B${rowIndex}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FEE2E2" },
        };
        worksheet.getCell(`D${rowIndex}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FEE2E2" },
        };
      }
      rowIndex += 1;
    });

    rowIndex += 1;
    worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value =
      "Documento de compensação que anula, total ou parcialmente, a fatura de referência. Sem pagamento em duplicado.";
    worksheet.getCell(`A${rowIndex}`).font = { italic: true, color: { argb: "6B7280" } };
    worksheet.getCell(`A${rowIndex}`).alignment = { wrapText: true, vertical: "top" };
    worksheet.getRow(rowIndex).height = 28;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === headerRow) return;
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "E5E7EB" } },
            left: { style: "thin", color: { argb: "E5E7EB" } },
            bottom: { style: "thin", color: { argb: "E5E7EB" } },
            right: { style: "thin", color: { argb: "E5E7EB" } },
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=nota-credito-${numeroNotaCredito}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao gerar nota de crédito Excel:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar a nota de crédito.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
