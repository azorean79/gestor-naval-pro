function findBestMatch(state: MatchState, input: string | undefined): { id: number; nome: string } | null {
  const raw = safeString(input);
  if (!raw) return null;

  const compact = normalizeCompact(raw);

  async function main() {
    const allFiles = fs
      .readdirSync(CERTIFICADOS_DIR)
      .filter((f) => f.toLowerCase().endsWith('.xlsx'))
      .sort((a, b) => a.localeCompare(b));

    const navios = await prisma.navio.findMany({ select: { id: true, nome: true, clienteId: true } });
    const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true } });

    const navioMatch: MatchState = {
      byNorm: new Map(navios.map((n) => [normalizeCompact(n.nome), { id: n.id, nome: n.nome }]))
    };

    const clienteMatch: MatchState = {
      byNorm: new Map(clientes.map((c) => [normalizeCompact(c.nome), { id: c.id, nome: c.nome }]))
    };

    const report = {
      timestamp: new Date().toISOString(),
      fileCount: allFiles.length,
      processed: 0,
      shipsMatched: 0,
      shipsCreated: 0,
      clientsMatched: 0,
      clientsCreated: 0,
      shipClientLinksUpdated: 0,
      raftsUpserted: 0,
      raftsSkippedNoSerial: 0,
      unresolved: [] as Array<{ file: string; reason: string; ship?: string; owner?: string; serial?: string }>,
      sample: [] as ParsedCert[],
    };

    for (const file of allFiles) {
      const filePath = path.join(CERTIFICADOS_DIR, file);
      const wb = XLSX.readFile(filePath, { cellDates: true });

      const certSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'CERTIFICADO') ?? wb.SheetNames[0];
      const quadroSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'QUADRO');

      const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];
      const quadroRows = quadroSheetName ? toMatrix(wb.Sheets[quadroSheetName]) : [];

      const certParsed = parseCertificadoRows(certRows);
      const quadroParsed = parseQuadroRows(quadroRows);
      const parsed = mergeParsed(file, certParsed, quadroParsed);

      if (parsed.brandModel && isLikelyLabelValue(parsed.brandModel)) parsed.brandModel = undefined;
      if (parsed.hruValue && isLikelyLabelValue(parsed.hruValue)) parsed.hruValue = undefined;
      if (parsed.serviceStation && isLikelyLabelValue(parsed.serviceStation)) parsed.serviceStation = undefined;

      const filenameShip = parseFilenameShipName(file);
      if (parsed.shipName && isLikelyLabelValue(parsed.shipName)) {
        parsed.shipName = undefined;
      }

      if (!parsed.shipName && filenameShip) {
        parsed.shipName = filenameShip;
        parsed.sourceShipName = 'filename';
      }

      report.processed += 1;
      if (report.sample.length < 30) report.sample.push(parsed);

      let shipMatch = findBestMatch(navioMatch, parsed.shipName);
      if (!shipMatch && parsed.shipName) {
        const createdNavio = await prisma.navio.create({
          data: {
            nome: parsed.shipName,
            matricula: 'N/D',
            ilha: 'N/D',
            tipoPesca: 'N/D',
          },
          select: { id: true, nome: true },
        });
        shipMatch = createdNavio;
        navioMatch.byNorm.set(normalizeCompact(createdNavio.nome), createdNavio);
        report.shipsCreated += 1;
      }

      if (shipMatch) {
        report.shipsMatched += 1;
      }

      let clienteId: number | null = null;
      const owner = safeString(parsed.ownerName);
      if (owner && !isLikelyFooterOwner(owner)) {
        const clienteFound = findBestMatch(clienteMatch, owner);
        if (clienteFound) {
          clienteId = clienteFound.id;
          report.clientsMatched += 1;
        } else {
          const createdCliente = await prisma.cliente.create({ data: { nome: owner }, select: { id: true, nome: true } });
          clienteMatch.byNorm.set(normalizeCompact(createdCliente.nome), createdCliente);
          clienteId = createdCliente.id;
          report.clientsCreated += 1;
        }
      }

      if (shipMatch) {
        const current = await prisma.navio.findUnique({ where: { id: shipMatch.id }, select: { clienteId: true } });
        if (clienteId && current && current.clienteId !== clienteId) {
          await prisma.navio.update({ where: { id: shipMatch.id }, data: { clienteId } });
          report.shipClientLinksUpdated += 1;
        }
        if (!clienteId && current?.clienteId) {
          clienteId = current.clienteId;
        }
      }

      const serial = safeString(parsed.raftSerial);
      if (!serial) {
        report.raftsSkippedNoSerial += 1;
        report.unresolved.push({ file, reason: 'Sem número de série da jangada', ship: parsed.shipName, owner, serial });
        continue;
      }

      const { brand, model } = splitBrandModel(parsed.brandModel);
      const ownerField = owner || (clienteId ? (await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } }))?.nome : '') || 'N/D';

      await prisma.jangada.upsert({
        where: { serial },
        create: {
          brand,
          model,
          serial,
          dataFabrico: parsed.dateManuf ?? 'N/D',
          packType: parsed.emergencyPackType ?? 'N/D',
          capacity: parsed.capacity ?? 0,
          owner: ownerField || 'N/D',
          shipId: shipMatch?.id ?? null,
          shipNameManual: parsed.shipName || null,
          dataInspecao: parsed.inspectionDate,
          dataProxInspecao: parsed.nextInspectionDate,
          cylinderSerial: safeString(parsed.cylinderSerial) || undefined,
          cylinderCo2: safeString(parsed.co2Charge) || undefined,
          cylinderN2: safeString(parsed.n2Charge) || undefined,
          cylinderDataTeste: safeString(parsed.hydTest) || undefined,
          hruValidade: safeString(parsed.hruValue) || undefined,
        },
        update: {
          brand,
          model,
          dataFabrico: parsed.dateManuf ?? undefined,
          packType: parsed.emergencyPackType ?? undefined,
          capacity: parsed.capacity ?? undefined,
          owner: ownerField || undefined,
          shipId: shipMatch?.id ?? undefined,
          shipNameManual: parsed.shipName || null,
          dataInspecao: parsed.inspectionDate,
          dataProxInspecao: parsed.nextInspectionDate,
          cylinderSerial: safeString(parsed.cylinderSerial) || undefined,
          cylinderCo2: safeString(parsed.co2Charge) || undefined,
          cylinderN2: safeString(parsed.n2Charge) || undefined,
          cylinderDataTeste: safeString(parsed.hydTest) || undefined,
          hruValidade: safeString(parsed.hruValue) || undefined,
        },
      });

      report.raftsUpserted += 1;

      if (!shipMatch) {
        report.unresolved.push({ file, reason: 'Navio não associado', ship: parsed.shipName, owner, serial });
      }
    }

    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

    console.log('Importação concluída.');
    console.log(`Ficheiros processados: ${report.processed}/${report.fileCount}`);
    console.log(`Navios associados: ${report.shipsMatched} (criados: ${report.shipsCreated})`);
    console.log(`Clientes associados: ${report.clientsMatched} (criados: ${report.clientsCreated})`);
    console.log(`Ligação navio-cliente atualizada: ${report.shipClientLinksUpdated}`);
    console.log(`Jangadas inseridas/atualizadas: ${report.raftsUpserted}`);
    console.log(`Jangadas sem série: ${report.raftsSkippedNoSerial}`);
    console.log(`Relatório: ${path.relative(process.cwd(), REPORT_FILE)}`);
  }

  main()
    .catch((error) => {
      console.error('Erro na importação:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
    for (let c = 0; c < row.length; c++) {
      const current = normalizeText(row[c]);
      if (!current) continue;
      if (labelsNorm.some((ln) => current === ln || current.startsWith(`${ln} `))) {
        return { r, c };
      }
    }
  }
  return null;
}

function valueNear(rows: Matrix, pos: { r: number; c: number } | null): string {
  if (!pos) return '';
  const candidates = [
    getCell(rows, pos.r, pos.c + 1),
    getCell(rows, pos.r, pos.c + 2),
    getCell(rows, pos.r + 1, pos.c),
    getCell(rows, pos.r + 1, pos.c + 1),
    getCell(rows, pos.r + 2, pos.c),
    getCell(rows, pos.r + 2, pos.c + 1),
  ].map(safeString);

  for (const value of candidates) {
    if (!value) continue;
    if (isLikelyLabelValue(value)) continue;
    return value;
  }
  return '';
}

function valueRight(rows: Matrix, labels: string[], maxRow?: number): string {
  const pos = findLabel(rows, labels, maxRow);
  if (!pos) return '';
  const candidates = [
    getCell(rows, pos.r, pos.c + 1),
    getCell(rows, pos.r, pos.c + 2),
  ].map(safeString);
  return candidates.find((v) => v && !isLikelyLabelValue(v)) ?? '';
}

function valueDown(rows: Matrix, labels: string[], maxRow?: number): string {
  const pos = findLabel(rows, labels, maxRow);
  if (!pos) return '';
  const candidates = [
    getCell(rows, pos.r + 1, pos.c),
    getCell(rows, pos.r + 1, pos.c + 1),
    getCell(rows, pos.r + 2, pos.c),
    getCell(rows, pos.r + 2, pos.c + 1),
  ].map(safeString);
  return candidates.find((v) => v && !isLikelyLabelValue(v)) ?? '';
}

function parseDate(raw: string): string | undefined {
  const v = safeString(raw);
  if (!v) return undefined;

  const dateObj = new Date(v);
  if (!Number.isNaN(dateObj.getTime())) {
    const y = dateObj.getFullYear();
    const m = `${dateObj.getMonth() + 1}`.padStart(2, '0');
    const d = `${dateObj.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const m1 = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m1) {
    const d = m1[1].padStart(2, '0');
    const m = m1[2].padStart(2, '0');
    const y = m1[3].length === 2 ? `20${m1[3]}` : m1[3];
    return `${y}-${m}-${d}`;
  }

  const m2 = v.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (m2) {
    const m = m2[1].padStart(2, '0');
    return `${m2[2]}-${m}-01`;
  }

  return undefined;
}

function parseIntLoose(raw: string): number | undefined {
  const clean = safeString(raw).replace(',', '.');
  if (!clean) return undefined;
  const m = clean.match(/\d+/);
  if (!m) return undefined;
  const n = Number.parseInt(m[0], 10);
  if (Number.isNaN(n)) return undefined;
  return n;
}

function parseFilenameShipName(fileName: string): string {
  const base = fileName.replace(/\.xlsx$/i, '');
  const cleaned = base.replace(/^AZ\d{2}-\d+\s*/i, '');
  return cleaned.trim();
}

function extractValueAfterSeparator(cell: string): string {
  const raw = safeString(cell);
  const m = raw.match(/[:\-]\s*(.+)$/);
  if (!m) return '';
  return safeString(m[1]);
}

function findFallbackValue(
  rows: Matrix,
  labelMatch: (normalizedCell: string) => boolean,
  isValidValue: (candidate: string) => boolean,
): string {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const rawCell = safeString(row[c]);
      const normalizedCell = normalizeText(rawCell);
      if (!normalizedCell || !labelMatch(normalizedCell)) continue;

      const candidates = [
        extractValueAfterSeparator(rawCell),
        safeString(getCell(rows, r, c + 1)),
        safeString(getCell(rows, r, c + 2)),
        safeString(getCell(rows, r, c + 3)),
        safeString(getCell(rows, r + 1, c)),
        safeString(getCell(rows, r + 1, c + 1)),
        safeString(getCell(rows, r + 1, c + 2)),
        safeString(getCell(rows, r + 2, c)),
        safeString(getCell(rows, r + 2, c + 1)),
      ];

      for (const candidate of candidates) {
        if (!candidate || isLikelyLabelValue(candidate)) continue;
        if (isValidValue(candidate)) return candidate;
      }
    }
  }

  return '';
}

function isLikelyCylinderSerial(value: string): boolean {
  const text = safeString(value);
  if (!text) return false;
  if (parseDate(text)) return false;
  const compact = text.replace(/[^A-Z0-9]/gi, '');
  return compact.length >= 4 && /[A-Z]/i.test(compact) && /\d/.test(compact);
}

function parseQuadroRows(rows: Matrix): Partial<ParsedCert> {
  const out: Partial<ParsedCert> = {};

  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      const cell = safeString(row[c]);
      if (!cell) continue;
      const n = normalizeText(cell);

      if (n === 'OBRA N' || n === 'OBRA NO' || n === 'OBRA Nº') {
        const v = safeString(row[c + 1]);
        if (v) out.certNo = v;
      }

      if (n === 'CERT N' || n === 'CERT NO' || n === 'CERT Nº') {
        const v = safeString(row[c + 1]);
        if (v && !out.certNo) out.certNo = v;
      }

      if (n === 'JANGADA') {
        const v = safeString(row[c + 1]);
        if (v) out.raftSerial = v;
      }

      if (n === 'NAVIO' || n === 'SHIP') {
        const v = safeString(row[c + 1]);
        if (v && normalizeText(v) !== 'BRAND TYPE') {
          out.shipName = v;
          out.sourceShipName = 'quadro';
        }
      }

      if (n === 'MARCA MODELO' || n === 'BRAND TYPE') {
        const v = safeString(row[c + 1]);
        if (v) out.brandModel = v;
      }

      if (n.includes('LOTACAO') || n.includes('LOTAÇÃO') || n === 'CAPACITY' || n === 'CAPACIDADE') {
        const v = safeString(row[c + 1]);
        const parsed = parseIntLoose(v);
        if (parsed) out.capacity = parsed;
      }

      if (n.includes('DATA FABR') || n.includes('DATE OF MANUF') || n.includes('DATE MANUF')) {
        const v = safeString(row[c + 1]);
        const parsed = parseDate(v);
        if (parsed) out.dateManuf = parsed;
      }

      if (n === 'CARGA CO2' || n === 'CO2 CHARGE') {
        const v = safeString(row[c + 1]);
        if (v) out.co2Charge = v;
      }

      if (n === 'CARGA N2' || n === 'N2 CHARGE') {
        const v = safeString(row[c + 1]);
        if (v) out.n2Charge = v;
      }

      if (n === 'HYD TEST' || n === 'TESTE HID') {
        const v = safeString(row[c + 1]);
        if (v) out.hydTest = v;
      }

      if (n === 'CYL NO' || n === 'CIL Nº' || n === 'CIL N' || n === 'CYLINDERS CO2') {
        const v = safeString(row[c + 1]);
        if (v && /[A-Z0-9]/i.test(v)) out.cylinderSerial = v;
      }

      if (n === 'EMERGENCY PACK TYPE') {
        const v = safeString(row[c + 1]);
        if (v) out.emergencyPackType = v;
      }
    }
  }

  if (!out.capacity) {
    const capacityFallback = findFallbackValue(
      rows,
      (n) => n.includes('LOTACAO') || n.includes('LOTAÇÃO') || n === 'CAPACITY' || n === 'CAPACIDADE',
      (candidate) => {
        const parsed = parseIntLoose(candidate);
        return typeof parsed === 'number' && parsed > 0 && parsed <= 200;
      },
    );
    const parsedCapacity = parseIntLoose(capacityFallback);
    if (parsedCapacity) out.capacity = parsedCapacity;
  }

  if (!out.dateManuf) {
    const dateManufFallback = findFallbackValue(
      rows,
      (n) => n.includes('DATA FABR') || n.includes('DATE OF MANUF') || n.includes('DATE MANUF') || n.includes('MANUF. DATE'),
      (candidate) => Boolean(parseDate(candidate)),
    );
    const parsedDate = parseDate(dateManufFallback);
    if (parsedDate) out.dateManuf = parsedDate;
  }

  if (!out.cylinderSerial) {
    const cylinderFallback = findFallbackValue(
      rows,
      (n) => n.includes('CYL NO') || n.includes('CIL Nº') || n.includes('CIL N') || n.includes('CYLINDERS CO2') || n.includes('SERIAL NO') || n.includes('NO SERIE'),
      isLikelyCylinderSerial,
    );
    if (cylinderFallback) out.cylinderSerial = cylinderFallback;
  }

  return out;
}

function parseCertificadoRows(rows: Matrix): Partial<ParsedCert> {
  const out: Partial<ParsedCert> = {};

  const certNo = valueRight(rows, ['Certificate No.:', 'Certificado No.:']);
  if (certNo) out.certNo = certNo;

  const certNoAnterior = valueRight(rows, ['Certificado No.:']);
  if (certNoAnterior && certNoAnterior !== certNo) out.certNoAnterior = certNoAnterior;

  out.shipName = valueRight(rows, ['Name of Ship:', 'Nome do navio']);
  if (out.shipName) out.sourceShipName = 'certificado';

  out.ownerName = valueRight(rows, ['Ship owner:', 'Armador:']);
  if (out.ownerName && isLikelyFooterOwner(out.ownerName)) out.ownerName = undefined;

  out.flag = valueRight(rows, ['Flag of Ship:', 'Nacionalidade:']);

  const raftSerialTop = valueDown(rows, ['Serial No.', 'No. Série:'], 20);
  if (raftSerialTop) out.raftSerial = raftSerialTop;

  const type = valueDown(rows, ['Type:', 'Tipo:'], 20);
  if (type) out.brandModel = type;

  const capacityRaw =
    valueDown(rows, ['Capacity:', 'Capacidade:'], 20) ||
    valueNear(rows, findLabel(rows, ['Capacity:', 'Capacidade:', 'Capacidade'], 35)) ||
    valueRight(rows, ['Capacity:', 'Capacidade:', 'Capacidade'], 35);
  out.capacity = parseIntLoose(capacityRaw);

  const dateManufRaw =
    valueDown(rows, ['Date of Manuf.:', 'Data de Fabr.:', 'Data de fabrico:'], 35) ||
    valueNear(rows, findLabel(rows, ['Date of Manuf.:', 'Data de Fabr.:', 'Data de fabrico:', 'Date of manufacture:'], 40)) ||
    valueRight(rows, ['Date of Manuf.:', 'Data de Fabr.:', 'Data de fabrico:', 'Date of manufacture:'], 40);
  out.dateManuf = parseDate(dateManufRaw);

  out.inspectionDate = parseDate(valueDown(rows, ['Date of inspection:', 'Data da inspecção:']));
  out.nextInspectionDate = parseDate(valueDown(rows, ['Date next inspection:', 'Data da próxima inspecção:']));

  out.serviceStation = valueDown(rows, ['Service station name and No.', 'Nome e No. da Estação de Serviço']);

  const hruRaw = valueDown(rows, ['HRU test:', 'Teste do Hidróstatico:']) || valueRight(rows, ['HRU test:', 'Teste do Hidróstatico:']);
  out.hruValue = parseDate(hruRaw) ?? hruRaw;

  out.co2Charge = valueDown(rows, ['Contents CO2', 'Quantidade de Co2']);
  out.n2Charge = valueDown(rows, ['Contents N2', 'Quantidade de N2']);
  out.hydTest = valueDown(rows, ['Latest hyd. Test', 'Último teste hidráulico']);

  const cylHeader = findLabel(rows, ['Cilindros:', 'Cylinders:']);
  let cylSerial = '';
  if (cylHeader) {
    for (let c = cylHeader.c; c < cylHeader.c + 6; c++) {
      const maybeLabel = normalizeText(getCell(rows, cylHeader.r, c));
      if (maybeLabel === 'NO SERIE' || maybeLabel === 'SERIAL NO') {
        const candidate = safeString(getCell(rows, cylHeader.r + 1, c));
        if (candidate && !isLikelyLabelValue(candidate)) {
          cylSerial = candidate;
        }
      }
    }
    if (cylSerial) out.cylinderSerial = cylSerial;
  }

  if (!out.dateManuf) {
    const dateManufFallback = findFallbackValue(
      rows,
      (n) => n.includes('DATE OF MANUF') || n.includes('DATE OF MANUFACTURE') || n.includes('DATA DE FABR') || n.includes('DATA DE FABRICO'),
      (candidate) => Boolean(parseDate(candidate)),
    );
    const parsedDate = parseDate(dateManufFallback);
    if (parsedDate) out.dateManuf = parsedDate;
  }

  if (!out.cylinderSerial) {
    const cylinderFallback = findFallbackValue(
      rows,
      (n) => n.includes('CYL NO') || n.includes('CIL Nº') || n.includes('CIL N') || n.includes('CYLINDERS CO2') || n.includes('SERIAL NO') || n.includes('NO SERIE'),
      isLikelyCylinderSerial,
    );
    if (cylinderFallback) out.cylinderSerial = cylinderFallback;
  }

  return out;
}

  const report = {
    timestamp: new Date().toISOString(),
    fileCount: allFiles.length,
    processed: 0,
    shipsMatched: 0,
    shipsCreated: 0,
    clientsMatched: 0,
    clientsCreated: 0,
    shipClientLinksUpdated: 0,
    raftsUpserted: 0,
    raftsSkippedNoSerial: 0,
    unresolved: [] as Array<{ file: string; reason: string; ship?: string; owner?: string; serial?: string }>,
    sample: [] as ParsedCert[],
  };

  for (const file of allFiles) {
    const filePath = path.join(CERTIFICADOS_DIR, file);
    const wb = XLSX.readFile(filePath, { cellDates: true });

    const certSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'CERTIFICADO') ?? wb.SheetNames[0];
    const quadroSheetName = wb.SheetNames.find((s) => normalizeText(s) === 'QUADRO');

    const certRows = certSheetName ? toMatrix(wb.Sheets[certSheetName]) : [];
    const quadroRows = quadroSheetName ? toMatrix(wb.Sheets[quadroSheetName]) : [];

    const certParsed = parseCertificadoRows(certRows);
    const quadroParsed = parseQuadroRows(quadroRows);
    const parsed = mergeParsed(file, certParsed, quadroParsed);

    if (parsed.brandModel && isLikelyLabelValue(parsed.brandModel)) parsed.brandModel = undefined;
    if (parsed.hruValue && isLikelyLabelValue(parsed.hruValue)) parsed.hruValue = undefined;
    if (parsed.serviceStation && isLikelyLabelValue(parsed.serviceStation)) parsed.serviceStation = undefined;

    const filenameShip = parseFilenameShipName(file);
    if (parsed.shipName && isLikelyLabelValue(parsed.shipName)) {
      parsed.shipName = undefined;
    }

    if (!parsed.shipName && filenameShip) {
      parsed.shipName = filenameShip;
      parsed.sourceShipName = 'filename';
    }

    report.processed += 1;
    if (report.sample.length < 30) report.sample.push(parsed);

    let shipMatch = findBestMatch(navioMatch, parsed.shipName);
    if (!shipMatch && parsed.shipName) {
      const createdNavio = await prisma.navio.create({
        data: {
          nome: parsed.shipName,
          matricula: 'N/D',
          ilha: 'N/D',
          tipoPesca: 'N/D',
        },
        select: { id: true, nome: true },
      });
      shipMatch = createdNavio;
      navioMatch.byNorm.set(normalizeCompact(createdNavio.nome), createdNavio);
      report.shipsCreated += 1;
    }

    if (shipMatch) {
      report.shipsMatched += 1;
    }

    let clienteId: number | null = null;
    const owner = safeString(parsed.ownerName);
    if (owner && !isLikelyFooterOwner(owner)) {
      const clienteFound = findBestMatch(clienteMatch, owner);
      if (clienteFound) {
        clienteId = clienteFound.id;
        report.clientsMatched += 1;
      } else {
        const createdCliente = await prisma.cliente.create({ data: { nome: owner }, select: { id: true, nome: true } });
        clienteMatch.byNorm.set(normalizeCompact(createdCliente.nome), createdCliente);
        clienteId = createdCliente.id;
        report.clientsCreated += 1;
      }
    }

    if (shipMatch) {
      const current = await prisma.navio.findUnique({ where: { id: shipMatch.id }, select: { clienteId: true } });
      if (clienteId && current && current.clienteId !== clienteId) {
        await prisma.navio.update({ where: { id: shipMatch.id }, data: { clienteId } });
        report.shipClientLinksUpdated += 1;
      }
      if (!clienteId && current?.clienteId) {
        clienteId = current.clienteId;
      }
    }

    const serial = safeString(parsed.raftSerial);
    if (!serial) {
      report.raftsSkippedNoSerial += 1;
      report.unresolved.push({ file, reason: 'Sem número de série da jangada', ship: parsed.shipName, owner, serial });
      continue;
    }

    const { brand, model } = splitBrandModel(parsed.brandModel);
    const ownerField = owner || (clienteId ? (await prisma.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } }))?.nome : '') || 'N/D';

    await prisma.jangada.upsert({
      where: { serial },
      create: {
        brand,
        model,
        serial,
        dataFabrico: parsed.dateManuf ?? 'N/D',
        packType: parsed.emergencyPackType ?? 'N/D',
        capacity: parsed.capacity ?? 0,
        owner: ownerField || 'N/D',
        shipId: shipMatch?.id ?? null,
        shipNameManual: parsed.shipName || null,
        dataInspecao: parsed.inspectionDate,
        dataProxInspecao: parsed.nextInspectionDate,
        cylinderSerial: safeString(parsed.cylinderSerial) || undefined,
        cylinderCo2: safeString(parsed.co2Charge) || undefined,
        cylinderN2: safeString(parsed.n2Charge) || undefined,
        cylinderDataTeste: safeString(parsed.hydTest) || undefined,
        hruValidade: safeString(parsed.hruValue) || undefined,
      },
      update: {
        brand,
        model,
        dataFabrico: parsed.dateManuf ?? undefined,
        packType: parsed.emergencyPackType ?? undefined,
        capacity: parsed.capacity ?? undefined,
        owner: ownerField || undefined,
        shipId: shipMatch?.id ?? undefined,
        shipNameManual: parsed.shipName || null,
        dataInspecao: parsed.inspectionDate,
        dataProxInspecao: parsed.nextInspectionDate,
        cylinderSerial: safeString(parsed.cylinderSerial) || undefined,
        cylinderCo2: safeString(parsed.co2Charge) || undefined,
        cylinderN2: safeString(parsed.n2Charge) || undefined,
        cylinderDataTeste: safeString(parsed.hydTest) || undefined,
        hruValidade: safeString(parsed.hruValue) || undefined,
      },
    });

    report.raftsUpserted += 1;

    if (!shipMatch) {
      report.unresolved.push({ file, reason: 'Navio não associado', ship: parsed.shipName, owner, serial });
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('Importação concluída.');
  console.log(`Ficheiros processados: ${report.processed}/${report.fileCount}`);
  console.log(`Navios associados: ${report.shipsMatched} (criados: ${report.shipsCreated})`);
  console.log(`Clientes associados: ${report.clientsMatched} (criados: ${report.clientsCreated})`);
  console.log(`Ligação navio-cliente atualizada: ${report.shipClientLinksUpdated}`);
  console.log(`Jangadas inseridas/atualizadas: ${report.raftsUpserted}`);
  console.log(`Jangadas sem série: ${report.raftsSkippedNoSerial}`);
  console.log(`Relatório: ${path.relative(process.cwd(), REPORT_FILE)}`);
}

main()
  .catch((error) => {
    console.error('Erro na importação:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
