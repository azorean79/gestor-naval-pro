const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mostrarDados() {
  const marcas = await prisma.marcaJangada.findMany({
    include: {
      modelos: {
        include: {
          especificacoes: true
        }
      },
      especificacoes: true
    }
  });
  console.log(JSON.stringify(marcas, null, 2));
}

mostrarDados().catch(console.error);