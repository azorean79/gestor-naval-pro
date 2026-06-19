import * as fs from 'fs';
import * as path from 'path';

type Entry = {
  cfr: string;
  conjIdent: string;
  nome: string;
  ilha: string;
};

function canonicalIlha(raw: string): string {
  const n = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(ilha|do|da|de|das|dos)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (n.includes('corvo')) return 'Corvo';
  if (n.includes('flores')) return 'Flores';
  if (n.includes('faial')) return 'Faial';
  if (n.includes('pico')) return 'Pico';
  if (n.includes('sao jorge')) return 'São Jorge';
  if (n.includes('graciosa')) return 'Graciosa';
  if (n.includes('terceira')) return 'Terceira';
  if (n.includes('sao miguel')) return 'São Miguel';
  if (n.includes('santa maria')) return 'Santa Maria';

  return raw.trim();
}

function escapeCsv(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function cleanNome(value: string): string {
  return value
    .replace(/II\s+S[ÉE]RIE\s+N\.º\s*\d+[\s\S]*$/i, '')
    .replace(/PRESID[ÊE]NCIA\s+DO\s+GOVERNO\s+REGIONAL\s+DOS\s+A[ÇC]ORES[\s\S]*$/i, '')
    .replace(/CENTRO\s+DE\s+EDI[ÇC][ÃA]O\s+DO\s+JORNAL\s+OFICIAL[\s\S]*$/i, '')
    .replace(/HTTP:\/\/JO\.AZORES\.GOV\.PT[\s\S]*$/i, '')
    .replace(/CEJO@AZORES\.GOV\.PT[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const workspaceRoot = process.cwd();
  const inputPath = path.join(workspaceRoot, 'tmp_2025_II_despacho_extracted.txt');
  const outputJsonPath = path.join(workspaceRoot, 'tmp_2025_II_embarcacoes_por_ilha.json');
  const outputCsvPath = path.join(workspaceRoot, 'tmp_2025_II_embarcacoes_por_ilha.csv');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Ficheiro não encontrado: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  const entries: Entry[] = [];
  let currentIlha: string | null = null;
  let lastEntry: Entry | null = null;

  const ilhaHeaderRegex = /^Embarcações de pesca da ilha\s+(.+)$/i;
  const entryRegex = /^(PRT\d{9})\s+([A-Z]{5}\s*-\d{6}-[LC])\s+(.+)$/i;
  const ignorableRegex = /^(II SÉRIE|PRESIDÊNCIA DO GOVERNO REGIONAL DOS AÇORES|CENTRO DE EDIÇÃO DO JORNAL OFICIAL|HTTP:\/\/JO\.AZORES\.GOV\.PT|CEJO@AZORES\.GOV\.PT|ANEXO|CFR\s+Conj\.\s+Ident\.\s+Nome)$/i;

  for (const line of lines) {
    if (ignorableRegex.test(line)) {
      continue;
    }

    const ilhaMatch = line.match(ilhaHeaderRegex);
    if (ilhaMatch) {
      currentIlha = canonicalIlha(ilhaMatch[1]);
      lastEntry = null;
      continue;
    }

    if (!currentIlha) {
      continue;
    }

    const entryMatch = line.match(entryRegex);
    if (entryMatch) {
      const [, cfr, conjIdentRaw, nomeRaw] = entryMatch;
      const conjIdent = conjIdentRaw.replace(/\s+/g, '');
      const entry: Entry = {
        cfr,
        conjIdent,
        nome: cleanNome(nomeRaw.trim()),
        ilha: currentIlha,
      };
      entries.push(entry);
      lastEntry = entry;
      continue;
    }

    if (
      lastEntry &&
      !/^PRT\d{9}/i.test(line) &&
      !line.startsWith('Embarcações de pesca da ilha') &&
      !/^CFR\s+Conj\.\s+Ident\.\s+Nome$/i.test(line) &&
      !/^II\s+S[ÉE]RIE\s+N\.º/i.test(line) &&
      !/^PRESID[ÊE]NCIA\s+DO\s+GOVERNO\s+REGIONAL\s+DOS\s+A[ÇC]ORES/i.test(line) &&
      !/^CENTRO\s+DE\s+EDI[ÇC][ÃA]O\s+DO\s+JORNAL\s+OFICIAL/i.test(line) &&
      !/^HTTP:\/\/JO\.AZORES\.GOV\.PT/i.test(line) &&
      !/^CEJO@AZORES\.GOV\.PT/i.test(line)
    ) {
      lastEntry.nome = cleanNome(`${lastEntry.nome} ${line}`.replace(/\s+/g, ' ').trim());
    }
  }

  const ordered = [...entries].sort((a, b) => {
    const byIlha = a.ilha.localeCompare(b.ilha, 'pt');
    if (byIlha !== 0) return byIlha;
    const byNome = a.nome.localeCompare(b.nome, 'pt');
    if (byNome !== 0) return byNome;
    return a.cfr.localeCompare(b.cfr, 'pt');
  });

  const grouped: Record<string, { total: number; embarcacoes: Array<{ cfr: string; conjIdent: string; nome: string }> }> = {};
  for (const e of ordered) {
    if (!grouped[e.ilha]) {
      grouped[e.ilha] = { total: 0, embarcacoes: [] };
    }
    grouped[e.ilha].embarcacoes.push({ cfr: e.cfr, conjIdent: e.conjIdent, nome: e.nome });
    grouped[e.ilha].total += 1;
  }

  const resumo = Object.entries(grouped)
    .map(([ilha, data]) => ({ ilha, total: data.total }))
    .sort((a, b) => a.ilha.localeCompare(b.ilha, 'pt'));

  fs.writeFileSync(
    outputJsonPath,
    JSON.stringify(
      {
        source: '2025-II-Despacho-2025-09-17.pdf',
        totalEmbarcacoes: ordered.length,
        totalIlhas: resumo.length,
        resumo,
        porIlha: grouped,
      },
      null,
      2,
    ),
    'utf8',
  );

  const csvHeader = 'ilha;cfr;conjIdent;nome';
  const csvRows = ordered.map((e) => [e.ilha, e.cfr, e.conjIdent, e.nome].map(escapeCsv).join(';'));
  fs.writeFileSync(outputCsvPath, [csvHeader, ...csvRows].join('\n'), 'utf8');

  console.log(`Total embarcações extraídas: ${ordered.length}`);
  for (const r of resumo) {
    console.log(`- ${r.ilha}: ${r.total}`);
  }
  console.log(`JSON: ${outputJsonPath}`);
  console.log(`CSV: ${outputCsvPath}`);
}

main();
