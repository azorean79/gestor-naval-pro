const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test(label, fn) {
  try {
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    const count = Array.isArray(result) ? result.length : 0;
    console.log(`OK ${label} (${ms}ms) rows=${count}`);
  } catch (error) {
    console.log(`FAIL ${label}`);
    console.log(JSON.stringify({
      name: error?.name,
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
    }, null, 2));
  }
}

async function main() {
  await test('count', () => prisma.stock.count());

  await test('id-only', () => prisma.stock.findMany({
    take: 200,
    select: { id: true },
    orderBy: { id: 'desc' },
  }));

  await test('light-fields', () => prisma.stock.findMany({
    take: 200,
    select: { id: true, referencia: true, descricao: true, quantidade: true },
    orderBy: { id: 'desc' },
  }));

  await test('with-foto', () => prisma.stock.findMany({
    take: 200,
    select: { id: true, referencia: true, descricao: true, quantidade: true, foto: true },
    orderBy: { id: 'desc' },
  }));

  await test('full-findMany-default', () => prisma.stock.findMany({
    take: 200,
    orderBy: { id: 'desc' },
  }));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
