import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getAccessContext } from "@/lib/access-control";

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function formatDate(val: Date | null | undefined) {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { id: rawId } = await params;
    const clienteId = Number(rawId);
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      return NextResponse.json({ error: "ID de cliente inválido." }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        ordensServico: {
          orderBy: { createdAt: "desc" },
          include: {
            jangada: { select: { serial: true, brand: true, model: true, shipNameManual: true } },
          },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Extrato Conta-Corrente");

    worksheet.columns = [
      { header: "", key: "a", width: 16 },
      { header: "", key: "b", width: 20 },
      { header: "", key: "c", width: 35 },
      { header: "", key: "d", width: 16 },
      { header: "", key: "e", width: 16 },
    ];

    worksheet.mergeCells("A1:E1");
    worksheet.getCell("A1").value = `EXTRATO DE CONTA-CORRENTE — ${cliente.nome.toUpperCase()}`;
    worksheet.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFF" } };
    worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "0F766E" } };
    worksheet.getRow(1).height = 28;
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    worksheet.addRow([]);
    worksheet.addRow(["NIF:", cliente.nif || "—", "", "Código Cliente:", cliente.numeroCliente || "—"]);
    worksheet.addRow(["Morada:", cliente.morada || "—", "", "Ilha:", cliente.ilha || "—"]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(["Data", "Documento", "Embarcação / Descrição", "Estado", "Valor (€)"]);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "334155" } };
    });

    let totalGeral = 0;
    let totalPendente = 0;

    cliente.ordensServico.forEach((os) => {
      const val = Number(os.valorTotal || 0);
      const isConcluida = os.status === "concluida";
      if (isConcluida) {
        totalGeral += val;
        const statusPagamento = (os.metadados as any)?.pagamentoStatus || (os.orcamentoStatus === "Aprovado" ? "Pendente" : "Rascunho");
        if (statusPagamento !== "Pago") {
          totalPendente += val;
        }
      }

      worksheet.addRow([
        formatDate(os.dataConclusao || os.createdAt),
        `Fatura #${os.numeroOrdem || os.id}`,
        `${os.jangada?.brand || ""} ${os.jangada?.model || ""} (${os.jangada?.shipNameManual || "Sem navio"})`,
        os.status,
        formatEuro(val),
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(["", "", "", "Total Faturado:", formatEuro(totalGeral)]);
    worksheet.addRow(["", "", "", "Total em Dívida:", formatEuro(totalPendente)]);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Extrato_Cliente_${cliente.numeroCliente || clienteId}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/clientes/[id]/extrato-excel]", error);
    return NextResponse.json({ error: "Erro ao gerar extrato Excel." }, { status: 500 });
  }
}
