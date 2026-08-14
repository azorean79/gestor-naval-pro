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
        { error: "A fatura só pode ser gerada para ordens de serviço concluídas." },
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

    const orderMeta = typeof order.metadados === "object" && order.metadados ? order.metadados as Record<string, unknown> : {};
    const pagamentoStatus = String(orderMeta.pagamentoStatus || "Pendente");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fatura");

    worksheet.columns = [
      { header: "", key: "a", width: 34 },
      { header: "", key: "b", width: 56 },
      { header: "", key: "c", width: 12 },
      { header: "", key: "d", width: 16 },
    ];

    // Título
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "FATURA";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F766E" },
    };
    worksheet.getRow(1).height = 30;
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    // Cabeçalho emissor + dados da fatura
    let rowIndex = 2;
    const issuerRows: Array<[string, string]> = [
      ["Fornecedor", issuer],
      ["Cliente", clienteNome],
    ];
    if (cliente?.nif) issuerRows.push(["NIF Cliente", cliente.nif]);
    if (cliente?.morada) issuerRows.push(["Morada", cliente.morada]);
    if (cliente?.localidade || cliente?.ilha) issuerRows.push(["Localidade / Ilha", `${cliente.localidade || ""} ${cliente.ilha || ""}`.trim()]);
    issuerRows.push(["Fatura Nº", order.numeroOrdem || `FAT-${order.id}`]);
    issuerRows.push(["Data de emissão", formatDate(emissao)]);
    issuerRows.push(["Data de trabalho", formatDate(order.dataConclusao || order.dataAbertura || order.createdAt)]);
    issuerRows.push(["Embarcação", navio]);
    issuerRows.push(["Jangada", `${jangada?.brand || ""} ${jangada?.model || ""}`.trim() || "—"]);
    if (jangada?.serial) issuerRows.push(["Nº Série Jangada", jangada.serial]);
    if (order.tecnico?.nome) issuerRows.push(["Técnico responsável", order.tecnico.nome]);
    issuerRows.push(["Estado de Pagamento", pagamentoStatus]);

    issuerRows.forEach(([label, value]) => {
      worksheet.getCell(`A${rowIndex}`).value = label;
      worksheet.getCell(`A${rowIndex}`).font = { bold: true };
      worksheet.getCell(`B${rowIndex}`).value = value;
      rowIndex += 1;
    });

    // Tabela de linhas
    rowIndex += 1;
    worksheet.getCell(`A${rowIndex}`).value = "Referência";
    worksheet.getCell(`B${rowIndex}`).value = "Descrição";
    worksheet.getCell(`C${rowIndex}`).value = "Qtd";
    worksheet.getCell(`D${rowIndex}`).value = "Valor";
    worksheet.getRow(rowIndex).font = { bold: true };
    worksheet.getRow(rowIndex).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "CCFBF1" },
    };
    const headerRow = rowIndex;
    rowIndex += 1;

    const lineRows: Array<string[]> = [
      ["MDO", "Mão-de-obra (trabalhos executados)", "1", formatEuro(maoObra)],
      ["MAT", "Peças / materiais", "1", formatEuro(pecas)],
    ];
    if (desconto > 0) {
      lineRows.push(["DESC", "Desconto", "1", `-${formatEuro(desconto)}`]);
    }

    lineRows.forEach((row) => {
      row.forEach((value, colIndex) => {
        worksheet.getCell(`${String.fromCharCode(65 + colIndex)}${rowIndex}`).value = value;
      });
      rowIndex += 1;
    });

    // Totais
    const totalRows: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: "Subtotal", value: formatEuro(subtotal) },
      { label: "IVA", value: isentoIva ? "Isento" : `16%  ${formatEuro(iva)}` },
      { label: "TOTAL", value: formatEuro(total), bold: true },
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
          fgColor: { argb: "CCFBF1" },
        };
        worksheet.getCell(`D${rowIndex}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "CCFBF1" },
        };
      }
      rowIndex += 1;
    });

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
        "Content-Disposition": `attachment; filename=fatura-${order.numeroOrdem}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao gerar fatura Excel:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar a fatura Excel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}