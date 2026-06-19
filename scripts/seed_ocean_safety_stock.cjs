const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// GBP -> EUR conversion rate (March 2026)
const GBP_EUR_RATE = 1.18;

function toEur(gbp) {
  if (gbp === null || gbp === undefined) return null;
  return Math.round(gbp * GBP_EUR_RATE * 100) / 100;
}

// Map Ocean Safety category to internal categoria
function mapCategory(cat) {
  if (!cat) return "Peças Jangada";
  const c = cat.toLowerCase();
  if (c.includes("service kit") || c.includes("compact liferaft") || c.includes("throw-over") || c.includes("dl/sr") || c.includes("iso") || c.includes("charter") || c.includes("standard liferaft")) return "Peças Jangada";
  if (c.includes("emergency equipment")) return "Equipamento de Emergência";
  if (c.includes("literature")) return "Documentação";
  if (c.includes("servicing tools") || c.includes("tools")) return "Ferramentas";
  if (c.includes("jonbuoy") || c.includes("horseshoe") || c.includes("rescue") || c.includes("danbuoy")) return "Equipamento Salvatagem";
  return "Peças Jangada";
}

async function main() {
  const itemsPath = path.resolve(__dirname, "../documentacao/ocean_safety_items.json");
  const imageMapPath = path.resolve(__dirname, "../documentacao/ocean_safety_image_map.json");

  if (!fs.existsSync(itemsPath)) throw new Error("ocean_safety_items.json not found. Run the Python extractor first.");

  const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  const imageMap = fs.existsSync(imageMapPath) ? JSON.parse(fs.readFileSync(imageMapPath, "utf-8")) : {};

  console.log(`Processing ${items.length} Ocean Safety items…`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    // referencia = OSL part number (unique key)
    const referencia = item.partNo;
    const precoCompraEur = toEur(item.stnPriceGBP);
    const precoVendaEur = toEur(item.rrpGBP);

    // precoVenda is required in schema (non-nullable); fallback to precoCompra if RRP is missing
    const precoVendaFinal = precoVendaEur ?? precoCompraEur ?? 0;

    const foto = imageMap[item.partNo] || null;
    const categoria = mapCategory(item.category);

    const data = {
      descricao: item.description,
      codigoFabricante: item.partNo,
      categoria,
      precoCompra: precoCompraEur,
      precoVenda: precoVendaFinal,
      quantidadeMinima: item.minStock ?? null,
      foto,
      estadoArtigo: "ATIVO",
      associavelJangada: categoria === "Peças Jangada",
      aplicavelMarcaJangada: "Ocean Safety",
      observacoes: item.category ? `Categoria catálogo: ${item.category}` : null,
    };

    try {
      const existing = await prisma.stock.findUnique({ where: { referencia } });

      if (existing) {
        await prisma.stock.update({
          where: { referencia },
          data,
        });
        updated++;
      } else {
        await prisma.stock.create({
          data: { referencia, quantidade: 0, ...data },
        });
        created++;
      }
    } catch (e) {
      console.error(`  ✗ ${referencia}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done:`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors:  ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
