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
          select: { serial: true, brand: true, model: true, owner: true, shipNameManual: true },
        },
        cliente: {
          select: { nome: true, numeroCliente: true, nif: true, morada: true, localidade: true, ilha: true },
        },
        serviceStation: { select: { codigo: true, nome: true } },
        tecnico: { select: { nome: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Ordem de serviço não encontrada." }, { status: 404 });
    }

    if (order.status !== "concluida") {
      return NextResponse.json(
        { error: "O recibo só pode ser gerado para ordens de serviço concluídas." },
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
    const foiPago = pagamentoStatus === "Pago" || pagamentoStatus === "Pago Parcialmente";

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Recibo");

    worksheet.columns = [
      { header: "", key: "a", width: 34 },
      { header: "", key: "b", width: 56 },
      { header: "", key: "c", width: 12 },
      { header: "", key: "d", width: 16 },
    ];

    // Título
    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "RECIBO";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F766E" } };
    worksheet.getRow(1).height = 30;
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    let rowIndex = 2;
    const issuerRows: Array<[string, string]> = [
      ["Fornecedor", issuer],
      ["Cliente", clienteNome],
    ];
    if (cliente?.nif) issuerRows.push(["NIF Cliente", cliente.nif]);
    if (cliente?.morada) issuerRows.push(["Morada", cliente.morada]);
    if (cliente?.localidade || cliente?.ilha) issuerRows.push(["Localidade / Ilha", `${cliente.localidade || ""} ${cliente.ilha || ""}`.trim()]);
    issuerRows.push(["Recibo Nº", `REC-${order.numeroOrdem || order.id}`]);
    issuerRows.push(["Data de emissão", formatDate(emissao)]);
    issuerRows.push(["Fatura / Ordem", order.numeroOrdem || `FAT-${order.id}`]);
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

    // Corpo do recibo
    rowIndex += 1;
    const reciboRows: Array<[string, string]> = [
      ["Montante recebido (em numerário, cheque ou transferência)", formatEuro(total)],
      ["Respeitante à fatura", `Fatura Nº ${order.numeroOrdem || order.id} de ${formatDate(order.dataConclusao || order.dataAbertura || order.createdAt)}`],
      ["Descrição dos serviços", `${maoObra > 0 ? "Mão-de-obra (trabalhos executados)" : ""}${maoObra > 0 && pecas > 0 ? "; " : ""}${pecas > 0 ? "Peças / materiais aplicados" : ""}`.trim() || "Serviços prestados"],
    ];
    reciboRows.forEach(([label, value]) => {
      worksheet.getCell(`A${rowIndex}`).value = label;
      worksheet.getCell(`A${rowIndex}`).font = { bold: true };
      worksheet.getCell(`B${rowIndex}`).value = value;
      rowIndex += 1;
    });

    // Linha do montante em destaque
    rowIndex += 1;
    worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = "TOTAL RECEBIDO";
    worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 13 };
    worksheet.getCell(`D${rowIndex}`).value = formatEuro(total);
    worksheet.getCell(`D${rowIndex}`).font = { bold: true, size: 13 };
    worksheet.getCell(`A${rowIndex}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "CCFBF1" } };
    worksheet.getCell(`D${rowIndex}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "CCFBF1" } };
    rowIndex += 1;

    if (!foiPago) {
      rowIndex += 1;
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      worksheet.getCell(`A${rowIndex}`).value = `NOTA: Este recibo documenta o montante da fatura ${order.numeroOrdem || order.id}. O pagamento encontra-se "${pagamentoStatus}". O recibo definitivo será emitido após liquidação.`;
      worksheet.getCell(`A${rowIndex}`).font = { italic: true, color: { argb: "B45309" } };
    }

    // Assinaturas
    rowIndex += 2;
    worksheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    worksheet.getCell(`A${rowIndex}`).value = "O Recibos (Orey Técnica)";
    rowIndex += 1;
    worksheet.getCell(`A${rowIndex}`).value = "____________________________________";
    rowIndex += 2;
    worksheet.mergeCells(`C${rowIndex}:D${rowIndex}`);
    worksheet.getCell(`C${rowIndex}`).value = "O Cliente";
    rowIndex += 1;
    worksheet.getCell(`C${rowIndex}`).value = "____________________________________";

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "E5E7EB" } },
          left: { style: "thin", color: { argb: "E5E7EB" } },
          bottom: { style: "thin", color: { argb: "E5E7EB" } },
          right: { style: "thin", color: { argb: "E5E7EB" } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=recibo-${order.numeroOrdem}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao gerar recibo Excel:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar o recibo Excel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
