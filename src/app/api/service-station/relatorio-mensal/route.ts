import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";
import { getAccessContext } from "@/lib/access-control";
import { resolveActiveServiceStationId } from "@/lib/station-selection";

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const activeStationId = resolveActiveServiceStationId(req, access);

    const yearRaw = Number(searchParams.get("year"));
    const monthRaw = Number(searchParams.get("month"));
    const now = new Date();
    const year = Number.isFinite(yearRaw) && yearRaw > 2000 ? yearRaw : now.getFullYear();
    const month = Number.isFinite(monthRaw) && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : now.getMonth() + 1;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const stationWhere = activeStationId
      ? { serviceStationId: activeStationId }
      : !access.isAdmin
        ? { serviceStationId: { in: access.allowedStationIds.length ? access.allowedStationIds : [-1] } }
        : {};

    const [queueRows, ordemRows, faturaRows] = await Promise.all([
      prisma.serviceStationQueue.findMany({
        where: {
          ...stationWhere,
          OR: [{ dataChegada: { gte: start, lt: end } }, { createdAt: { gte: start, lt: end } }],
        },
        include: {
          jangada: {
            select: {
              id: true,
              serial: true,
              brand: true,
              model: true,
              shipNameManual: true,
              owner: true,
            },
          },
          serviceStation: { select: { codigo: true, nome: true } },
          ordemServico: {
            select: {
              id: true,
              numeroOrdem: true,
              status: true,
              orcamentoStatus: true,
              valorPecas: true,
              valorMaoObra: true,
              valorDesconto: true,
              valorTotal: true,
              isIsentoIva: true,
              dataConclusao: true,
            },
          },
        },
        orderBy: { dataChegada: "asc" },
      }),
      prisma.ordemServico.findMany({
        where: {
          ...stationWhere,
          OR: [{ dataConclusao: { gte: start, lt: end } }, { dataAbertura: { gte: start, lt: end } }],
        },
        select: {
          id: true,
          numeroOrdem: true,
          status: true,
          orcamentoStatus: true,
          valorPecas: true,
          valorMaoObra: true,
          valorDesconto: true,
          valorTotal: true,
          isIsentoIva: true,
          serviceStationId: true,
          dataAbertura: true,
          dataConclusao: true,
          dataPrevista: true,
        },
        orderBy: { dataAbertura: "asc" },
      }),
      prisma.fatura.findMany({
        where: {
          cancelada: false,
          dataEmissao: { gte: start, lt: end },
          ordemServicos: { some: { ordemServico: { ...stationWhere } } },
        },
        select: {
          id: true,
          numeroFatura: true,
          valorTotal: true,
          dataEmissao: true,
          ordemServicos: {
            include: {
              ordemServico: { select: { serviceStationId: true } },
            },
          },
        },
        orderBy: { dataEmissao: "asc" },
      }),
    ]);

    const parseMeta = (raw?: string | null) => {
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    };

    const received = queueRows.length;
    const delivered = queueRows.filter((row) => Boolean(parseMeta(row.observacoes).deliveredAt)).length;
    const stillActive = queueRows.filter((row) => {
      const meta = parseMeta(row.observacoes);
      return !meta.deliveredAt && row.status !== "finalizada";
    }).length;
    const completed = ordemRows.filter((order) => order.status === "concluida" || order.status === "finalizada").length;

    const approved = ordemRows.filter((order) => String(order.orcamentoStatus || "") === "Aprovado");
    const approvedTotal = approved.reduce((sum, order) => sum + Number(order.valorTotal || 0), 0);
    const faturadoTotal = faturaRows.reduce((sum, fatura) => sum + Number(fatura.valorTotal || 0), 0);

    const byStation = new Map<number, { nome: string; recebidas: number; entregues: number; faturado: number }>();
    const addStation = (id: number, nome: string) => {
      if (!byStation.has(id)) byStation.set(id, { nome, recebidas: 0, entregues: 0, faturado: 0 });
      return byStation.get(id)!;
    };

    queueRows.forEach((row) => {
      const meta = parseMeta(row.observacoes);
      const st = addStation(row.serviceStationId || 0, row.serviceStation ? `${row.serviceStation.codigo} · ${row.serviceStation.nome}` : "Sem estação");
      st.recebidas += 1;
      if (meta.deliveredAt) st.entregues += 1;
    });
    faturaRows.forEach((fatura) => {
      const firstStationId = fatura.ordemServicos[0]?.ordemServico.serviceStationId ?? null;
      const st = addStation(firstStationId || 0, "—");
      st.faturado += Number(fatura.valorTotal || 0);
    });

    const workbook = new ExcelJS.Workbook();
    const summary = workbook.addWorksheet("Resumo");
    summary.columns = [
      { header: "", key: "a", width: 30 },
      { header: "", key: "b", width: 16 },
      { header: "", key: "c", width: 16 },
      { header: "", key: "d", width: 16 },
      { header: "", key: "e", width: 16 },
    ];

    summary.mergeCells("A1:E1");
    summary.getCell("A1").value = `RELATÓRIO MENSAL DA ESTAÇÃO · ${month}/${year}`;
    summary.getCell("A1").font = { bold: true, size: 15, color: { argb: "FFFFFF" } };
    summary.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F46E5" } };
    summary.getRow(1).height = 26;
    summary.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

    let rowIndex = 2;
    const addRow = (label: string, value: string | number, bold = false) => {
      summary.getCell(`A${rowIndex}`).value = label;
      summary.getCell(`B${rowIndex}`).value = value;
      summary.getCell(`A${rowIndex}`).font = { bold };
      summary.getCell(`B${rowIndex}`).font = { bold };
      rowIndex += 1;
    };

    addRow("Mês", `${month}/${year}`);
    addRow("Jangadas rececionadas", received, true);
    addRow("Entregues", delivered);
    addRow("Ainda em fila ativa", stillActive);
    addRow("Ordens concluídas", completed);
    addRow("Orçamentos aprovados", approved.length);
    addRow("Valor orçamentado aprovado", formatEuro(approvedTotal), true);
    addRow("Faturas emitidas", faturaRows.length);
    addRow("Valor faturado", formatEuro(faturadoTotal), true);

    rowIndex += 1;
    summary.mergeCells(`A${rowIndex}:E${rowIndex}`);
    summary.getCell(`A${rowIndex}`).value = "Desagregação por estação";
    summary.getCell(`A${rowIndex}`).font = { bold: true };
    summary.getCell(`A${rowIndex}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EEF2FF" } };
    rowIndex += 1;

    summary.getCell(`A${rowIndex}`).value = "Estação";
    summary.getCell(`B${rowIndex}`).value = "Recebidas";
    summary.getCell(`C${rowIndex}`).value = "Entregues";
    summary.getCell(`D${rowIndex}`).value = "Faturado";
    summary.getCell(`A${rowIndex}`).font = { bold: true };
    summary.getCell(`B${rowIndex}`).font = { bold: true };
    summary.getCell(`C${rowIndex}`).font = { bold: true };
    summary.getCell(`D${rowIndex}`).font = { bold: true };
    rowIndex += 1;

    Array.from(byStation.values()).forEach((st) => {
      summary.getCell(`A${rowIndex}`).value = st.nome;
      summary.getCell(`B${rowIndex}`).value = st.recebidas;
      summary.getCell(`C${rowIndex}`).value = st.entregues;
      summary.getCell(`D${rowIndex}`).value = formatEuro(st.faturado);
      rowIndex += 1;
    });

    const detail = workbook.addWorksheet("Detalhe Receções");
    detail.columns = [
      { header: "Nº Série", key: "serial", width: 18 },
      { header: "Jangada", key: "model", width: 26 },
      { header: "Embarcação", key: "navio", width: 26 },
      { header: "Estação", key: "estacao", width: 20 },
      { header: "Data Receção", key: "dataRececao", width: 14 },
      { header: "Nº Ordem", key: "numeroOrdem", width: 18 },
      { header: "Estado Orçamento", key: "orcamento", width: 16 },
      { header: "Valor Total", key: "valor", width: 14 },
      { header: "Entregue", key: "entregue", width: 14 },
    ];
    detail.getRow(1).font = { bold: true };
    detail.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EEF2FF" } };

    queueRows.forEach((row) => {
      const meta = parseMeta(row.observacoes);
      detail.addRow({
        serial: row.jangada?.serial || "—",
        model: `${row.jangada?.brand || ""} ${row.jangada?.model || ""}`.trim() || "—",
        navio: row.jangada?.shipNameManual || row.jangada?.owner || "—",
        estacao: row.serviceStation ? `${row.serviceStation.codigo} · ${row.serviceStation.nome}` : "—",
        dataRececao: formatDate(row.dataChegada || row.createdAt),
        numeroOrdem: row.ordemServico?.numeroOrdem || "—",
        orcamento: row.ordemServico?.orcamentoStatus || "Rascunho",
        valor: formatEuro(Number(row.ordemServico?.valorTotal || 0)),
        entregue: meta.deliveredAt ? formatDate(meta.deliveredAt) : "—",
      });
    });

    const ordersSheet = workbook.addWorksheet("Ordens");
    ordersSheet.columns = [
      { header: "Nº Ordem", key: "numeroOrdem", width: 20 },
      { header: "Abertura", key: "abertura", width: 14 },
      { header: "Conclusão", key: "conclusao", width: 14 },
      { header: "Estado", key: "status", width: 16 },
      { header: "Orçamento", key: "orcamento", width: 16 },
      { header: "Peças", key: "pecas", width: 14 },
      { header: "Mão de obra", key: "maoObra", width: 14 },
      { header: "Desconto", key: "desconto", width: 14 },
      { header: "Total", key: "total", width: 14 },
    ];
    ordersSheet.getRow(1).font = { bold: true };
    ordersSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EEF2FF" } };

    ordemRows.forEach((order) => {
      ordersSheet.addRow({
        numeroOrdem: order.numeroOrdem || "—",
        abertura: formatDate(order.dataAbertura),
        conclusao: formatDate(order.dataConclusao),
        status: order.status || "—",
        orcamento: order.orcamentoStatus || "Rascunho",
        pecas: formatEuro(Number(order.valorPecas || 0)),
        maoObra: formatEuro(Number(order.valorMaoObra || 0)),
        desconto: formatEuro(Number(order.valorDesconto || 0)),
        total: formatEuro(Number(order.valorTotal || 0)),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename=relatorio-estacao-${year}-${String(month).padStart(2, "0")}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao gerar relatório mensal:", error);
    const message = error instanceof Error ? error.message : "Erro ao gerar o relatório mensal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
