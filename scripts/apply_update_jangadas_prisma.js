const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const sqlPath = path.join(__dirname, '..', 'prisma', 'update_jangadas_inspecoes_2025.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('SQL file not found:', sqlPath);
  process.exit(2);
}
const raw = fs.readFileSync(sqlPath, 'utf8');
// Split on semicolon at line end but keep it simple
const statements = raw.split(/;\s*\n/).map(s => s.trim()).filter(s => s.length);

(async () => {
  try {
    console.log('Applying', statements.length, 'statements...');
    for (const s of statements) {
      // Skip BEGIN/COMMIT if empty
      const stmt = s.trim();
      if (!stmt) continue;
      console.log('> ', stmt.split('\n')[0].slice(0,200));
      await prisma.$executeRawUnsafe(stmt + ';');
    }
    console.log('All updates applied successfully.');
  } catch (err) {
    console.error('Error applying SQL:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
