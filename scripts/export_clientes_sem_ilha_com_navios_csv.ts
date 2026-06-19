import * as fs from 'fs';
import * as path from 'path';

type Row = {
  clienteId: number;
  nome: string;
  nif: string | null;
  morada: string | null;
  naviosCount: number;
  priority: string;
  suggestedIlha: string | null;
  suggestionScore: number;
  navios: Array<{
    navioId: number;
    nome: string;
    matricula: string;
    ilhaAtual: string;
  }>;
};

function csvEscape(value: string | number | null | undefined): string {
  const v = value == null ? '' : String(value);
  if (/[",\n\r;]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function main() {
  const inputPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_prioridade.json');
  const outputPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_prioridade.csv');

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw) as { all: Row[] };
  const rows = parsed.all ?? [];

  const header = [
    'clienteId',
    'clienteNome',
    'nif',
    'morada',
    'naviosCount',
    'priority',
    'suggestedIlha',
    'suggestionScore',
    'navioId',
    'navioNome',
    'matricula',
    'ilhaAtual',
    'observacao',
  ];

  const lines: string[] = [];
  lines.push(header.join(';'));

  for (const r of rows) {
    if (!r.navios || r.navios.length === 0) {
      const line = [
        r.clienteId,
        r.nome,
        r.nif,
        r.morada,
        r.naviosCount,
        r.priority,
        r.suggestedIlha,
        r.suggestionScore,
        '',
        '',
        '',
        '',
        'Cliente sem navios na lista',
      ]
        .map(csvEscape)
        .join(';');
      lines.push(line);
      continue;
    }

    for (const n of r.navios) {
      const observacao = n.matricula === 'N/A' ? 'Matricula em falta (N/A)' : '';
      const line = [
        r.clienteId,
        r.nome,
        r.nif,
        r.morada,
        r.naviosCount,
        r.priority,
        r.suggestedIlha,
        r.suggestionScore,
        n.navioId,
        n.nome,
        n.matricula,
        n.ilhaAtual,
        observacao,
      ]
        .map(csvEscape)
        .join(';');
      lines.push(line);
    }
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

  console.log(
    JSON.stringify(
      {
        inputFile: inputPath,
        outputFile: outputPath,
        clientes: rows.length,
        linhasCsv: Math.max(0, lines.length - 1),
      },
      null,
      2,
    ),
  );
}

main();
