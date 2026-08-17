export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

export function formatNumber(value: number) {
  return value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function handleExportBudgetPdf(params: ExportBudgetExcelParams) {
  const { materiais, maoObra, config } = params;
  const subtotal = materiais.reduce((acc, m) => acc + m.total, 0) + maoObra.reduce((acc, m) => acc + m.total, 0);
  const descVal = config.descontoTipo === "percentual" ? subtotal * (config.desconto / 100) : config.desconto;
  const subtotalComDesc = Math.max(0, subtotal - descVal);
  const ivaVal = config.isentoIva ? 0 : subtotalComDesc * (config.ivaRate / 100);
  const total = subtotalComDesc + ivaVal;

  const euro = (v: number) => formatCurrency(v);
  const esc = (v: string) => v ? v.replace(/</g, "&lt;") : "";

  const infoRows = [
    ["OS", params.ordemNumero],
    ["Data", new Date().toLocaleDateString("pt-PT")],
    ["Cliente", params.clienteNome],
    ["NIF", params.clienteNif || "-"],
    ["Morada", params.clienteMorada || "-"],
    ["Jangada", params.jangadaInfo],
    ["Serial", params.jangadaSerial || "-"],
    ["Navio / Armador", params.navio || "-"],
    ["Técnico", params.tecnico || "-"],
    ["Validade", `${config.validadeDias} dias`],
  ];

  const materialRows = materiais.map((m) => `
    <tr>
      <td>${esc(m.referencia || "-")}</td>
      <td>${esc(m.descricao)}</td>
      <td class="c">${m.quantidade}</td>
      <td class="r">${euro(m.precoUnitario)}</td>
      <td class="c">${m.desconto ? (m.descontoTipo === "percentual" ? `${m.desconto}%` : euro(m.desconto)) : "-"}</td>
      <td class="r">${euro(m.total)}</td>
    </tr>`).join("");

  const maoObraRows = maoObra.map((m) => `
    <tr>
      <td colspan="2">${esc(m.descricao)}</td>
      <td class="c">${m.horas}</td>
      <td class="r">${euro(m.precoHora)}</td>
      <td></td>
      <td class="r">${euro(m.total)}</td>
    </tr>`).join("");

  const totalMateriais = materiais.reduce((acc, m) => acc + m.total, 0);
  const totalMaoObra = maoObra.reduce((acc, m) => acc + m.total, 0);

  const totalRows = [
    ["Subtotal Materiais", euro(totalMateriais), false],
    ["Subtotal Mão de Obra", euro(totalMaoObra), false],
  ];
  if (descVal > 0) {
    totalRows.push([`Desconto (${config.descontoTipo === "percentual" ? `${config.desconto}%` : euro(config.desconto)})`, `- ${euro(descVal)}`, false]);
  }
  totalRows.push(["Subtotal c/ Desconto", euro(subtotalComDesc), false]);
  totalRows.push([`IVA (${config.isentoIva ? "Isento" : `${config.ivaRate}%`})`, config.isentoIva ? "Isento" : euro(ivaVal), false]);
  totalRows.push(["TOTAL", euro(total), true]);

  const totalsHtml = totalRows.map(([label, val, bold]) => `
    <tr class="${bold ? "total" : ""}">
      <td colspan="4" class="r">${label}</td>
      <td></td>
      <td class="r">${val}</td>
    </tr>`).join("");

  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) return;

  win.document.write(`<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<title>Orçamento ${esc(params.ordemNumero || "")}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Calibri, Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a3c6e; padding-bottom: 12px; margin-bottom: 18px; }
  .title { font-size: 20px; font-weight: bold; color: #1a3c6e; }
  .brand { font-size: 11px; color: #64748b; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #1a3c6e; color: #fff; padding: 7px 8px; text-align: left; font-size: 12px; }
  td { padding: 6px 8px; border-bottom: 1px solid #d0d5dd; }
  .c { text-align: center; } .r { text-align: right; }
  tr.total td { font-weight: bold; border-top: 2px solid #1a3c6e; background: #fef2f2; }
  .section { font-weight: bold; color: #2e7d32; margin-top: 18px; font-size: 13px; }
  .info td { border-bottom: 1px dotted #d0d5dd; }
  .info td:first-child { font-weight: bold; color: #1a3c6e; width: 140px; }
  .obs { margin-top: 20px; font-size: 11px; color: #64748b; }
  .footer { margin-top: 28px; font-size: 9px; color: #64748b; text-align: center; border-top: 1px solid #d0d5dd; padding-top: 8px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">ORÇAMENTO / PRO-FORMA</div>
       <div class="brand" style="text-align:left;margin-top:4px">Orey Técnica Serviços Navais, Lda. · NIF: 501117334 · Cabouco</div>
    </div>
    <div class="brand">Orey Técnica Serviços Navais, Lda.<br />Sede: Rua dos Caniços, nº 36, 2625-253 Vialonga<br />Delegação Açores: Zona Industrial dos Portões Vermelhos, Armazém 19, 9560-350 Cabouco</div>
  </div>

  <table class="info">
    ${infoRows.map(([l, v]) => `<tr><td>${l}</td><td>${esc(String(v))}</td></tr>`).join("")}
  </table>

  <div class="section">MATERIAIS</div>
  <table>
    <thead><tr><th>Ref.</th><th>Descrição</th><th class="c">Qtd</th><th class="r">Preço Unit.</th><th class="c">Desconto</th><th class="r">Total</th></tr></thead>
    <tbody>${materialRows || '<tr><td colspan="6" class="c" style="color:#64748b">Nenhum material adicionado</td></tr>'}</tbody>
  </table>

  <div class="section">MÃO DE OBRA</div>
  <table>
    <thead><tr><th colspan="2">Serviço</th><th class="c">Horas</th><th class="r">Preço/Hora</th><th></th><th class="r">Total</th></tr></thead>
    <tbody>${maoObraRows || '<tr><td colspan="6" class="c" style="color:#64748b">Nenhum serviço adicionado</td></tr>'}</tbody>
  </table>

  <table>${totalsHtml}</table>

  <div class="obs">
    <div><b>Condições de Pagamento:</b> ${esc(config.condicoesPagamento || "—")}</div>
    ${config.observacoes ? `<div style="margin-top:6px"><b>Observações:</b> ${esc(config.observacoes)}</div>` : ""}
    <div style="margin-top:6px">Documento gerado automaticamente pelo Sistema de Gestão Orey.</div>
  </div>

  <div class="footer">
    Orey Técnica - Serviços Navais, Lda.<br />
    Sede: Rua dos Caniços, nº 36, 2625-253 Vialonga | Tel: +351 213 610 890 | E-mail: orey-tecnica@orey.com<br />
    Delegação Açores: Zona Industrial dos Portões Vermelhos, Armazém 19, 9560-350 Cabouco | Tel: +351 296 929 314 | E-mail: azores.tecnica@orey.com<br />
    Delegação Norte: Rua do Outeiro, 315-F, 4485-010 Aveleda | Tel: +351 229 363 490 | E-mail: leixoes.tecnica@orey.com<br />
    Delegação Sul: Zona Industrial e Comercial do Rogel, Lt. 3 fração G, 8365-204 Alcantarilha | Tel: +351 282 322 795 | E-mail: algarve.tecnica@orey.com<br />
    Site: www.oreytecnica.com | Capital Social: 350.000 euros | NIF: 501 117 334
  </div>

  <script>window.onload = function () { window.print(); };</script>
</body>
</html>`);
  win.document.close();
}

type ExportBudgetExcelParams = {
  materiais: Array<{
    id: string;
    referencia?: string;
    descricao: string;
    quantidade: number;
    precoUnitario: number;
    total: number;
    desconto?: number;
    descontoTipo?: "valor" | "percentual";
  }>;
  maoObra: Array<{
    id: string;
    descricao: string;
    horas: number;
    precoHora: number;
    total: number;
  }>;
  config: {
    ivaRate: number;
    isentoIva: boolean;
    desconto: number;
    descontoTipo: "valor" | "percentual";
    observacoes: string;
    validadeDias: number;
    condicoesPagamento: string;
  };
  ordemNumero: string;
  clienteNome: string;
  clienteNif: string;
  clienteMorada?: string;
  jangadaInfo: string;
  jangadaSerial: string;
  navio: string;
  tecnico: string;
};

export async function handleExportBudgetExcel(params: ExportBudgetExcelParams) {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Orey Técnica Serviços Navais";
  wb.created = new Date();

  const ws = wb.addWorksheet("Pro-Forma");

  // Colunas
  ws.columns = [
    { header: "Ref.", key: "ref", width: 14 },
    { header: "Descrição", key: "descricao", width: 42 },
    { header: "Qtd", key: "qtd", width: 8 },
    { header: "Preço Unit.", key: "preco", width: 16 },
    { header: "Desconto", key: "desconto", width: 14 },
    { header: "Total", key: "total", width: 16 },
  ];

  const PRIMARY = "1A3C6E";
  const ACCENT = "2E7D32";
  const BG_LIGHT = "F0F4F8";
  const BG_WHITE = "FFFFFF";
  const BORDER = "D0D5DD";
  const TEXT_DARK = "1E293B";
  const TEXT_MUTED = "64748B";

  const headerFont = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  const bodyFont = { name: "Calibri", size: 10, color: { argb: TEXT_DARK } };
  const titleFont = { name: "Calibri", size: 16, bold: true, color: { argb: PRIMARY } };
  const subtitleFont = { name: "Calibri", size: 12, bold: true, color: { argb: TEXT_MUTED } };
  const moneyFont = { name: "Calibri", size: 10, bold: true, color: { argb: TEXT_DARK } };

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: BORDER } },
    left: { style: "thin" as const, color: { argb: BORDER } },
    bottom: { style: "thin" as const, color: { argb: BORDER } },
    right: { style: "thin" as const, color: { argb: BORDER } },
  };

  // --- Logo & Header ---
  try {
    const resp = await fetch("/orey-logo.jpg");
    if (resp.ok) {
      const blob = await resp.blob();
      const buf = await blob.arrayBuffer();
      const imgId = wb.addImage({ buffer: buf, extension: "jpeg" });
      ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 140, height: 50 } });
    }
  } catch { /* fallback */ }

  ws.mergeCells(3, 1, 3, 6);
  const titleCell = ws.getCell("A3");
  titleCell.value = "ORÇAMENTO / PRO-FORMA";
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(4, 1, 4, 6);
  const subCell = ws.getCell("A4");
  subCell.value = "Orey Técnica Serviços Navais, Lda. · NIF: 501117334 · Zona Industrial dos Portões Vermelhos, Armazém 19 · 9560-350 Cabouco";
  subCell.font = { name: "Calibri", size: 9, color: { argb: TEXT_MUTED } };
  subCell.alignment = { horizontal: "center" };

  // Info row
  ws.mergeCells(6, 1, 6, 3);
  ws.getCell("A6").value = `OS: ${params.ordemNumero}`;
  ws.getCell("A6").font = subtitleFont;

  ws.mergeCells(6, 4, 6, 6);
  ws.getCell("D6").value = `Data: ${new Date().toLocaleDateString("pt-PT")}`;
  ws.getCell("D6").font = subtitleFont;
  ws.getCell("D6").alignment = { horizontal: "right" };

  // Info table
  const infoData = [
    ["Cliente", params.clienteNome],
    ["NIF", params.clienteNif || "-"],
    ["Jangada", params.jangadaInfo],
    ["Serial", params.jangadaSerial || "-"],
    ["Navio / Armador", params.navio || "-"],
    ["Técnico", params.tecnico || "-"],
  ];

  let rowIdx = 8;
  for (const [label, value] of infoData) {
    const r = ws.getRow(rowIdx);
    r.getCell(1).value = label;
    r.getCell(1).font = { name: "Calibri", size: 10, bold: true, color: { argb: PRIMARY } };
    ws.mergeCells(rowIdx, 2, rowIdx, 6);
    r.getCell(2).value = value;
    r.getCell(2).font = bodyFont;
    r.height = 18;
    rowIdx++;
  }

  rowIdx += 1; // blank row

  // --- Materiais Table ---
  const matHeaderRow = rowIdx;
  const matHeaders = ["Ref.", "Descrição", "Qtd", "Preço Unit.", "Desconto", "Total"];
  for (let c = 0; c < matHeaders.length; c++) {
    const cell = ws.getCell(rowIdx, c + 1);
    cell.value = matHeaders[c];
    cell.font = headerFont;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY } };
    cell.alignment = { horizontal: c === 2 || c === 4 ? "center" : c >= 3 ? "right" : "left", vertical: "middle" };
    cell.border = thinBorder;
  }
  ws.getRow(rowIdx).height = 22;
  rowIdx++;

  let totalBase = 0;

  if (params.materiais.length === 0) {
    ws.mergeCells(rowIdx, 1, rowIdx, 6);
    ws.getCell(rowIdx, 1).value = "Nenhum material adicionado";
    ws.getCell(rowIdx, 1).font = { name: "Calibri", size: 10, italic: true, color: { argb: TEXT_MUTED } };
    ws.getCell(rowIdx, 1).alignment = { horizontal: "center" };
    rowIdx++;
  } else {
    for (const mat of params.materiais) {
      const r = ws.getRow(rowIdx);
      const isEven = (rowIdx % 2 === 0);

      r.getCell(1).value = mat.referencia || "-";
      r.getCell(1).font = bodyFont;
      r.getCell(2).value = mat.descricao;
      r.getCell(2).font = bodyFont;
      r.getCell(3).value = mat.quantidade;
      r.getCell(3).font = bodyFont;
      r.getCell(3).alignment = { horizontal: "center" };
      r.getCell(4).value = mat.precoUnitario;
      r.getCell(4).font = moneyFont;
      r.getCell(4).alignment = { horizontal: "right" };
      r.getCell(4).numFmt = "#,##0.00 €";

      const descText = mat.desconto
        ? (mat.descontoTipo === "percentual" ? `${mat.desconto}%` : `${mat.desconto.toFixed(2)} €`)
        : "-";
      r.getCell(5).value = descText;
      r.getCell(5).font = { name: "Calibri", size: 10, color: { argb: mat.desconto ? "DC2626" : TEXT_MUTED } };
      r.getCell(5).alignment = { horizontal: "center" };

      r.getCell(6).value = mat.total;
      r.getCell(6).font = moneyFont;
      r.getCell(6).alignment = { horizontal: "right" };
      r.getCell(6).numFmt = "#,##0.00 €";

      totalBase += mat.total;

      // Stripe & border
      for (let c = 1; c <= 6; c++) {
        const cell = r.getCell(c);
        cell.border = thinBorder;
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFC" } };
      }

      r.height = 20;
      rowIdx++;
    }
  }

  // --- Mão de Obra Header ---
  rowIdx += 1;
  const moHeaderRow = rowIdx;
  const moHeaders = ["", "Serviço / Mão de Obra", "Horas", "Preço/Hora", "", "Total"];
  for (let c = 0; c < moHeaders.length; c++) {
    const cell = ws.getCell(rowIdx, c + 1);
    cell.value = moHeaders[c];
    cell.font = headerFont;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.alignment = { horizontal: c === 5 ? "right" : "left", vertical: "middle" };
    cell.border = thinBorder;
  }
  ws.getRow(rowIdx).height = 22;
  rowIdx++;

  let totalMo = 0;

  if (params.maoObra.length === 0) {
    ws.mergeCells(rowIdx, 1, rowIdx, 6);
    ws.getCell(rowIdx, 1).value = "Nenhum serviço adicionado";
    ws.getCell(rowIdx, 1).font = { name: "Calibri", size: 10, italic: true, color: { argb: TEXT_MUTED } };
    ws.getCell(rowIdx, 1).alignment = { horizontal: "center" };
    rowIdx++;
  } else {
    for (const mo of params.maoObra) {
      const r = ws.getRow(rowIdx);
      const isEven = (rowIdx % 2 === 0);

      r.getCell(2).value = mo.descricao;
      r.getCell(2).font = bodyFont;
      r.getCell(3).value = mo.horas;
      r.getCell(3).font = bodyFont;
      r.getCell(3).alignment = { horizontal: "center" };
      r.getCell(4).value = mo.precoHora;
      r.getCell(4).font = moneyFont;
      r.getCell(4).alignment = { horizontal: "right" };
      r.getCell(4).numFmt = "#,##0.00 €";
      r.getCell(6).value = mo.total;
      r.getCell(6).font = moneyFont;
      r.getCell(6).alignment = { horizontal: "right" };
      r.getCell(6).numFmt = "#,##0.00 €";

      totalMo += mo.total;

      for (let c = 1; c <= 6; c++) {
        const cell = r.getCell(c);
        cell.border = thinBorder;
        if (isEven) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0FDF4" } };
      }

      r.height = 20;
      rowIdx++;
    }
  }

  // --- Totais Section ---
  rowIdx += 1;
  const subtotal = totalBase + totalMo;

  const { config } = params;
  const descVal = config.descontoTipo === "percentual"
    ? subtotal * (config.desconto / 100)
    : config.desconto;
  const subtotalComDesc = Math.max(0, subtotal - descVal);
  const ivaVal = config.isentoIva ? 0 : subtotalComDesc * (config.ivaRate / 100);
  const total = subtotalComDesc + ivaVal;

  const totalRows: [string, number | string][] = [
    ["Subtotal Materiais", totalBase],
    ["Subtotal Mão de Obra", totalMo],
  ];
  if (descVal > 0) {
    totalRows.push([`Desconto (${config.descontoTipo === "percentual" ? `${config.desconto}%` : `${config.desconto.toFixed(2)} €`})`, -descVal]);
  }
  totalRows.push(["Subtotal c/ Desconto", subtotalComDesc]);
  totalRows.push([`IVA (${config.isentoIva ? "Isento" : `${config.ivaRate}%`})`, config.isentoIva ? "Isento" : ivaVal]);
  totalRows.push(["TOTAL", total]);

  for (const [label, val] of totalRows) {
    const r = ws.getRow(rowIdx);
    ws.mergeCells(rowIdx, 1, rowIdx, 4);
    r.getCell(1).value = label;
    r.getCell(1).font = {
      name: "Calibri",
      size: label === "TOTAL" ? 13 : 11,
      bold: true,
      color: { argb: label === "TOTAL" ? "DC2626" : label.startsWith("Desconto") ? "DC2626" : PRIMARY },
    };
    r.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(5).value = "";
    if (typeof val === "number") {
      r.getCell(6).value = val;
      r.getCell(6).font = {
        name: "Calibri",
        size: label === "TOTAL" ? 14 : 11,
        bold: true,
        color: { argb: label === "TOTAL" ? "DC2626" : TEXT_DARK },
      };
      r.getCell(6).numFmt = "#,##0.00 €";
    } else {
      r.getCell(6).value = val;
      r.getCell(6).font = { name: "Calibri", size: 11, color: { argb: TEXT_MUTED } };
    }
    r.getCell(6).alignment = { horizontal: "right", vertical: "middle" };

    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.border = {
        top: { style: label === "TOTAL" ? "medium" as const : "thin" as const, color: { argb: label === "TOTAL" ? PRIMARY : BORDER } },
        left: { style: "thin" as const, color: { argb: BORDER } },
        bottom: { style: label === "TOTAL" ? "medium" as const : "thin" as const, color: { argb: label === "TOTAL" ? PRIMARY : BORDER } },
        right: { style: "thin" as const, color: { argb: BORDER } },
      };
      if (label === "TOTAL") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF2F2" } };
    }

    r.height = label === "TOTAL" ? 28 : 22;
    rowIdx++;
  }

  // --- Observações ---
  rowIdx += 1;
  ws.mergeCells(rowIdx, 1, rowIdx, 6);
  const obsCell = ws.getCell(rowIdx, 1);
  obsCell.value = `Condições de Pagamento: ${config.condicoesPagamento || "—"}`;
  obsCell.font = { name: "Calibri", size: 9, color: { argb: TEXT_MUTED } };
  rowIdx++;

  if (config.observacoes) {
    ws.mergeCells(rowIdx, 1, rowIdx, 6);
    const obsNote = ws.getCell(rowIdx, 1);
    obsNote.value = `Observações: ${config.observacoes}`;
    obsNote.font = { name: "Calibri", size: 9, color: { argb: TEXT_MUTED } };
    rowIdx++;
  }

  rowIdx++;
  ws.mergeCells(rowIdx, 1, rowIdx, 6);
  ws.getCell(rowIdx, 1).value = "Documento gerado automaticamente pelo Sistema de Gestão Orey.";
  ws.getCell(rowIdx, 1).font = { name: "Calibri", size: 8, italic: true, color: { argb: "94A3B8" } };
  ws.getCell(rowIdx, 1).alignment = { horizontal: "center" };
  rowIdx++;

  // Footer with addresses
  const footerFont = { name: "Calibri", size: 7.5, color: { argb: "64748B" } };
  const footerLines = [
    "Orey Técnica - Serviços Navais, Lda.",
    "Sede: Rua dos Caniços, nº 36, 2625-253 Vialonga, Portugal | Tel: +351 213 610 890 | E-mail: orey-tecnica@orey.com",
    "Delegação Açores: Zona Industrial dos Portões Vermelhos, Armazém 19, 9560-350 Cabouco, Portugal | Tel: +351 296 929 314 | E-mail: azores.tecnica@orey.com",
    "Delegação Norte: Rua do Outeiro, 315-F, 4485-010 Aveleda, Portugal | Tel: +351 229 363 490 | E-mail: leixoes.tecnica@orey.com",
    "Delegação Sul: Zona Industrial e Comercial do Rogel, Lt. 3 fração G, 8365-204 Alcantarilha, Portugal | Tel: +351 282 322 795 | E-mail: algarve.tecnica@orey.com",
    "Site: www.oreytecnica.com | Capital Social: 350.000 euros | NIF: 501 117 334",
  ];
  for (const line of footerLines) {
    ws.mergeCells(rowIdx, 1, rowIdx, 6);
    ws.getRow(rowIdx).getCell(1).value = line;
    ws.getRow(rowIdx).getCell(1).font = footerFont;
    ws.getRow(rowIdx).getCell(1).alignment = { horizontal: "center" };
    ws.getRow(rowIdx).height = 12;
    rowIdx++;
  }

  // Print config
  ws.pageSetup.orientation = "portrait";
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proforma_${(params.ordemNumero || "orcamento").replace(/\s+/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
