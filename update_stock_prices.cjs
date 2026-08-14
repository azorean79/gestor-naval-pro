const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const items = [
  { referencia: "L-DSB", descricao: "INSPECÇÃO JANGADA DSB", precoVenda: 200.00, categoria: "Serviço" },
  { referencia: "30202032", descricao: "COPO VERTEDOURO", precoVenda: 12.50, categoria: "Equipamento" },
  { referencia: "L-RFD", descricao: "INSPECÇÃO JANGADA RFD", precoVenda: 200.00, categoria: "Serviço" },
  { referencia: "L-SOS", descricao: "INSPECÇÃO BOIA SOS", precoVenda: 70.00, categoria: "Serviço" },
  { referencia: "L-COL", descricao: "INSPECÇÃO DE COLETES", precoVenda: 15.00, categoria: "Serviço" },
  { referencia: "L-JD", descricao: "Insp Jangada", precoVenda: 180.00, categoria: "Serviço" },
  { referencia: "30202042", descricao: "CONECTOR LIEF", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "30202001", descricao: "tubo de alta pressão", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "L-NAP", descricao: "NAP TESTE", precoVenda: 35.00, categoria: "Serviço" },
  { referencia: "L-FS", descricao: "FS TESTE", precoVenda: 35.00, categoria: "Serviço" },
  { referencia: "L-GI", descricao: "GI TESTE", precoVenda: 35.00, categoria: "Serviço" },
  { referencia: "L-TH", descricao: "TESTE HIDRAULICO", precoVenda: 80.00, categoria: "Serviço" },
  { referencia: "L-CO2", descricao: "CARGA CO2", precoVenda: 65.00, categoria: "Serviço" },
  { referencia: "L-MAR", descricao: "MARCAÇÃO / MARKING", precoVenda: 25.00, categoria: "Serviço" },
  { referencia: "L-LIM", descricao: "LIMPEZA / CLEANNING", precoVenda: 25.00, categoria: "Serviço" },
  { referencia: "L-TR", descricao: "TRANSPORTE", precoVenda: 50.00, categoria: "Serviço" },
  { referencia: "22310019", descricao: "BATEDOURO", precoVenda: 15.00, categoria: "Equipamento" },
  { referencia: "30410117", descricao: "CONECTOR LIEF", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "L-CIL", descricao: "INSPECÇÃO CILINDRO", precoVenda: 20.00, categoria: "Serviço" },
  { referencia: "20602034", descricao: "BATERIA RESCUE DAN INT", precoVenda: 110.00, categoria: "Iluminação" },
  { referencia: "30204025", descricao: "CERTIFICADO RE-INSPECÇÃO - RFD", precoVenda: 135.00, categoria: "Serviço" },
  { referencia: "30410007", descricao: "DSB-certificados de Re-inspecção", precoVenda: 135.00, categoria: "Serviço" },
  { referencia: "20500023", descricao: "01 FOGUETÃO C/ PARAQUEDAS MK8A", precoVenda: 40.00, categoria: "Pirotecnia" },
  { referencia: "20500035", descricao: "02-FACHO DE MÃO VERMELHO MK8", precoVenda: 15.00, categoria: "Pirotecnia" },
  { referencia: "20500002", descricao: "03-POTES DE FUMO MK8", precoVenda: 40.00, categoria: "Pirotecnia" },
  { referencia: "20031339", descricao: "PILHAS ALCALINAS 1,5V TAM.D-2 UNI", precoVenda: 2.50, categoria: "Iluminação" },
  { referencia: "30202201", descricao: "PROTEÇÃO PARAQUEDAS", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "30202012", descricao: "04 LANTERNA MARITIMA - \"RFD\" SOLAS", precoVenda: 30.00, categoria: "Iluminação" },
  { referencia: "30202202", descricao: "PROTEÇÃO FACHOS", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "30410046", descricao: "cabeça gist branca", precoVenda: 52.00, categoria: "Peças" },
  { referencia: "30202048", descricao: "05 BATERIA RESCUE - MASTER 1", precoVenda: 60.00, categoria: "Iluminação" },
  { referencia: "30202199", descricao: "PROTEÇÃO POTE DE FUMO", precoVenda: 12.00, categoria: "Peças" },
  { referencia: "30430007", descricao: "Bateria de jangada rescue Master 3B", precoVenda: 130.00, categoria: "Iluminação" },
  { referencia: "30202205", descricao: "BATERIA RL6", precoVenda: 175.00, categoria: "Iluminação" },
  { referencia: "30202014", descricao: "05 BATERIA DE LÍTIO RFD (RB2)", precoVenda: 120.00, categoria: "Iluminação" },
  { referencia: "30202203", descricao: "PROTEÇÃO FOLE", precoVenda: 15.00, categoria: "Peças" },
  { referencia: "30202207", descricao: "FARMACIA", precoVenda: 75.00, categoria: "Primeiros Socorros" },
  { referencia: "30202084", descricao: "06 RAÇÃO EMERGÊNCIA - 0,5 KG", precoVenda: 4.00, categoria: "Consumíveis" },
  { referencia: "30202085", descricao: "06 SACO DE AGUA 0,5 L", precoVenda: 2.00, categoria: "Consumíveis" },
  { referencia: "20909107", descricao: "07 KIT REPARAÇÃO \"RFD\"", precoVenda: 37.50, categoria: "Reparação" },
  { referencia: "ES020774", descricao: "KIT REPARACAO \"OREY\"", precoVenda: 27.50, categoria: "Reparação" },
  { referencia: "30202013", descricao: "07 KIT REPARAÇÃO", precoVenda: 27.50, categoria: "Reparação" },
  { referencia: "30460003", descricao: "Comprimidos Anti-Enjoo", precoVenda: 19.00, categoria: "Primeiros Socorros" },
  { referencia: "30430005", descricao: "COLA", precoVenda: 37.50, categoria: "Reparação" },
  { referencia: "30202051", descricao: "08 COMPRIMIDOS ANTI-ENJOO - 60 UN", precoVenda: 19.00, categoria: "Primeiros Socorros" },
  { referencia: "30202049", descricao: "08 FARMÁCIA \"RFD\" / Solas", precoVenda: 75.00, categoria: "Primeiros Socorros" },
  { referencia: "30202055", descricao: "08 FARMÁCIA \"RFD\" UE", precoVenda: 90.00, categoria: "Primeiros Socorros" },
  { referencia: "20902001", descricao: "FARMACIA SOLAS LLOYD'S REGISTER", precoVenda: 75.00, categoria: "Primeiros Socorros" },
  { referencia: "20909011", descricao: "FARMACIA SOLAS - F.A.K.", precoVenda: 40.00, categoria: "Primeiros Socorros" },
  { referencia: "30202092", descricao: "FARMACIA UE Categoria C - F.A.K.", precoVenda: 75.00, categoria: "Primeiros Socorros" },
  { referencia: "30202007", descricao: "24 CINTA DE APERTO COM GRAMPO", precoVenda: 6.00, categoria: "Peças" },
  { referencia: "ES012407", descricao: "CINTA APERTO COM GRAMPO", precoVenda: 6.00, categoria: "Peças" },
  { referencia: "30450017", descricao: "Cintas de fecho DSB 260cm", precoVenda: 6.00, categoria: "Peças" },
  { referencia: "ES012516", descricao: "PROTECCAO CINTA APERTO fita não cortar", precoVenda: 3.00, categoria: "Peças" },
  { referencia: "30450020", descricao: "Cinta Universal Completa", precoVenda: 75.00, categoria: "Peças" },
  { referencia: "30410062", descricao: "CINTA DE FECHO", precoVenda: 6.00, categoria: "Peças" },
  { referencia: "30420023", descricao: "TUBO ALTA PRESSÃO", precoVenda: 110.00, categoria: "Peças" },
  { referencia: "CINTA-INT", descricao: "27 CINTA APERTO INTERIOR", precoVenda: 3.00, categoria: "Peças" },
  { referencia: "ES012741", descricao: "saco de vacuo", precoVenda: 50.00, categoria: "Consumíveis" },
  { referencia: "30201022", descricao: "28 ANILHA P/ FINAL DE RETENIDA SURVIVA", precoVenda: 9.00, categoria: "Peças" },
  { referencia: "ES023006", descricao: "FITA ADESIVA - 100MM", precoVenda: 3.00, categoria: "Consumíveis" },
  { referencia: "ES023130", descricao: "ACETATO - MANGA PLASTICA", precoVenda: 3.00, categoria: "Consumíveis" },
  { referencia: "30202030", descricao: "32 TUBO IDENTIFICAÇÃO INVÓLUCRO", precoVenda: 35.00, categoria: "Peças" },
  { referencia: "30203005", descricao: "37 TUBO ALTA PRESSÃO 790MM RFD", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30420033", descricao: "VALVULAS OTS65", precoVenda: 37.50, categoria: "Peças" },
  { referencia: "30203032", descricao: "38 TUBO ALTA PRESSÃO 800 MM RFD", precoVenda: 60.00, categoria: "Peças" },
  { referencia: "30203001", descricao: "Tubo de alta pressão", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30202044", descricao: "Tubo de alta pressão 800mm p/Leafield", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30202060", descricao: "CONECTOR LIEF", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "30410074", descricao: "TUBO ALTA PRESSÃO", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30410119", descricao: "ANILHA DE COBRE", precoVenda: 10.00, categoria: "Peças" },
  { referencia: "30203190", descricao: "LUZ Externa p/jangada RL 5", precoVenda: 165.00, categoria: "Iluminação" },
  { referencia: "30410116", descricao: "TUBO ALTA PRESSÃO", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30202077", descricao: "41 RETENIDA RFD 28 MT", precoVenda: 120.00, categoria: "Peças" },
  { referencia: "30440004", descricao: "Painter, compl. in bag 36m, 15.000 N blue", precoVenda: 75.00, categoria: "Peças" },
  { referencia: "30202002", descricao: "40 RETENIDA RFD 10 MT", precoVenda: 80.00, categoria: "Peças" },
  { referencia: "30202078", descricao: "42 RETENIDA RFD 35 MT", precoVenda: 150.00, categoria: "Peças" },
  { referencia: "20701048", descricao: "Libertador HAMMAR H20 Solas", precoVenda: 85.00, categoria: "Segurança" },
  { referencia: "20701007", descricao: "Hidrostático HAMMAR H20 Não-Solas", precoVenda: 80.00, categoria: "Segurança" },
  { referencia: "PARAF", descricao: "PARAFUSOS", precoVenda: 4.00, categoria: "Peças" },
  { referencia: "CINTA-50", descricao: "Cinta Nylon Simples 50mm", precoVenda: 75.00, categoria: "Peças" },
  { referencia: "20020160", descricao: "Kit de rearme manual. p/coletes", precoVenda: 12.50, categoria: "Reparação" },
  { referencia: "20000348", descricao: "Garrafa de CO2, 33gr", precoVenda: 7.50, categoria: "Cilindros" },
];

async function main() {
  console.log("A atualizar referências e preços no Stock...");

  // 1. Handle Farmácia 30202050 -> 30202049 update
  const oldFarmacia = await prisma.stock.findFirst({ where: { referencia: "30202050" } });
  if (oldFarmacia) {
    await prisma.stock.update({
      where: { id: oldFarmacia.id },
      data: { referencia: "30202049", precoVenda: 75.00, descricao: "08 FARMÁCIA \"RFD\" / Solas" }
    });
    console.log("Atualizado 30202050 para 30202049.");
  }

  for (const item of items) {
    const existing = await prisma.stock.findFirst({ where: { referencia: item.referencia } });
    if (existing) {
      await prisma.stock.update({
        where: { id: existing.id },
        data: {
          descricao: item.descricao,
          precoVenda: item.precoVenda,
          categoria: item.categoria,
          estadoArtigo: "ATIVO"
        }
      });
      console.log(`Atualizado: [${item.referencia}] ${item.descricao} - ${item.precoVenda}€`);
    } else {
      await prisma.stock.create({
        data: {
          referencia: item.referencia,
          descricao: item.descricao,
          precoVenda: item.precoVenda,
          categoria: item.categoria,
          estadoArtigo: "ATIVO",
          quantidade: 0
        }
      });
      console.log(`Adicionado novo: [${item.referencia}] ${item.descricao} - ${item.precoVenda}€`);
    }
  }

  console.log("Concluído com sucesso!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
