const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const station = await prisma.serviceStation.findFirst({
    where: { nome: { contains: 'Açores' } },
  });
  if (!station) {
    console.log('Station not found');
    return;
  }
  const jangadas = await prisma.jangada.updateMany({
    where: { serviceStationId: null },
    data: { serviceStationId: station.id },
  });
  console.log('Jangadas updated:', jangadas.count);

  const navios = await prisma.navio.updateMany({
    where: { serviceStationId: null },
    data: { serviceStationId: station.id },
  });
  console.log('Navios updated:', navios.count);

  const clientes = await prisma.cliente.updateMany({
    where: { serviceStationId: null },
    data: { serviceStationId: station.id },
  });
  console.log('Clientes updated:', clientes.count);
  console.log('Done!');
}
main().finally(() => process.exit(0));
