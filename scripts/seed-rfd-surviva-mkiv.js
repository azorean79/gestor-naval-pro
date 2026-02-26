const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  // Ensure brand and model
  const marcaName = 'RFD';
  const modeloName = 'SURVIVA MKIV';

  let marca = await prisma.marca.findUnique({ where: { nome: marcaName } });
  if (!marca) marca = await prisma.marca.create({ data: { nome: marcaName } });

  let modelo = await prisma.modelo.findFirst({ where: { nome: modeloName, marcaId: marca.id } });
  if (!modelo) modelo = await prisma.modelo.create({ data: { nome: modeloName, marcaId: marca.id } });

  const exemplos = [
    { suffix: '01', lotacao: 6 },
    { suffix: '02', lotacao: 8 },
    { suffix: '03', lotacao: 10 },
  ];

  const created = [];
  for (const ex of exemplos) {
    const numeroReferencia = `RFD-SURVIVA-MKIV-${ex.suffix}`;
    const numero = `MKIV-${ex.suffix}`;
    const nome = `RFD SURVIVA MKIV ${ex.suffix}`;

    let jangada = await prisma.jangada.findUnique({ where: { numeroReferencia } });
    if (!jangada) {
      jangada = await prisma.jangada.create({
        data: {
          numeroReferencia,
          numero,
          nome,
          proprietario: 'Exemplo Demo',
          modeloId: modelo.id,
          lotacao: ex.lotacao,
          status: 'ativo',
        },
      });
    }

    // create a sample cilindro for the jangada
    const cilindroSerie = `RFD-MKIV-CIL-${ex.suffix}`;
    let cilindro = await prisma.cilindro.findUnique({ where: { numeroSerie: cilindroSerie } });
    if (!cilindro) {
      cilindro = await prisma.cilindro.create({
        data: {
          numeroSerie: cilindroSerie,
          pesoBruto: 12.5,
          tara: 2.1,
          quantidadeCO2: 2.5,
          quantidadeN2: 0,
          tipoSistemaInsuflacao: 'CO2',
          proprietario: 'Exemplo Demo',
        },
      });
    }

    created.push({ jangada, cilindro });
  }

  console.log('Created/ensured examples:');
  for (const item of created) {
    console.log('- Jangada:', item.jangada.numeroReferencia, item.jangada.nome);
    console.log('  Cilindro:', item.cilindro.numeroSerie);
  }

  // Create example spares (ItemStock)
  const spares = [
    {
      codigoFabricante: 'RFD-BAG-001',
      numeroReferencia: 'RFD-BAG-001',
      nome: 'Manual Bag - SURVIVA MKIV',
      categoria: 'Acessórios',
      quantidade: 10,
      quantidadeAtual: 10,
      descricao: 'Bolsa de transporte para balsa RFD SURVIVA MKIV',
      imagem: null,
    },
    {
      codigoFabricante: 'RFD-STRAP-001',
      numeroReferencia: 'RFD-STRAP-001',
      nome: 'Strap Kit - SURVIVA MKIV',
      categoria: 'Acessórios',
      quantidade: 20,
      quantidadeAtual: 20,
      descricao: 'Tiras e cunhas de fixação',
      imagem: null,
    },
    {
      codigoFabricante: 'RFD-KIT-001',
      numeroReferencia: 'RFD-KIT-001',
      nome: 'Spare Parts Kit - SURVIVA MKIV',
      categoria: 'Kits',
      quantidade: 5,
      quantidadeAtual: 5,
      descricao: 'Kit completo de reposição para SURVIVA MKIV',
      imagem: null,
    },
  ];

  for (const s of spares) {
    const exists = await prisma.itemStock.findUnique({ where: { numeroReferencia: s.numeroReferencia } });
    if (!exists) {
      await prisma.itemStock.create({ data: s });
      console.log('Created spare:', s.numeroReferencia, s.nome);
    } else {
      console.log('Spare exists:', s.numeroReferencia);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

