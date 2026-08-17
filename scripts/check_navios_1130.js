const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const shipNames = [
    'Marta', 'OS CAIXINEIROS', 'REINO DO DRAGÃO', 'BRUNA CRISTINA',
    'MESTRE ALMEIDA', 'MESTRE HIGINO', 'RAULINHO', 'DEUSA DO MAR',
    'SALMÃO', 'CABO DA PRAIA', 'CABO DO MAR', 'PRINCIPE DA PAZ',
    'PRINCESA DE SESIMBRA', 'ESCORPIÕES', 'SOL NASCENTE', 'NOROESTE',
    'MESTRE SACADURA', 'HELENINHA'
  ];

  // Check all navios with these names + their clienteId
  const namesList = shipNames.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
  const allNavios = await p.$queryRawUnsafe(`
    SELECT n.id, n.nome, n.matricula, n."clienteId", c.nome as "clienteNome"
    FROM "Navio" n
    LEFT JOIN "Cliente" c ON c.id = n."clienteId"
    WHERE n.nome IN (${namesList})
    ORDER BY n.nome, n.matricula
  `);
  
  console.log(`All navios with these names (${allNavios.length}):\n`);
  for (const n of allNavios) {
    console.log(`  ${n.nome} | ${n.matricula} | clienteId=${n.clienteId} | cliente: ${n.clienteNome || 'null'}`);
  }

  // Check OS linked to these navios via OrdemServico.navioId or jangada
  console.log('\n=== OS linked via navio name ===');
  for (const name of shipNames) {
    const os = await p.$queryRawUnsafe(`
      SELECT os.id as "osId", os.numero, os.estado, os."clienteId", c.nome as "clienteNome", n.nome as "navioNome", n.matricula
      FROM "OrdemServico" os
      LEFT JOIN "Cliente" c ON c.id = os."clienteId"
      LEFT JOIN "Navio" n ON n.id = os."navioId"
      WHERE n.nome = $1
      ORDER BY os.id DESC
      LIMIT 3
    `, name);
    if (os.length > 0) {
      for (const o of os) {
        console.log(`  OS#${o.osId} ${o.numero || '?'} | estado=${o.estado} | navio=${o.navioNome}(${o.matricula}) | cliente=${o.clienteId}:${o.clienteNome || 'null'}`);
      }
    }
  }

  await p.$disconnect();
})();
