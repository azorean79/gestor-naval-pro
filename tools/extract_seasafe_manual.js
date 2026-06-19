const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const inputPath = path.resolve(process.cwd(), 'manuais', 'seasafe', 'seasafe.pdf');
const outputPath = path.resolve(process.cwd(), 'tools', 'seasafe-manual-extracted.txt');

(async () => {
  const parser = new PDFParse({ data: fs.readFileSync(inputPath) });
  const result = await parser.getText();
  const content = [
    `PAGES: ${result.total ?? 'unknown'}`,
    '',
    result.text || '',
  ].join('\n');
  fs.writeFileSync(outputPath, content, 'utf8');
  if (typeof parser.destroy === 'function') {
    await parser.destroy();
  }
  console.log(outputPath);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
