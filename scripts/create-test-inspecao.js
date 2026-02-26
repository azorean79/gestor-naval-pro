const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const jangadaRef = 'RFD-SURVIVA-MKIV-01';
    const jangada = await prisma.jangada.findUnique({ where: { numeroReferencia: jangadaRef } });
    if (!jangada) {
      console.error('Jangada not found:', jangadaRef);
      process.exit(1);
    }

    // Ensure a demo cliente
    const clienteRef = 'DEMO-CLIENTE-RFD';
    let cliente = await prisma.cliente.findUnique({ where: { numeroReferencia: clienteRef } });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          numeroReferencia: clienteRef,
          nome: 'Cliente Demo RFD',
          tipo: 'empresa',
          nif: '000000000',
          email: 'demo@rfd.example',
          telefone: '000000000'
        }
      });
    }

    const checklist = JSON.stringify([
      { item: 'Check buoyancy chamber', status: 'pending' },
      { item: 'Check cylinder pressure', status: 'pending' },
      { item: 'Check straps', status: 'pending' }
    ]);

    const ins = await prisma.inspecao.create({
      data: {
        equipamentoId: jangada.id,
        equipamentoNome: jangada.nome,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        tipoInspecao: 'inicial',
        tecnico: 'Sistema Test',
        dataInspecao: new Date(),
        checklist: checklist,
        observacoesGerais: 'Inspeção de teste criada pelo seed script'
      }
    });

    console.log('Created test Inspecao:', ins.id);
    console.log('Open URL: /agenda/inspecao/' + ins.id);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
