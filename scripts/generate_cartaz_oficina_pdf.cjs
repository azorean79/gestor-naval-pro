const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const sourcePath = path.resolve(process.cwd(), "documentacao", "CARTAZ_OFICINA_ESTACAO_SERVICO_JANGADAS.md");
const targetPath = path.resolve(process.cwd(), "documentacao", "CARTAZ_OFICINA_ESTACAO_SERVICO_JANGADAS.pdf");

function sanitizeMarkdownToLines(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // Headings
      if (/^#{1,6}\s+/.test(trimmed)) {
        return trimmed.replace(/^#{1,6}\s+/, "").replace(/[*_`]/g, "");
      }

      // Horizontal separator
      if (/^---+$/.test(trimmed)) {
        return "────────────────────────────────────────";
      }

      // Keep checkboxes and bullets readable
      return trimmed
        .replace(/^\*\s+/, "• ")
        .replace(/^\-\s+/, "- ")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1");
    });
}

function generatePdf() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Ficheiro não encontrado: ${sourcePath}`);
  }

  const markdown = fs.readFileSync(sourcePath, "utf8");
  const lines = sanitizeMarkdownToLines(markdown);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const marginTop = 14;
  const marginBottom = 14;
  const maxWidth = pageWidth - marginX * 2;

  let y = marginTop;

  const addWrapped = (text, fontSize = 11, isTitle = false) => {
    if (!text) {
      y += 3;
      return;
    }

    doc.setFont("helvetica", isTitle ? "bold" : "normal");
    doc.setFontSize(fontSize);

    const wrapped = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.42 + 1.6;

    for (const line of wrapped) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  };

  addWrapped("CARTAZ DE OFICINA — FLUXO JANGADAS (ESTAÇÃO DE SERVIÇO)", 15, true);
  y += 2;

  for (const line of lines) {
    const isSectionTitle =
      /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9\s()\-]+$/.test(line) &&
      line.length > 0 &&
      line.length <= 80 &&
      !line.startsWith("-") &&
      !line.startsWith("☐") &&
      !line.startsWith("✅") &&
      !line.startsWith("❌");

    addWrapped(line, isSectionTitle ? 12 : 11, isSectionTitle);
  }

  doc.save(targetPath);
  return targetPath;
}

try {
  const out = generatePdf();
  console.log(`PDF gerado com sucesso: ${out}`);
} catch (error) {
  console.error("Falha ao gerar PDF do cartaz:", error);
  process.exit(1);
}
