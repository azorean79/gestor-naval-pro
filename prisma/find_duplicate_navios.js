const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalize(str) {
  return (str || '')
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ');
}

async function main() {
  const navios = await prisma.navio.findMany({
    select: { id: true, nome: true, matricula: true, ilha: true, tipoPesca: true, clienteId: true },
    orderBy: { nome: 'asc' }
  });

  console.log(`Total de navios: ${navios.length}\n`);

  // Agrupar por nome normalizado
  const groups = {};
  for (const n of navios) {
    const key = normalize(n.nome);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  // Filtrar grupos com duplicados
  const duplicates = Object.entries(groups)
    .filter(([, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log('Nenhum nome de navio duplicado encontrado.');
    return;
  }

  console.log(`=== ${duplicates.length} NOMES DUPLICADOS ENCONTRADOS ===\n`);

  let realDuplicates = 0;
  let differentShips = 0;

  for (const [normalizedName, items] of duplicates) {
    // Verificar se as matrículas são diferentes
    const matriculas = items.map(i => (i.matricula || '').trim()).filter(m => m);
    const uniqueMatriculas = [...new Set(matriculas)];
    
    const sameShip = uniqueMatriculas.length <= 1; // mesma matrícula ou sem matrícula = provável duplicado
    
    if (sameShip) {
      realDuplicates++;
      console.log(`🔴 DUPLICADO REAL: "${normalizedName}"`);
    } else {
      differentShips++;
      console.log(`🟡 MATRÍCULAS DIFERENTES (navios distintos): "${normalizedName}"`);
    }
    
    for (const item of items) {
      console.log(`   ID: ${item.id} | Nome: "${item.nome}" | Matrícula: "${item.matricula || '—'}" | Ilha: ${item.ilha || '—'} | ClienteID: ${item.clienteId || '—'}`);
    }
    console.log('');
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Duplicados reais (mesma matrícula ou sem matrícula): ${realDuplicates}`);
  console.log(`Navios distintos com nome igual mas matrículas diferentes: ${differentShips}`);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
