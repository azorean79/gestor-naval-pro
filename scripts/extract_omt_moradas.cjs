const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function main() {
  const inputPath = process.argv[2] || path.join(process.cwd(), 'OMT - Moradas.pdf');
  const data = fs.readFileSync(inputPath);
  const parser = new PDFParse({ data });

  try {
    const result = await parser.getText();
    process.stdout.write(result.text);
  } finally {
    await parser.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
