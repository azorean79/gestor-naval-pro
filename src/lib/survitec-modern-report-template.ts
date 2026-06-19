import type { OreyCertificateTemplateInput } from './orey-certificate-template';

function asString(value: unknown) {
  return String(value ?? '').trim();
}

function escapeHtml(value: unknown) {
  return asString(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateLabel(value: unknown) {
  const raw = asString(value);
  if (!raw) return '—';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('pt-PT');
}

function yesNo(value: unknown) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['yes', 'sim', 'true', '1', 'y', 'ok', 'pass'].includes(normalized)) return 'SIM';
    if (['n/a', 'na', 'nd', 'n.d', 'not applicable', 'não aplicável', 'nao aplicavel'].includes(normalized)) return 'N/A';
    if (['no', 'nao', 'não', 'false', '0', 'n', 'fail'].includes(normalized)) return 'NÃO';
  }
  if (typeof value === 'boolean') return value ? 'SIM' : 'NÃO';
  if (typeof value === 'number') return value ? 'SIM' : 'NÃO';
  return 'N/A';
}

function resultTag(value: unknown) {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (['PASS', 'OK', 'YES', 'SIM', 'TRUE', '1'].includes(normalized)) return '<span class="tag ok">PASS</span>';
  if (['N/A', 'NA', 'N.D', 'ND'].includes(normalized)) return '<span class="tag warn">N/A</span>';
  if (!normalized) return '<span class="tag warn">N/A</span>';
  return '<span class="tag bad">FAIL</span>';
}

function buildChecklist(input?: Record<string, unknown>) {
  return input || {};
}

export function buildSurvitecModernReportHtml(input: OreyCertificateTemplateInput) {
  const checklist = buildChecklist(input.checklist);
  const certNumber = asString(input.certNumber) || 'SEM-NUMERO';
  const shipName = asString(input.shipName) || 'Sem navio';
  const owner = asString(input.owner) || '—';
  const brand = asString(input.brand) || '—';
  const raftModel = asString(input.raftModel) || '—';
  const raftSerial = asString(input.raftSerial) || 'SEM-SERIAL';
  const raftCapacity = asString(input.raftCapacity) || '—';
  const inspectionDate = formatDateLabel(input.inspectionDate);
  const nextInspectionDate = formatDateLabel(input.nextInspectionDate);
  const manufactureDate = asString(input.manufactureDate) || '—';
  const packType = asString(input.packType) || '—';
  const cylinderSerial = asString(input.cylinderSerial) || '—';
  const cylinderCo2 = asString(input.cylinderCo2) || '—';
  const cylinderN2 = asString(input.cylinderN2) || '—';
  const hydroDate = asString(input.cylinderHydroTestDate) || '—';
  const fabricType = asString(input.fabricType) || '—';
  const stationName = 'OREY TÉCNICA - SERVIÇOS NAVAIS, LDA';

  const testWp = resultTag(checklist.teste_wp);
  const testNap = resultTag(checklist.teste_nap);
  const testFs = resultTag(checklist.teste_fs);
  const testGi = resultTag(checklist.teste_gi);
  const testDl = resultTag(checklist.teste_dl);

  const sb0117Applied = yesNo(checklist.sb_01_17_inflation_hoses || checklist['survitec-leafield-inflation-hoses-01-17']);

  const html = `<!doctype html>
<html lang="pt-PT">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relatório de Inspeção Moderno - ${escapeHtml(raftSerial)}</title>
    <style>
      :root {
        --bg: #f3f6fb;
        --card: #ffffff;
        --ink: #142033;
        --muted: #5f6b7a;
        --line: #d8e1ef;
        --accent: #1146a6;
        --accent-2: #0ea5e9;
        --ok: #16a34a;
        --warn: #d97706;
        --bad: #dc2626;
      }
      @page { size: A4 portrait; margin: 6mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; font-family: "Inter", "Segoe UI", Roboto, Arial, sans-serif; color: var(--ink); background: var(--bg); }
      .page { width: 210mm; min-height: 297mm; max-height: 297mm; overflow: hidden; margin: 0 auto; padding: 6mm; background: var(--card); border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
      .titlebar { display: grid; grid-template-columns: 1.05fr 1.9fr 1.05fr; gap: 6px; align-items: center; border: 1px solid var(--line); border-radius: 8px; padding: 6px; background: linear-gradient(90deg, #f8fbff 0%, #f3f8ff 100%); }
      .logo-block { border: 1px dashed #b9c9e3; border-radius: 6px; min-height: 36px; display: grid; place-items: center; color: var(--muted); font-size: 9px; }
      .doc-title h1 { margin: 0; font-size: 14px; line-height: 1.1; letter-spacing: 0.15px; }
      .doc-title p { margin: 3px 0 0; color: var(--muted); font-size: 9px; }
      .meta { border: 1px solid var(--line); border-radius: 6px; background: #fff; }
      .meta-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--line); }
      .meta-row:last-child { border-bottom: 0; }
      .meta-cell { padding: 4px 6px; border-right: 1px solid var(--line); }
      .meta-cell:last-child { border-right: 0; }
      .lbl { color: var(--muted); font-size: 8px; text-transform: uppercase; letter-spacing: 0.25px; }
      .val { margin-top: 1px; font-size: 10px; font-weight: 600; line-height: 1.2; }
      .section { margin-top: 5px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
      .section-head { padding: 4px 8px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); color: #fff; display: flex; justify-content: space-between; align-items: center; }
      .section-head h2 { margin: 0; font-size: 10px; letter-spacing: 0.1px; }
      .section-head small { opacity: 0.95; font-size: 8px; }
      .grid { display: grid; gap: 0; }
      .grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .field { border-right: 1px solid var(--line); border-top: 1px solid var(--line); padding: 4px 6px; }
      .grid .field:nth-child(2n) { border-right: 0; }
      .grid.cols-3 .field:nth-child(3n) { border-right: 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid var(--line); padding: 3px 5px; font-size: 9px; line-height: 1.2; vertical-align: top; }
      th { text-align: left; background: #eef4ff; font-weight: 700; }
      .tag { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 8px; font-weight: 700; }
      .tag.ok { background: #dcfce7; color: var(--ok); }
      .tag.warn { background: #ffedd5; color: var(--warn); }
      .tag.bad { background: #fee2e2; color: var(--bad); }
      .check { font-weight: 700; letter-spacing: 0.15px; }
      .free-text { border-top: 1px solid var(--line); padding: 5px 6px; min-height: 30px; max-height: 44px; overflow: hidden; color: #1e293b; font-size: 9px; line-height: 1.2; white-space: pre-wrap; }
      .signatures { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 5px 6px; border-top: 1px solid var(--line); }
      .sig { border: 1px dashed #b7c6e0; border-radius: 6px; padding: 5px; min-height: 38px; }
      .footer-note { margin-top: 5px; color: var(--muted); font-size: 8px; line-height: 1.25; }
      @media (max-width: 900px) {
        .titlebar { grid-template-columns: 1fr; }
        .grid.cols-2, .grid.cols-3, .signatures { grid-template-columns: 1fr; }
        .grid .field, .grid.cols-3 .field { border-right: 0; }
      }
      @media print {
        body { background: #fff; }
        .page { width: 210mm; min-height: 297mm; max-height: 297mm; margin: 0; border: 0; border-radius: 0; box-shadow: none; padding: 6mm; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="titlebar">
        <div class="logo-block">${escapeHtml(stationName)}</div>
        <div class="doc-title">
          <h1>Relatório de Inspeção de Jangada Salva‑vidas</h1>
          <p>Modelo moderno baseado em formulário técnico tipo Survitec (Form 1 / Inspection Report).</p>
        </div>
        <div class="meta" aria-label="metadados do relatório">
          <div class="meta-row">
            <div class="meta-cell"><div class="lbl">Doc. Number</div><div class="val">VAN-QF-5</div></div>
            <div class="meta-cell"><div class="lbl">Revisão</div><div class="val">05</div></div>
          </div>
          <div class="meta-row">
            <div class="meta-cell"><div class="lbl">Formulário</div><div class="val">Form 1</div></div>
            <div class="meta-cell"><div class="lbl">N.º Relatório</div><div class="val">${escapeHtml(certNumber)}</div></div>
          </div>
          <div class="meta-row">
            <div class="meta-cell"><div class="lbl">Data inspeção</div><div class="val">${escapeHtml(inspectionDate)}</div></div>
            <div class="meta-cell"><div class="lbl">Próx. inspeção</div><div class="val">${escapeHtml(nextInspectionDate)}</div></div>
          </div>
        </div>
      </header>

      <section class="section">
        <div class="section-head"><h2>1) Identificação / Identification</h2><small>Dados do cliente, navio e jangada</small></div>
        <div class="grid cols-3">
          <div class="field"><div class="lbl">Cliente / Owner</div><div class="val">${escapeHtml(owner)}</div></div>
          <div class="field"><div class="lbl">Navio / Vessel</div><div class="val">${escapeHtml(shipName)}</div></div>
          <div class="field"><div class="lbl">País / Country</div><div class="val">${escapeHtml(input.shipFlag || '—')}</div></div>
          <div class="field"><div class="lbl">Marca / Brand</div><div class="val">${escapeHtml(brand)}</div></div>
          <div class="field"><div class="lbl">Modelo / Model</div><div class="val">${escapeHtml(raftModel)}</div></div>
          <div class="field"><div class="lbl">Serial No.</div><div class="val">${escapeHtml(raftSerial)}</div></div>
          <div class="field"><div class="lbl">Capacidade</div><div class="val">${escapeHtml(raftCapacity)}</div></div>
          <div class="field"><div class="lbl">Pack Type</div><div class="val">${escapeHtml(packType)}</div></div>
          <div class="field"><div class="lbl">Data fabrico</div><div class="val">${escapeHtml(manufactureDate)}</div></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>2) Ensaios e verificação funcional</h2><small>Critérios de aprovação e registos de medição</small></div>
        <table>
          <thead><tr><th>Teste</th><th>Resultado</th><th>Medição / Observação</th></tr></thead>
          <tbody>
            <tr><td>WP (Pressure Test)</td><td>${testWp}</td><td>Temperatura sup./inf.: ${escapeHtml(checklist.teste_temperatura_camara_superior || '—')} / ${escapeHtml(checklist.teste_temperatura_camara_inferior || '—')}</td></tr>
            <tr><td>NAP</td><td>${testNap}</td><td>Teste NAP registado em checklist</td></tr>
            <tr><td>FS</td><td>${testFs}</td><td>Floor Seam conforme checklist</td></tr>
            <tr><td>GI</td><td>${testGi}</td><td>Gas Inflation conforme checklist</td></tr>
            <tr><td>D.L.</td><td>${testDl}</td><td>Dynamic Load conforme checklist</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-head"><h2>3) Válvulas e comandos</h2><small>Checklist SIM / NÃO / N/A</small></div>
        <table>
          <thead><tr><th>Elemento</th><th>Estado</th><th>Observações</th></tr></thead>
          <tbody>
            <tr><td>P.R.V.</td><td class="check">${escapeHtml(yesNo(checklist.prv || checklist.valvula_prv))}</td><td>Condição avaliada em inspeção</td></tr>
            <tr><td>T.R.V.</td><td class="check">${escapeHtml(yesNo(checklist.trv || checklist.valvula_trv))}</td><td>Condição avaliada em inspeção</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-head"><h2>4) Cilindro e sistema de inflação</h2><small>Rastreabilidade e conformidade</small></div>
        <div class="grid cols-2">
          <div class="field"><div class="lbl">Serial cilindro</div><div class="val">${escapeHtml(cylinderSerial)}</div></div>
          <div class="field"><div class="lbl">Data último hidroteste</div><div class="val">${escapeHtml(hydroDate)}</div></div>
          <div class="field"><div class="lbl">CO₂ (kg)</div><div class="val">${escapeHtml(cylinderCo2)}</div></div>
          <div class="field"><div class="lbl">N₂ (kg)</div><div class="val">${escapeHtml(cylinderN2)}</div></div>
          <div class="field"><div class="lbl">Tipo de tecido</div><div class="val">${escapeHtml(fabricType)}</div></div>
          <div class="field"><div class="lbl">Sistema inflação</div><div class="val">${escapeHtml(checklist.cylinder_sistema || checklist.sistema_inflacao || '—')}</div></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>5) Service Bulletins e ações aplicadas</h2><small>Registo obrigatório de cumprimento</small></div>
        <table>
          <thead><tr><th>Boletim</th><th>Aplicado</th><th>Evidência</th></tr></thead>
          <tbody>
            <tr><td>SB 01/17 Ver.3 (Inflation Hoses)</td><td>${escapeHtml(sb0117Applied)}</td><td>${sb0117Applied === 'SIM' ? 'Registo: "SB 01/17 Ver.3 APPLIED"' : 'Sem registo de aplicação'}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-head"><h2>6) Observações e recomendações</h2><small>Notas do técnico / observações do cliente</small></div>
        <div class="free-text">${escapeHtml(String(checklist.observacoes || checklist.remarks || 'Produto identificado acima foi inspecionado e testado de acordo com o manual do fabricante.'))}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>7) Aprovação e assinatura</h2><small>Authorized release / service completion</small></div>
        <div class="grid cols-3">
          <div class="field"><div class="lbl">Data inspeção</div><div class="val">${escapeHtml(inspectionDate)}</div></div>
          <div class="field"><div class="lbl">Próxima inspeção</div><div class="val">${escapeHtml(nextInspectionDate)}</div></div>
          <div class="field"><div class="lbl">Status final</div><div class="val">${escapeHtml(asString(input.status) || 'Concluída')}</div></div>
        </div>
        <div class="signatures">
          <div class="sig"><div class="lbl">Técnico autorizado</div><div class="val">${escapeHtml(input.technician || '—')}</div></div>
          <div class="sig"><div class="lbl">Estação de serviço</div><div class="val">${escapeHtml(stationName)}</div></div>
          <div class="sig"><div class="lbl">Cliente</div><div class="val">Confirmação de receção</div></div>
        </div>
      </section>

      <p class="footer-note">Relatório gerado automaticamente pela ficha da jangada com dados dinâmicos da inspeção e checklist.</p>
    </main>
  </body>
</html>`;

  const safeSerial = raftSerial.replace(/[^A-Za-z0-9_-]+/g, '_');
  const fileName = `relatorio_inspecao_moderno_${safeSerial}.html`;

  return { html, fileName };
}
