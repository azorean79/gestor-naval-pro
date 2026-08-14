const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalize(str) {
  return (str || '')
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function isND(mat) {
  if (!mat) return true;
  const n = mat.trim().toUpperCase();
  return n === 'N/D' || n === 'ND' || n === 'N.D.' || n === 'N/A' || n === 'NA' || n === '';
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, clienteId: true, cliente: { select: { nome: true } } }
  });

  const groups = {};
  for (const n of navios) {
    const key = normalize(n.nome);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  console.log("=== DUPLICADOS REAIS (NOME IGUAL + MATRÍCULA IGUAL OU EM FALTA) ===");
  for (const [key, items] of Object.entries(groups)) {
    if (items.length > 1) {
      // Filtrar para ver se há duplicados reais
      const matches = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const m1 = items[i].matricula;
          const m2 = items[j].matricula;
          const bothND = isND(m1) && isND(m2);
          const sameMat = !isND(m1) && !isND(m2) && m1.trim().toUpperCase().replace(/[-\s]/g, '') === m2.trim().toUpperCase().replace(/[-\s]/g, '');
          
          if (bothND || sameMat) {
            if (!matches.includes(items[i])) matches.push(items[i]);
            if (!matches.includes(items[j])) matches.push(items[j]);
          }
        }
      }

      if (matches.length > 0) {
        console.log(`\nNavio: "${key}"`);
        for (const m of matches) {
          console.log(`  - ID: ${m.id} | Nome Original: "${m.nome}" | Matrícula: "${m.matricula || 'N/D'}" | Cliente: "${m.cliente?.nome || '—'}" | Ilha: "${m.ilha || '—'}"`);
        }
      }
    }
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
