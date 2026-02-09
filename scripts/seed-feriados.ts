import { prisma } from '../src/lib/prisma';

async function seedFeriados() {
  console.log('🌟 Populando feriados...');

  const feriados = [
    // Feriados Nacionais
    { nome: 'Ano Novo', data: '2024-01-01', tipo: 'nacional', recorrente: true },
    { nome: 'Sexta-feira Santa', data: '2024-03-29', tipo: 'nacional', recorrente: false },
    { nome: 'Páscoa', data: '2024-03-31', tipo: 'nacional', recorrente: false },
    { nome: '25 de Abril', data: '2024-04-25', tipo: 'nacional', recorrente: true },
    { nome: 'Dia do Trabalhador', data: '2024-05-01', tipo: 'nacional', recorrente: true },
    { nome: 'Corpo de Deus', data: '2024-05-30', tipo: 'nacional', recorrente: false },
    { nome: 'Dia de Portugal', data: '2024-06-10', tipo: 'nacional', recorrente: true },
    { nome: 'Assunção de Nossa Senhora', data: '2024-08-15', tipo: 'nacional', recorrente: true },
    { nome: 'Implantação da República', data: '2024-10-05', tipo: 'nacional', recorrente: true },
    { nome: 'Dia de Todos os Santos', data: '2024-11-01', tipo: 'nacional', recorrente: true },
    { nome: 'Restauração da Independência', data: '2024-12-01', tipo: 'nacional', recorrente: true },
    { nome: 'Imaculada Conceição', data: '2024-12-08', tipo: 'nacional', recorrente: true },
    { nome: 'Natal', data: '2024-12-25', tipo: 'nacional', recorrente: true },

    // Carnaval (terça-feira de carnaval)
    { nome: 'Carnaval', data: '2024-02-13', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2025-03-04', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2026-02-17', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2027-02-09', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2028-02-29', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2029-02-13', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },
    { nome: 'Carnaval', data: '2030-03-04', tipo: 'nacional', recorrente: false, descricao: 'Terça-feira de Carnaval' },

    // Feriados Regionais dos Açores
    { nome: 'Dia de São Miguel', data: '2024-05-08', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Pedro', data: '2024-06-29', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São João', data: '2024-06-24', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Santo António', data: '2024-06-13', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São José', data: '2024-03-19', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Nossa Senhora da Conceição', data: '2024-12-08', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Santa Cruz', data: '2024-05-03', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Jorge', data: '2024-04-23', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Tiago', data: '2024-07-25', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Mateus', data: '2024-09-21', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Miguel', data: '2024-09-29', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Todos os Santos', data: '2024-11-01', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia da Autonomia', data: '2024-05-08', tipo: 'regional', regiao: 'Açores', recorrente: true },

    // Feriados para anos recorrentes (usando 2000 como base para feriados recorrentes)
    { nome: 'Ano Novo', data: '2000-01-01', tipo: 'nacional', recorrente: true },
    { nome: '25 de Abril', data: '2000-04-25', tipo: 'nacional', recorrente: true },
    { nome: 'Dia do Trabalhador', data: '2000-05-01', tipo: 'nacional', recorrente: true },
    { nome: 'Dia de Portugal', data: '2000-06-10', tipo: 'nacional', recorrente: true },
    { nome: 'Assunção de Nossa Senhora', data: '2000-08-15', tipo: 'nacional', recorrente: true },
    { nome: 'Implantação da República', data: '2000-10-05', tipo: 'nacional', recorrente: true },
    { nome: 'Dia de Todos os Santos', data: '2000-11-01', tipo: 'nacional', recorrente: true },
    { nome: 'Restauração da Independência', data: '2000-12-01', tipo: 'nacional', recorrente: true },
    { nome: 'Imaculada Conceição', data: '2000-12-08', tipo: 'nacional', recorrente: true },
    { nome: 'Natal', data: '2000-12-25', tipo: 'nacional', recorrente: true },

    // Feriados Regionais dos Açores (recorrentes)
    { nome: 'Dia de São Miguel (Terceira)', data: '2000-05-08', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Pedro (São Miguel)', data: '2000-06-29', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São João (Terceira)', data: '2000-06-24', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Santo António (São Miguel)', data: '2000-06-13', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São José (Santa Maria)', data: '2000-03-19', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Nossa Senhora da Conceição (Flores)', data: '2000-12-08', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de Santa Cruz (Graciosa)', data: '2000-05-03', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Jorge (São Jorge)', data: '2000-04-23', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Tiago (Angra)', data: '2000-07-25', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Mateus (São Mateus)', data: '2000-09-21', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia de São Miguel (Ponta Delgada)', data: '2000-09-29', tipo: 'regional', regiao: 'Açores', recorrente: true },
    { nome: 'Dia da Autonomia dos Açores', data: '2000-05-08', tipo: 'regional', regiao: 'Açores', recorrente: true },
  ];

  for (const feriado of feriados) {
    try {
      await prisma.feriado.upsert({
        where: {
          nome_data: {
            nome: feriado.nome,
            data: new Date(feriado.data)
          }
        },
        update: {
          ...feriado,
          data: new Date(feriado.data)
        },
        create: {
          ...feriado,
          data: new Date(feriado.data)
        }
      });
      console.log(`✅ ${feriado.nome} - ${feriado.data}`);
    } catch (error) {
      console.log(`❌ Erro ao criar ${feriado.nome}:`, error);
    }
  }

  console.log('🎉 Feriados populados com sucesso!');
}

async function main() {
  try {
    await seedFeriados();
  } catch (error) {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();