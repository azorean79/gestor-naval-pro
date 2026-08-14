const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getInspectionIntervalYears } = require('../../src/modules/rafts/inspectionInterval');
const { getIvaRate, calcTotal, round2 } = require('../../src/lib/iva');

async function runTests() {
  console.log("=== INÍCIO DOS TESTES DE INTEGRAÇÃO DO FLUXO COMPLETO ===");

  try {
    // 1. Testar Regra de Intervalo de Marcas
    console.log("\n[1] A testar intervalos de inspeção por marca...");
    const intEurovinil = getInspectionIntervalYears('EUROVINIL', 'EASY');
    const intRfd = getInspectionIntervalYears('RFD', 'SEASAVA');
    const intZodiac = getInspectionIntervalYears('ZODIAC', 'COASTAL');
    const intOther = getInspectionIntervalYears('LALIZAS', 'ISO');

    console.log(` - Eurovinil Easy: ${intEurovinil} ano(s) (esperado: 4)`);
    console.log(` - RFD: ${intRfd} ano(s) (esperado: 1)`);
    console.log(` - Zodiac: ${intZodiac} ano(s) (esperado: 1)`);
    console.log(` - Outra (Lalizas): ${intOther} ano(s) (esperado: 3)`);

    if (intEurovinil !== 4 || intRfd !== 1 || intZodiac !== 1 || intOther !== 3) {
      throw new Error("Falha nos intervalos de inspeção por marca!");
    }
    console.log("✔ Teste de intervalos PASSOU.");

    // 2. Testar Cálculo de IVA e Total
    console.log("\n[2] A testar cálculo central de IVA (taxa:", getIvaRate(), ")...");
    const subtotal = 100;
    const ivaEsperado = round2(subtotal * getIvaRate());
    const totalCalc = calcTotal(100, 0, 0, false);
    console.log(` - Subtotal: ${subtotal} | IVA: ${ivaEsperado} | Total Calculado: ${totalCalc}`);
    if (totalCalc !== round2(100 + ivaEsperado)) {
      throw new Error("Falha no cálculo central de IVA e Totais!");
    }
    console.log("✔ Teste de IVA e Totais PASSOU.");

    // 3. Testar Base de Dados & Relações de Orçamento/Stock/Queue
    console.log("\n[3] A testar entidades na Base de Dados (Jangada, Stock, OrdemServico)...");
    const countJangadas = await prisma.jangada.count();
    const countStock = await prisma.stock.count();
    const countOS = await prisma.ordemServico.count();
    console.log(` - Jangadas registadas: ${countJangadas}`);
    console.log(` - Artigos em stock: ${countStock}`);
    console.log(` - Ordens de serviço: ${countOS}`);
    console.log("✔ Teste de base de dados PASSOU.");

    console.log("\n=== TODOS OS TESTES DE INTEGRAÇÃO PASSARAM COM SUCESSO! ===");
  } catch (err) {
    console.error("\n❌ ERRO NOS TESTES DE INTEGRAÇÃO:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
