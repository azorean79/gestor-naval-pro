const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const items = [
  { referencia: "20000348", descricao: "Garrafa de CO2, 33gr", categoria: "COLETES", codigoFabricante: "20000348", localizacao: "63", quantidade: 63, precoCompra: 4.027, precoVenda: 9.4 },
  { referencia: "20010072", descricao: "ANCA LANTERNA UTILITAIRE Nº2 - 75cm", categoria: "COLETES", codigoFabricante: "20010072", localizacao: "3", quantidade: 3, precoCompra: 2.21, precoVenda: 4.5 },
  { referencia: "20020120", descricao: "ENCHIMENTO MANUAL", categoria: "COLETES", codigoFabricante: "20020120", localizacao: "2", quantidade: 2, precoCompra: 5.25, precoVenda: 11.25 },
  { referencia: "20020260", descricao: "ENCHIMENTO AUTOMÁTICO JS 1", categoria: "COLETES", codigoFabricante: "20020260", localizacao: "2", quantidade: 2, precoCompra: 9.234, precoVenda: 18.5 },
  { referencia: "20020300", descricao: "TUBO ALTA PRESSÃO GIST PRETA/BRANCA", categoria: "TUBOS ALTA PRESSAO", codigoFabricante: "20020300", localizacao: "10", quantidade: 10, precoCompra: 12.5, precoVenda: 25 },
  { referencia: "20020310", descricao: "TUBO ALTA PRESSÃO SÉRIE DK", categoria: "TUBOS ALTA PRESSAO", codigoFabricante: "20020310", localizacao: "15", quantidade: 15, precoCompra: 14, precoVenda: 28 },
  { referencia: "20020320", descricao: "ANILHA VEDAÇÃO GIST", categoria: "TUBOS ALTA PRESSAO", codigoFabricante: "20020320", localizacao: "50", quantidade: 50, precoCompra: 0.5, precoVenda: 1.2 },
  { referencia: "20020321", descricao: "ADAPTADOR GIST/DK", categoria: "TUBOS ALTA PRESSAO", codigoFabricante: "20020321", localizacao: "20", quantidade: 20, precoCompra: 0.6, precoVenda: 1.5 },
  { referencia: "20020322", descricao: "TAMPÃO PROTECÇÃO", categoria: "CABEÇAS DE DISPARO", codigoFabricante: "20020322", localizacao: "30", quantidade: 30, precoCompra: 1, precoVenda: 2.5 },
  { referencia: "20020400", descricao: "CABEÇA DE DISPARO GIST", categoria: "CABEÇAS DE DISPARO", codigoFabricante: "20020400", localizacao: "5", quantidade: 5, precoCompra: 25, precoVenda: 55 },
  { referencia: "20020401", descricao: "CABEÇA DE DISPARO DK9", categoria: "CABEÇAS DE DISPARO", codigoFabricante: "20020401", localizacao: "5", quantidade: 5, precoCompra: 35, precoVenda: 75 },
  { referencia: "20031337", descricao: "Pilhas Alcalinas 1,5V-TAMANHO AA - 4", categoria: "PILHAS", codigoFabricante: "20031337", localizacao: "6", quantidade: 6, precoCompra: 0.771, precoVenda: 2.5 },
  { referencia: "20070155", descricao: "COLETE INFANTIL (Criança) AA - 4", categoria: "COLETES", codigoFabricante: "20070155", localizacao: "2", quantidade: 2, precoCompra: 13.285, precoVenda: 27.81 },
  { referencia: "20070178", descricao: "COLETE P/ ADULTO S/ LUZ EEP SOLA", categoria: "COLETES", codigoFabricante: "20070178", localizacao: "2", quantidade: 2, precoCompra: 15.546, precoVenda: 31.27 },
  { referencia: "20070180", descricao: "ROLO DE FITA RETLÉTRA 3M, 50M", categoria: "DIVERSOS", codigoFabricante: "20070180", localizacao: "3", quantidade: 3, precoCompra: 64.927, precoVenda: 152.79 },
  { referencia: "20071095", descricao: "Colete Insuflável SIGMA 150N - manuel c/ arnés", categoria: "COLETES", codigoFabricante: "20071095", localizacao: "2", quantidade: 2, precoCompra: 42.31, precoVenda: 81.43 },
  { referencia: "20071324", descricao: "Colete Aut. Insuflável 150N, EN ISO 12402-3", categoria: "COLETES", codigoFabricante: "20071324", localizacao: "22", quantidade: 22, precoCompra: 41.879, precoVenda: 76.88 },
  { referencia: "20071394", descricao: "Conjunto de Bobines p/ Colete Automático", categoria: "COLETES", codigoFabricante: "20071394", localizacao: "22", quantidade: 22, precoCompra: 4.768, precoVenda: 10.42 },
  { referencia: "20098970", descricao: "Adaptador de Insuflação para Válvula", categoria: "COLETES", codigoFabricante: "20098970", localizacao: "1", quantidade: 1, precoCompra: 0.962, precoVenda: 2.3 },
  { referencia: "20102024", descricao: "RFD SEASAVA 8P PACK R, Contentor", categoria: "JANGADAS", codigoFabricante: "20102024", localizacao: "1", quantidade: 1, precoCompra: 1720, precoVenda: 17200 },
  { referencia: "20106023", descricao: "JANGADA Eurovinil 6P Saco Standard Inter.J", categoria: "JANGADAS", codigoFabricante: "20106023", localizacao: "1", quantidade: 1, precoCompra: 595.25, precoVenda: 980 },
  { referencia: "20302039", descricao: "Super Bobbin", categoria: "COLETES", codigoFabricante: "20302039", localizacao: "100", quantidade: 100, precoCompra: 4.402, precoVenda: 9.5 },
  { referencia: "20300014", descricao: "Oral Inflation Non Return Valve Insert Black", categoria: "COLETES", codigoFabricante: "20300014", localizacao: "1", quantidade: 1, precoCompra: 5.9525, precoVenda: 7.87 },
  { referencia: "20310018", descricao: "Halkey Roberts Alpha Inflator End Cap", categoria: "COLETES", codigoFabricante: "20310018", localizacao: "6", quantidade: 6, precoCompra: 7.87, precoVenda: 14.5 },
  { referencia: "20310036", descricao: "UML retaining clip round type", categoria: "COLETES", codigoFabricante: "20310036", localizacao: "9", quantidade: 9, precoCompra: 0.307, precoVenda: 0.8 },
  { referencia: "20310043", descricao: "Clip UM auto firing indicator green", categoria: "COLETES", codigoFabricante: "20310043", localizacao: "25", quantidade: 25, precoCompra: 0.457, precoVenda: 1.2 },
  { referencia: "20402034", descricao: "Grampo p/Cabeça de Disparo", categoria: "COLETES", codigoFabricante: "20402034", localizacao: "1", quantidade: 1, precoCompra: 1.94, precoVenda: 4.2 },
  { referencia: "20402037", descricao: "Sanyts Liferafts Service Kit", categoria: "JANGADAS", codigoFabricante: "20402037", localizacao: "4", quantidade: 4, precoCompra: 121.438, precoVenda: 245 },
  { referencia: "20402038", descricao: "Baterias", categoria: "BATERIAS", codigoFabricante: "20402038", localizacao: "4", quantidade: 4, precoCompra: 41.524, precoVenda: 90 },
  { referencia: "20603024", descricao: "Saco de Vacuo p/Jangadas EV 4-6P", categoria: "SACOS DE VACUO", codigoFabricante: "20603024", localizacao: "7", quantidade: 7, precoCompra: 51.875, precoVenda: 82 },
  { referencia: "20603056", descricao: "Luz alcalina automática para colete Daniamant W4-A", categoria: "COLETES", codigoFabricante: "20603056", localizacao: "2", quantidade: 2, precoCompra: 4.471, precoVenda: 11.5 },
  { referencia: "20603058", descricao: "Clip para luzes Daniamant M4-A e W4-A", categoria: "COLETES", codigoFabricante: "20603058", localizacao: "2", quantidade: 2, precoCompra: 0.236, precoVenda: 0.8 },
  { referencia: "20603061", descricao: "Luz Interior Rl6 Daniamant", categoria: "BATERIAS", codigoFabricante: "20603061", localizacao: "3", quantidade: 3, precoCompra: 32.207, precoVenda: 75 },
  { referencia: "20604001", descricao: "Kit de programação OCEAN SIGNAL", categoria: "OCEAN SIGNAL", codigoFabricante: "20604001", localizacao: "1", quantidade: 1, precoCompra: 54.935, precoVenda: 110 },
  { referencia: "20604007", descricao: "Bateria LB2e para Radio Baliza Ocean SIGNAL", categoria: "OCEAN SIGNAL", codigoFabricante: "20604007", localizacao: "1", quantidade: 1, precoCompra: 110.949, precoVenda: 220 },
  { referencia: "20701002", descricao: "44 Libertador Hidrostático HAMMAR H20 Solas", categoria: "HAMMAR", codigoFabricante: "20701002", localizacao: "7", quantidade: 7, precoCompra: 29.763, precoVenda: 85 },
  { referencia: "20701020", descricao: "Gato Escape - HAM", categoria: "JANGADAS", codigoFabricante: "20701020", localizacao: "1", quantidade: 1, precoCompra: 20.375, precoVenda: 42 },
  { referencia: "20701022", descricao: "Cápsula ext. hammar p. Disparador MA1 cabo 125mm", categoria: "JANGADAS", codigoFabricante: "20701022", localizacao: "15", quantidade: 15, precoCompra: 15.287, precoVenda: 29.5 },
  { referencia: "20702022", descricao: "MANILHA GRANDE NAVTEC LONG 5/16", categoria: "JANGADAS", codigoFabricante: "20702022", localizacao: "2", quantidade: 2, precoCompra: 3.116, precoVenda: 6 },
  { referencia: "20702023", descricao: "MANILHA PEQUENA NAVTEC LONG 3/16", categoria: "JANGADAS", codigoFabricante: "20702023", localizacao: "3", quantidade: 3, precoCompra: 1.803, precoVenda: 7 },
  { referencia: "20903021", descricao: "Pilhas VART 4920", categoria: "PILHAS", codigoFabricante: "20903021", localizacao: "2", quantidade: 2, precoCompra: 1.07, precoVenda: 2 },
  { referencia: "20903168", descricao: "Pilha Alcalina Varta 4114 229 412 BL2", categoria: "PILHAS", codigoFabricante: "20903168", localizacao: "24", quantidade: 24, precoCompra: 0.688, precoVenda: 1.8 },
  { referencia: "20909107", descricao: "07 KIT REPARAÇÃO \"RFD\"", categoria: "KITS DE REPARAÇÃO", codigoFabricante: "20909107", localizacao: "18", quantidade: 18, precoCompra: 10.897, precoVenda: 67.5 },
  { referencia: "20909145", descricao: "Bobina Solúvel na água p/Coletes", categoria: "COLETES", codigoFabricante: "20909145", localizacao: "2", quantidade: 2, precoCompra: 3.775, precoVenda: 8 },
  { referencia: "20909152", descricao: "Cassete TZ-251 (Preto/Branco)", categoria: "CONSUMIVEIS", codigoFabricante: "20909152", localizacao: "3", quantidade: 3, precoCompra: 13.201, precoVenda: 25 },
  { referencia: "20909153", descricao: "Cassete TX-251 (Preto/Branco)", categoria: "CONSUMIVEIS", codigoFabricante: "20909153", localizacao: "4", quantidade: 4, precoCompra: 30.84, precoVenda: 55 },
  { referencia: "20909240", descricao: "UM Mk5 Auto Cartridge Black", categoria: "COLETES", codigoFabricante: "20909240", localizacao: "1", quantidade: 1, precoCompra: 5.361, precoVenda: 9.5 },
  { referencia: "20909266", descricao: "Insuflador A1 Hammar para coletes", categoria: "COLETES", codigoFabricante: "20909266", localizacao: "4", quantidade: 4, precoCompra: 15.852, precoVenda: 32 },
  { referencia: "20909295", descricao: "Lanterna com Luz e Pilhas Alcalinas sobressalentes", categoria: "LANTERNAS", codigoFabricante: "20909295", localizacao: "7", quantidade: 7, precoCompra: 6.672, precoVenda: 23.95 },
  { referencia: "21007013", descricao: "DAC 550 1L Detergente concentrado para sujidade entranhada", categoria: "DIVERSOS", codigoFabricante: "21007013", localizacao: "1", quantidade: 1, precoCompra: 7.877, precoVenda: 22.18 },
  { referencia: "21007014", descricao: "DAC 550 5L Detergente concentrado para sujidade entranhada", categoria: "DIVERSOS", codigoFabricante: "21007014", localizacao: "1", quantidade: 1, precoCompra: 30.833, precoVenda: 91.57 },
  { referencia: "22190208", descricao: "Manilha Inox 8mm 316 em Aço Inox", categoria: "DIVERSOS", codigoFabricante: "22190208", localizacao: "1", quantidade: 1, precoCompra: 0.833, precoVenda: 1.5 },
  { referencia: "22310019", descricao: "Vertedouro Plástico Branco", categoria: "VERTEDOUROS", codigoFabricante: "22310019", localizacao: "12", quantidade: 12, precoCompra: 1.216, precoVenda: 2.16 },
  { referencia: "22523631", descricao: "Retenida Flutuante Laranja 8mm 30m", categoria: "RETENIDAS", codigoFabricante: "22523631", localizacao: "2", quantidade: 2, precoCompra: 2.164, precoVenda: 5 },
  { referencia: "22540183", descricao: "Termo-higrómetro Antares 95 em latão polido", categoria: "DIVERSOS", codigoFabricante: "22540183", localizacao: "1", quantidade: 1, precoCompra: 21.644, precoVenda: 43 },
  { referencia: "22540195", descricao: "Barómetro Antares 95 em latão polido", categoria: "DIVERSOS", codigoFabricante: "22540195", localizacao: "1", quantidade: 1, precoCompra: 25.066, precoVenda: 52 },
  { referencia: "30201008", descricao: "Autocolante Não Solas Reversível", categoria: "AUTOCOLANTES", codigoFabricante: "30201008", localizacao: "18", quantidade: 18, precoCompra: 1.139, precoVenda: 3 },
  { referencia: "30201014", descricao: "Autocolante \"TOP\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201014", localizacao: "1", quantidade: 1, precoCompra: 28.404, precoVenda: 1.5 },
  { referencia: "30201022", descricao: "25 PROTEÇÃO CINTA APERTO", categoria: "CINTAS DE FECHO", codigoFabricante: "30201022", localizacao: "59", quantidade: 59, precoCompra: 2.138, precoVenda: 0 },
  { referencia: "30201024", descricao: "15 ETIQUETA \"INSTRUÇÕES\" - RFD", categoria: "AUTOCOLANTES", codigoFabricante: "30201024", localizacao: "5", quantidade: 5, precoCompra: 2.138, precoVenda: 0 },
  { referencia: "30201026", descricao: "Autocolante Instruções RFD Seasava", categoria: "AUTOCOLANTES", codigoFabricante: "30201026", localizacao: "20", quantidade: 20, precoCompra: 2.804, precoVenda: 6 },
  { referencia: "30201027", descricao: "Autocolante \"Step 1 DL\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201027", localizacao: "5", quantidade: 5, precoCompra: 2.276, precoVenda: 0 },
  { referencia: "30201028", descricao: "Autocolante \"Step 2 DL\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201028", localizacao: "5", quantidade: 5, precoCompra: 2.316, precoVenda: 0 },
  { referencia: "30201029", descricao: "Autocolante \"Step 3 DL\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201029", localizacao: "5", quantidade: 5, precoCompra: 2.023, precoVenda: 0 },
  { referencia: "30201030", descricao: "31 ACETATO - MANGA PLASTICA 1200x0,12 BD Cristal", categoria: "PLASTICO", codigoFabricante: "30201030", localizacao: "1", quantidade: 1, precoCompra: 1.761, precoVenda: 4 },
  { referencia: "30201032", descricao: "Autocolante Instruções de Jangadas DL", categoria: "AUTOCOLANTES", codigoFabricante: "30201032", localizacao: "1", quantidade: 1, precoCompra: 5.549, precoVenda: 0 },
  { referencia: "30201033", descricao: "Autocolante Instruções Jangadas DL 3-5", categoria: "AUTOCOLANTES", codigoFabricante: "30201033", localizacao: "2", quantidade: 2, precoCompra: 6.068, precoVenda: 0 },
  { referencia: "30201034", descricao: "Autocolante Seasava Plus", categoria: "AUTOCOLANTES", codigoFabricante: "30201034", localizacao: "2", quantidade: 2, precoCompra: 6.185, precoVenda: 0 },
  { referencia: "30201035", descricao: "Autocolante Logo Ferryman", categoria: "AUTOCOLANTES", codigoFabricante: "30201035", localizacao: "6", quantidade: 6, precoCompra: 4.24, precoVenda: 10 },
  { referencia: "30201036", descricao: "Autocolante Instruções Lançamento Jangadas Ferryman", categoria: "AUTOCOLANTES", codigoFabricante: "30201036", localizacao: "2", quantidade: 2, precoCompra: 6.305, precoVenda: 0 },
  { referencia: "30201063", descricao: "10 KIT DE REPARAÇÃO COMPLETO RFD", categoria: "KITS DE REPARAÇÃO", codigoFabricante: "30201063", localizacao: "2", quantidade: 2, precoCompra: 34.877, precoVenda: 67.5 },
  { referencia: "30201070", descricao: "S/A Label \"Persons\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201070", localizacao: "50", quantidade: 50, precoCompra: 4.672, precoVenda: 10 },
  { referencia: "30201071", descricao: "S/A Label \"6\"", categoria: "AUTOCOLANTES", codigoFabricante: "30201071", localizacao: "8", quantidade: 8, precoCompra: 4.067, precoVenda: 9 },
  { referencia: "30201078", descricao: "15 ETIQUETA \"NÃO ROLAR\" - RFD", categoria: "AUTOCOLANTES", codigoFabricante: "30201078", localizacao: "20", quantidade: 20, precoCompra: 1.831, precoVenda: 4 },
  { referencia: "30201079", descricao: "15 ETIQUETA \"APROVAÇÃO\" - RFD", categoria: "AUTOCOLANTES", codigoFabricante: "30201079", localizacao: "5", quantidade: 5, precoCompra: 2.226, precoVenda: 5 },
  { referencia: "30201086", descricao: "Cola Polychloroprene - 1 Litro", categoria: "KITS DE REPARAÇÃO", codigoFabricante: "30201086", localizacao: "1", quantidade: 1, precoCompra: 22.26, precoVenda: 45 },
  { referencia: "30201104", descricao: "Pad Protect Inlet Check Valve", categoria: "PROTECOES", codigoFabricante: "30201104", localizacao: "14", quantidade: 14, precoCompra: 2.346, precoVenda: 5 },
  { referencia: "30201105", descricao: "Pad Protect OP HD (GIST)", categoria: "PROTECOES", codigoFabricante: "30201105", localizacao: "4", quantidade: 4, precoCompra: 1.433, precoVenda: 3 },
  { referencia: "30201106", descricao: "Pad Protect OP HD DK99 U/Board", categoria: "PROTECOES", codigoFabricante: "30201106", localizacao: "14", quantidade: 14, precoCompra: 1.559, precoVenda: 2.5 },
  { referencia: "30201122", descricao: "Label Seasava 4P", categoria: "CINTAS DE FECHO", codigoFabricante: "30201122", localizacao: "10", quantidade: 10, precoCompra: 3.74, precoVenda: 8 }
];

async function seed() {
  console.log(`Iniciando importação de ${items.length} artigos para o Stock...`);
  for (const item of items) {
    const existing = await prisma.stock.findFirst({
      where: { referencia: item.referencia, serviceStationId: null }
    });
    if (existing) {
      await prisma.stock.update({
        where: { id: existing.id },
        data: {
          descricao: item.descricao,
          categoria: item.categoria,
          codigoFabricante: item.codigoFabricante,
          localizacao: item.localizacao,
          quantidade: item.quantidade,
          precoCompra: item.precoCompra,
          precoVenda: item.precoVenda,
          estadoArtigo: "ATIVO"
        }
      });
    } else {
      await prisma.stock.create({
        data: {
          referencia: item.referencia,
          descricao: item.descricao,
          categoria: item.categoria,
          codigoFabricante: item.codigoFabricante,
          localizacao: item.localizacao,
          quantidade: item.quantidade,
          precoCompra: item.precoCompra,
          precoVenda: item.precoVenda,
          estadoArtigo: "ATIVO",
          serviceStationId: null
        }
      });
    }
  }
  console.log("Importação de stock concluída com sucesso!");
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
