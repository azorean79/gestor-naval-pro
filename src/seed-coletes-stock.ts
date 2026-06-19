import prisma from './lib/prisma';

async function main() {
  const stockItems = [
    {
      referencia: "CO2-33G",
      descricao: "Cilindro CO2 33g",
      categoria: "CILINDROS",
      quantidade: 50,
      precoVenda: 15.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-CO2-33",
      validade: "2030-12"
    },
    {
      referencia: "CO2-38G",
      descricao: "Cilindro CO2 38g",
      categoria: "CILINDROS",
      quantidade: 30,
      precoVenda: 18.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-CO2-38",
      validade: "2030-12"
    },
    {
      referencia: "CO2-60G",
      descricao: "Cilindro CO2 60g",
      categoria: "CILINDROS",
      quantidade: 20,
      precoVenda: 25.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-CO2-60",
      validade: "2030-12"
    },
    {
      referencia: "BOBBIN-UML",
      descricao: "Pastilha de Sal (Bobbin) UML",
      categoria: "PASTILHAS",
      quantidade: 100,
      precoVenda: 5.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-BOB-UML",
      validade: "2028-06"
    },
    {
      referencia: "BOBBIN-HR",
      descricao: "Pastilha de Sal (Bobbin) Halkey Roberts",
      categoria: "PASTILHAS",
      quantidade: 80,
      precoVenda: 6.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-BOB-HR",
      validade: "2028-06"
    },
    {
      referencia: "LIGHT-LALIZAS",
      descricao: "Luz de Emergência Lalizas",
      categoria: "LUZES",
      quantidade: 40,
      precoVenda: 12.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-LGT-LAL",
      validade: "2029-05"
    },
    {
      referencia: "WHISTLE-EMERG",
      descricao: "Apito de Emergência",
      categoria: "APITOS",
      quantidade: 150,
      precoVenda: 2.0,
      estadoArtigo: "ATIVO",
      associavelJangada: false,
      lote: "L-WHL-EMG",
      validade: null
    }
  ];

  console.log("Seeding colete stock items...");

  for (const item of stockItems) {
    const created = await prisma.stock.upsert({
      where: { referencia: item.referencia },
      update: {
        quantidade: item.quantidade,
        categoria: item.categoria,
        descricao: item.descricao,
        lote: item.lote,
        validade: item.validade
      },
      create: item
    });
    console.log(`Upserted: ${created.referencia} - ${created.descricao}`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
