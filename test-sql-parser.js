const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync('prisma/seed_navios.sql', 'utf-8');
  const lines = sql.split('\n');

  let importedClientes = 0;
  let importedNavios = 0;

  // Map old ID to new ID
  const clienteIdMap = new Map();

  for (let line of lines) {
    if (line.includes('INSERT INTO "Cliente"')) {
      // e.g. INSERT INTO "Cliente" (nome, morada, ilha) SELECT 'Fish Boat Works, Lda.', 'Rua...', 'Faial' ...
      const match = line.match(/SELECT\s+'(.*?)',\s*'(.*?)',\s*(NULL|'.*?')/);
      if (match) {
        let nome = match[1].replace(/''/g, "'");
        let morada = match[2].replace(/''/g, "'");
        let ilha = match[3] === 'NULL' ? null : match[3].replace(/'/g, '').replace(/''/g, "'");

        const cliente = await prisma.cliente.create({
          data: { nome, morada, ilha }
        });
        
        // We don't know the old ID from this line directly. But wait, we need the old ID!
        // The old ID is NOT in the Cliente insert line. 
        // How do we link it?
        // Actually, if we look at the Navio insert:
        // INSERT INTO "Navio" (id, nome, matricula, ..., clienteId, ...) VALUES (84, 'BALEIAS EXPRESSO', ..., 246, ...)
        // The only way is if there is a dump of Cliente with IDs!
      }
    }
  }
}
main();
