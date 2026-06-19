// Script para popular o banco de dados Prisma com as inspeções extraídas
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando importação de inspeções para o banco...');
  
  const rawData = fs.readFileSync('inspecoes_2025.json', 'utf8');
  const inspecoes = JSON.parse(rawData);

  let successCount = 0;
  let errorCount = 0;

  for (const insp of inspecoes) {
    if (!insp.numeroObra) continue; // Pula se número for nulo ou falso
    
    // Tenta encontrar um navio aproximado a partir do nome se existir no filename (ex: AZ25-001 NOME DO NAVIO.xlsx)
    const navioNomeStr = insp.arquivo.replace(/AZ25-\d{3}/g, '').replace('.xlsx', '').trim();
    
    // Tentamos buscar a jangada pelo serial
    let jangada = null;
    if (insp.serial && insp.serial.length > 3) {
      jangada = await prisma.jangada.findFirst({
        where: { serial: insp.serial }
      });
    }

    try {
      // Como schema não tem numeroObra nativo na model Inspecao, vamos usar sourceFile ou salvar certificado com prefixo
      // Vamos checar schema atual de Inspecao...
      // id, certificadoNumero, navioNome, navioId?, jangadaId?, jangadaSerial?, dataInspecao, dataProxInspecao?, status, sourceFile
      
      const inspectData = {
        certificadoNumero: `AZ25-${insp.numeroObra.split('-')[1]} AZ`, // Ex: AZ25-001 AZ
        navioNome: navioNomeStr || 'Desconhecido',
        jangadaSerial: insp.serial || null,
        jangadaId: jangada ? jangada.id : null,
        dataInspecao: insp.dataInspecao || new Date().toISOString().split('T')[0],
        status: 'Concluída',
        sourceFile: `${insp.numeroObra} - ${insp.arquivo}` // Usando sourceFile guardando o numeroObra temporariamente
      };

      // Upsert para não duplicar
      await prisma.inspecao.upsert({
        where: { certificadoNumero: inspectData.certificadoNumero },
        update: inspectData,
        create: inspectData
      });
      console.log(`✅ Inspeção ${inspectData.certificadoNumero} (Obra: ${insp.numeroObra}) salva.`);
      successCount++;
    } catch (e) {
      console.error(`❌ Erro ao salvar inspeção do arquivo ${insp.arquivo}: ${e.message}`);
      errorCount++;
    }
  }

  console.log(`\n--- RESULTADO DA IMPORTAÇÃO ---`);
  console.log(`✅ Salvos com sucesso: ${successCount}`);
  console.log(`❌ Erros encontrados: ${errorCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });