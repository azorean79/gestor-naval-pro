// Sincroniza schema.prisma → schema.sqlite.prisma
// Ambos usam SQLite com o mesmo generator/datasource.
// O schema.prisma é a fonte de verdade; este script replica alterações para schema.sqlite.prisma.

const fs = require("fs");
const path = require("path");

const prismaDir = path.resolve(__dirname, "../prisma");
const src = path.join(prismaDir, "schema.prisma");
const dst = path.join(prismaDir, "schema.sqlite.prisma");

if (!fs.existsSync(src)) {
  console.error("schema.prisma não encontrado em", src);
  process.exit(1);
}

const content = fs.readFileSync(src, "utf8");

// Validar que é schema sqlite
if (!content.includes('provider = "sqlite"')) {
  console.error("AVISO: schema.prisma não usa provider sqlite — ignorando sync.");
  process.exit(0);
}

fs.writeFileSync(dst, content, "utf8");

// Verificar
const dstContent = fs.readFileSync(dst, "utf8");
const srcLines = content.split("\n").length;
const dstLines = dstContent.split("\n").length;

if (srcLines === dstLines && content === dstContent) {
  console.log(`✓ schema.sqlite.prisma sincronizado (${srcLines} linhas)`);
} else {
  console.error("✗ Sincronização falhou — linhas divergem");
  process.exit(1);
}
