import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Adicionando marca RFD e modelo MKIV...')

  try {
    // Criar ou buscar marca RFD
    const marca = await prisma.marcaJangada.upsert({
      where: { nome: 'RFD' },
      update: { ativo: true },
      create: { nome: 'RFD', ativo: true }
    });
    console.log(`✅ Marca RFD criada/atualizada com ID: ${marca.id}`);

    // Lista de modelos RFD com detalhes completos
    const modelos = [
      {
        nome: 'MKIV',
        sistemaInsuflacao: 'LEAFIELD',
        valvulasPadrao: 'OTS65',
        capacidade: 6,
        peso: 45,
        dimensoes: '110x60x40cm',
        acessorios: 'HRU, kit reparo, luz de emergência',
        variantes: 'SOLAS, COASTAL',
        certificacoes: 'SOLAS, MED',
        instrucoesInspecao: 'Inspecionar HRU, válvulas, kit reparo, luz',
        ativo: true
      },
      {
        nome: 'MKIV Plus',
        sistemaInsuflacao: 'LEAFIELD',
        valvulasPadrao: 'OTS65',
        capacidade: 8,
        peso: 52,
        dimensoes: '120x65x45cm',
        acessorios: 'HRU, kit reparo, luz de emergência, kit sobrevivência',
        variantes: 'SOLAS',
        certificacoes: 'SOLAS',
        instrucoesInspecao: 'Inspecionar HRU, válvulas, kit sobrevivência',
        ativo: true
      },
      {
        nome: 'MKIV Compact',
        sistemaInsuflacao: 'LEAFIELD',
        valvulasPadrao: 'OTS65',
        capacidade: 4,
        peso: 38,
        dimensoes: '90x50x35cm',
        acessorios: 'HRU, kit reparo',
        variantes: 'COASTAL',
        certificacoes: 'MED',
        instrucoesInspecao: 'Inspecionar HRU, válvulas, kit reparo',
        ativo: true
      }
    ];

    for (const modelo of modelos) {
      const existente = await prisma.modeloJangada.findFirst({
        where: { nome: modelo.nome, marcaId: marca.id }
      });
      if (!existente) {
        await prisma.modeloJangada.create({
          data: {
            nome: modelo.nome,
            marcaId: marca.id,
            sistemaInsuflacao: modelo.sistemaInsuflacao,
            valvulasPadrao: modelo.valvulasPadrao,
            // ...existing code...
            // peso property removed
            // dimensoes property removed
            // acessorios property removed
            // variantes property removed
            // certificacoes: modelo.certificacoes, // Removido pois não existe na tabela
            // instrucoesInspecao: modelo.instrucoesInspecao, // Removido pois não existe na tabela
            ativo: modelo.ativo
          }
        });
        console.log(`✅ Modelo criado: ${modelo.nome}`);
      } else {
        console.log(`ℹ️ Modelo já existe: ${modelo.nome}`);
      }
    }

    console.log('✨ Todos os modelos RFD foram criados/aprimorados com detalhes completos!');
  } catch (error) {
    console.error('❌ Erro ao adicionar marca e modelos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
