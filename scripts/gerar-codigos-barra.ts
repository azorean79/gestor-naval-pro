import { config } from 'dotenv'
config()

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

// Função para gerar código EAN-13 baseado na referência OREY
function gerarEAN13(refOrey: string): string {
  // Remove caracteres não numéricos e limita a 12 dígitos
  const base = refOrey.replace(/\D/g, '').slice(0, 12).padStart(12, '0');

  // Calcula dígito verificador EAN-13
  const digits = base.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit.toString();
}

// Função para verificar se o código EAN-13 já existe
async function codigoBarraExiste(codigoBarra: string): Promise<boolean> {
  const item = await prisma.stock.findFirst({
    where: { codigoBarra }
  });
  return !!item;
}

// Função principal
async function gerarCodigosBarra() {
  console.log('🔄 Iniciando geração de códigos de barras...');

  try {
    // Busca itens de stock com refOrey mas sem codigoBarra
    const itensSemBarra = await prisma.stock.findMany({
      where: {
        refOrey: { not: null },
        codigoBarra: null
      },
      select: {
        id: true,
        refOrey: true,
        descricao: true
      }
    });

    console.log(`📦 Encontrados ${itensSemBarra.length} itens sem código de barras`);

    let atualizados = 0;
    let erros = 0;

    for (const item of itensSemBarra) {
      try {
        if (!item.refOrey) continue;

        let codigoBarra = gerarEAN13(item.refOrey);
        let tentativas = 0;

        // Garante unicidade do código de barras
        while (await codigoBarraExiste(codigoBarra) && tentativas < 10) {
          // Adiciona um sufixo incremental se houver conflito
          const base = item.refOrey.replace(/\D/g, '').slice(0, 11).padStart(11, '0');
          const sufixo = (parseInt(base.slice(-1)) + tentativas + 1) % 10;
          const novoBase = base.slice(0, -1) + sufixo;
          codigoBarra = gerarEAN13(novoBase);
          tentativas++;
        }

        if (tentativas >= 10) {
          console.error(`❌ Não foi possível gerar código único para refOrey: ${item.refOrey}`);
          erros++;
          continue;
        }

        // Atualiza o item com o código de barras
        await prisma.stock.update({
          where: { id: item.id },
          data: { codigoBarra }
        });

        console.log(`✅ ${item.descricao}: ${codigoBarra}`);
        atualizados++;

      } catch (error) {
        console.error(`❌ Erro ao processar item ${item.id}:`, error);
        erros++;
      }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ Itens atualizados: ${atualizados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`🎉 Geração de códigos de barras concluída!`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o script
gerarCodigosBarra();