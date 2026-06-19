import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, 'jangadas_navios_associadas_2025.csv');
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirst = true;
  for await (const line of rl) {
    if (isFirst) { isFirst = false; continue; } // skip header
    if (!line.trim()) continue;
    const [file, raftSerial, shipName, emergencyPackType, validitiesCount] = line.split(';');
    if (!raftSerial) continue; // skip lines without serial

    // Upsert Navio (ship)
    let navio = null;
    if (shipName && shipName.trim()) {
      // First, try to find the navio by nome
      navio = await prisma.navio.findFirst({
        where: { nome: shipName.trim() },
      });

      if (navio) {
        // If found, update it (or just use the found navio)
        navio = await prisma.navio.update({
          where: { id: navio.id },
          data: {},
        });
      } else {
        // If not found, create it
        navio = await prisma.navio.create({
          data: {
            nome: shipName.trim(),
            matricula: '',
            ilha: '',
            tipoPesca: '',
          },
        });
      }
    }

    // Upsert Jangada (raft)
    await prisma.jangada.upsert({
      where: { serial: raftSerial.trim() },
      update: {
        shipId: navio ? navio.id : null,
        shipNameManual: shipName ? shipName.trim() : null,
        packType: emergencyPackType ? emergencyPackType.trim() : '',
      },
      create: {
        brand: '',
        model: '',
        serial: raftSerial.trim(),
        dataFabrico: '',
        packType: emergencyPackType ? emergencyPackType.trim() : '',
        capacity: validitiesCount && !isNaN(Number(validitiesCount)) ? Number(validitiesCount) : 0,
        owner: '',
        shipId: navio ? navio.id : null,
        shipNameManual: shipName ? shipName.trim() : null,
        dataInspecao: '',
        dataProxInspecao: '',
        cylinderSerial: '',
        cylinderTara: '',
        cylinderPesoBruto: '',
        cylinderCo2: '',
        cylinderN2: '',
        cylinderDataTeste: '',
        cylinderDataProxTeste: '',
        cylinderSistema: '',
        hruReferencia: '',
        hruDataInstalacao: '',
        hruValidade: '',
        artigos: null,
        tuboIdentificacao: '',
        certificadoAtivoId: null,
      },
    });
    console.log(`Seeded: ${raftSerial} - ${shipName}`);
  }
}

main()
  .then(() => { console.log('Seed completo!'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
