import * as fs from 'fs';
import * as path from 'path';

function main() {
  const inputPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_prioridade.csv');
  const outputPath = path.join(process.cwd(), 'tmp_clientes_sem_ilha_com_navios_para_preencher.csv');

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    console.error('Input CSV is empty.');
    process.exit(1);
  }

  const header = lines[0];
  const newHeader = `${header};ilhaManual;notasRevisao`;
  const outLines = [newHeader];

  for (let i = 1; i < lines.length; i += 1) {
    outLines.push(`${lines[i]};;`);
  }

  fs.writeFileSync(outputPath, outLines.join('\n'), 'utf8');

  console.log(
    JSON.stringify(
      {
        inputFile: inputPath,
        outputFile: outputPath,
        linhasDados: outLines.length - 1,
      },
      null,
      2,
    ),
  );
}

main();
