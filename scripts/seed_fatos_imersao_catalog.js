const { PrismaClient } = require("@prisma/client");
const path = require("path");

const sqlitePath = path.join(__dirname, "..", "prisma", "local.db").replace(/\\/g, "/");
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${sqlitePath}`;
}

const prisma = new PrismaClient();

const modelos = [
  ["Viking", "PS4170"],
  ["Viking", "PS5002"],
  ["Viking", "PS5008"],
  ["Viking", "PS4029"],
  ["Viking", "PS4003"],
  ["Survitec", "Crewsaver 8800"],
  ["Survitec", "Crewsaver 8800Mk2 Endurance Plus"],
  ["Survitec", "Crewsaver 8808 Endurance 140"],
  ["Survitec", "Crewsaver 8810 Endurance"],
  ["Survitec", "Crewsaver 8806 Latitude 140"],
  ["Lalizas", "Neptune Immersion Suit"],
  ["Lalizas", "Immersion Suit"],
  ["Ocean Safety", "Solas Immersion Suit"],
];

const pecas = [
  { referencia: "FI-LUZ-L6", descricao: "Luz emergência L6 / McMurdo", categoria: "FATO_IMERSAO" },
  { referencia: "FI-APITO-MW2", descricao: "Apito MW2", categoria: "FATO_IMERSAO" },
  { referencia: "FI-BUDDY-2M", descricao: "Buddy line 2 m", categoria: "FATO_IMERSAO" },
  { referencia: "FI-TOGGLE", descricao: "Toggle buddy line", categoria: "FATO_IMERSAO" },
  { referencia: "FI-LUVAS-LATEX", descricao: "Luvas látex (par)", categoria: "FATO_IMERSAO" },
  { referencia: "FI-OVERGLOVE", descricao: "Over-glove neoprene", categoria: "FATO_IMERSAO" },
  { referencia: "FI-STROP-U", descricao: "Lifting strop universal", categoria: "FATO_IMERSAO" },
  { referencia: "FI-TAPE-RETRO", descricao: "Fita retro-refletora", categoria: "FATO_IMERSAO" },
  { referencia: "FI-PATCH-NEO", descricao: "Kit patches neoprene", categoria: "FATO_IMERSAO" },
  { referencia: "FI-BEESWAX", descricao: "Beeswax / grease stick zip", categoria: "FATO_IMERSAO" },
  { referencia: "FI-FACE-PLATE", descricao: "Face plate / sealing tool", categoria: "FATO_IMERSAO" },
  { referencia: "FI-KIT-70168", descricao: "Inspection device kit Lalizas 70168", categoria: "FATO_IMERSAO" },
  { referencia: "FI-WRIST-CODAN", descricao: "Wrist seal Codan Viking", categoria: "FATO_IMERSAO" },
  { referencia: "FI-NEO-RIBBON", descricao: "Fita neoprene reparação", categoria: "FATO_IMERSAO" },
];

async function main() {
  for (const [marca, modelo] of modelos) {
    const marcaKey = marca.toLowerCase().replace(/\s+/g, "-");
    const modeloKey = modelo.toLowerCase().replace(/\s+/g, "-");
    await prisma.catalogMarcaModelo.upsert({
      where: {
        tipo_marcaKey_modeloKey: {
          tipo: "FATO_IMERSAO",
          marcaKey,
          modeloKey,
        },
      },
      create: {
        tipo: "FATO_IMERSAO",
        marca,
        modelo,
        marcaKey,
        modeloKey,
        origem: "seed",
      },
      update: {
        marca,
        modelo,
        origem: "seed",
      },
    });
  }

  let stockCreated = 0;
  for (const p of pecas) {
    try {
      const existing = await prisma.stock.findFirst({
        where: { referencia: p.referencia },
      });
      if (!existing) {
        await prisma.stock.create({
          data: {
            referencia: p.referencia,
            descricao: p.descricao,
            quantidade: 5,
            quantidadeMinima: 2,
            categoria: p.categoria,
            estadoArtigo: "ATIVO",
            precoVenda: 0,
            precoCompra: 0,
          },
        });
        stockCreated++;
      }
    } catch (e) {
      console.warn("stock skip", p.referencia, e.message);
    }
  }

  const count = await prisma.catalogMarcaModelo.count({ where: { tipo: "FATO_IMERSAO" } });
  console.log("Catalog FATO_IMERSAO:", count, "| stock pieces created:", stockCreated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
