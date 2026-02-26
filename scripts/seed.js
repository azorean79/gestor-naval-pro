// scripts/seed.js
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { PrismaClient } from '@prisma/client';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

const rawData = `
Embarcações de pesca da ilha do Corvo
CFR Conj. Ident. Nome
PRT000024073 PTSCF-123101-L Baía do Corvo
PRT000024236 PTSCF-123208-L Belladona
PRT000024559 PTSCF-118703-L Gotimar
PRT000024339 PTSCF-117563-L Iasalde
PRT000024249 PTSCF-118722-L Luzimar
PRT000024630 PTSCF-118313-L Sra. dos Milagres
PRT000023019 PTSCG-118536-L Valente

Embarcações de pesca da ilha das Flores
CFR Conj. Ident. Nome
PRT000025187 PTSCF-118453-L Aquila
PRT000023003 PTSCF-118544-L Baía das Flores
PRT000024095 PTSCF-118426-C Baía São Pedro
PRT000022991 PTSCF-118548-L Diluri
PRT000024336 PTSCF-118708-L Elmira
PRT000024170 PTSCF-118627-L Família Cabeceira
PRT000024226 PTSCF-112867-L Fishy
PRT000024243 PTSCF-112866-L João Inês
PRT000024338 PTSCF-114107-L José e Carlota
PRT000024036 PTSCF-118673-L Judama
PRT000024623 PTSCF-118318-L Juliana
PRT000021050 PTSCF-112673-L Lagoa Rasa
PRT000024612 PTSCF-118322-L Lee
PRT000017403 PTSCF-118456-L Mar dos Açores
PRT000023020 PTSCF-118535-L Mar Ocidental
PRT000024239 PTSCF-117982-L Meireles
PRT000024096 PTSCF-118669-L Mestre Bexiga
PRT000024645 PTSCF-118916-L Mestre João
PRT000024227 PTSCF-112381-L Mestre Joe
PRT000024438 PTSCF-118735-L Os Traquinas
PRT000023012 PTSCF-118540-L Tubarão Azul
`;

async function main() {
  const islands = rawData.split(/Embarcações de pesca da ilha d[aeo] /).slice(1);

  for (const islandBlock of islands) {
    const lines = islandBlock.trim().split('\n');
    const island = lines[0].replace('Embarcações de pesca da ilha d', '').replace('Embarcações de pesca da ilha ', '').trim();

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('CFR') && line.split(' ').length >= 3) {
        const parts = line.split(' ');
        const cfr = parts[0];
        const conjIdent = parts[1];
        const nome = parts.slice(2).join(' ');

        try {
          await prisma.navio.create({
            data: {
              nome,
              imo: cfr,
              matricula: conjIdent,
              tipo: 'pesca',
              bandeira: 'Portugal',
              status: 'ativo',
              observacoes: `Ilha de registo: ${island}`,
            },
          });
          console.log(`Inserted: ${nome}`);
        } catch (error) {
          console.error(`Error inserting ${nome}:`, error);
        }
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });