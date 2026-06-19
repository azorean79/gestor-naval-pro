import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ClienteNavio {
  nome: string;
  nif: string;
  nomeNavio: string;
}

// Dados da lista fornecida - MAR 2025
const clientesNavios: ClienteNavio[] = [
  {
    nome: "João Natalino - Pesca, Unipessoal Lda",
    nif: "512066804",
    nomeNavio: "André e Tiago",
  },
  {
    nome: "Elias de Sousa & Filhos, Lda",
    nif: "512011031",
    nomeNavio: "Voz do Mar",
  },
  {
    nome: "Humberto Cabral da Rocha & Filhos, Lda",
    nif: "512012178",
    nomeNavio: "Ana Margarida / Silveira",
  },
  {
    nome: "Manuel Vieira Cabral Sebastião",
    nif: "126938221",
    nomeNavio: "Natividade de Jesus",
  },
  {
    nome: "André Filipe Pacheco da Silva",
    nif: "258296360",
    nomeNavio: "Mestre Silvino",
  },
  {
    nome: "Gil Manuel Cabral Vieira",
    nif: "196881773",
    nomeNavio: "Fábio e Messias",
  },
  {
    nome: "Daniel Miguel Vieira Andrade",
    nif: "211933096",
    nomeNavio: "Carla Flor",
  },
  {
    nome: "António Alberto Ponte dos Santos Arraial",
    nif: "129045430",
    nomeNavio: "Mestre Arraial",
  },
  {
    nome: "Flávia Andreia Cassis Melo",
    nif: "224673679",
    nomeNavio: "Patrícia Catarina",
  },
  {
    nome: "Manuel João Cabral Vieira",
    nif: "120539163",
    nomeNavio: "Mestre Vieira",
  },
  {
    nome: "Joaquim Pacheco Leitão Lda",
    nif: "512003187",
    nomeNavio: "Pérola da Praia / Amigos do Atlântico",
  },
  {
    nome: "Fernando Alves, Sociedade Unipessoal Lda",
    nif: "512067754",
    nomeNavio: "Bela Aurora",
  },
  {
    nome: "António Mineiro Pescas, Lda",
    nif: "512056345",
    nomeNavio: "Rei Cristo / Ponta dos Mosteiros",
  },
  {
    nome: "Piturros, Pesca Marítima, Lda",
    nif: "512046463",
    nomeNavio: "Débora Marisa",
  },
  {
    nome: "Eduardo Pacheco Soares & Filhos, Lda",
    nif: "512000579",
    nomeNavio: "Flor da Maia",
  },
  {
    nome: "Exclusivâncora, Lda",
    nif: "512063856",
    nomeNavio: "Maria Leontina",
  },
  {
    nome: "Tropipeixe - Pescas, Lda.",
    nif: "512042212",
    nomeNavio: "Ponta do Espartel",
  },
  {
    nome: "Pescafixe, Unipessoal, Lda.",
    nif: "512047915",
    nomeNavio: "Ilha Amarela",
  },
  {
    nome: "Eduíno Perinho, Unipessoal Lda",
    nif: "512042638",
    nomeNavio: "Alexandre",
  },
  {
    nome: "Seaexpert - Serviços e Consultadoria, Lda",
    nif: "512062531",
    nomeNavio: "Rainha da Calheta",
  },
  {
    nome: "Rajadas de Sorte - Pescas, Lda.",
    nif: "512066596",
    nomeNavio: "Mal Amanhado",
  },
];

async function updateClientesNavios() {
  console.log(`\n📊 ATUALIZANDO LISTA DE CLIENTES E NAVIOS (MAR 2025)...`);
  console.log(`Total de registos para processar: ${clientesNavios.length}\n`);

  let clientesAdicionados = 0;
  let clientesAtualizados = 0;
  let naviosAdicionados = 0;
  let naviosExistentes = 0;
  let naviosAjustados = 0;
  const relatorioNavios: string[] = [];

  for (const item of clientesNavios) {
    try {
      // 1. Verificar/Criar Cliente
      let cliente = await prisma.cliente.findUnique({
        where: { nif: item.nif },
      });

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: item.nome,
            nif: item.nif,
            ilha: "Açores", // Todos são dos Açores conforme a lista
            tipoCliente: item.nome.toUpperCase().includes("LDA")
              ? "Empresa"
              : "Pessoa Física",
          },
        });
        clientesAdicionados++;
        console.log(`✅ Cliente criado: ${item.nome} (NIF: ${item.nif})`);
      } else {
        // Atualizar se nome diferente
        if (cliente.nome !== item.nome) {
          cliente = await prisma.cliente.update({
            where: { nif: item.nif },
            data: { nome: item.nome },
          });
          clientesAtualizados++;
          console.log(`🔄 Cliente atualizado: ${item.nome} (NIF: ${item.nif})`);
        }
      }

      // 2. Verificar se navio já existe por nome
      let navio = await prisma.navio.findFirst({
        where: {
          nome: {
            in: [item.nomeNavio, ...item.nomeNavio.split(" / ")],
          },
        },
      });

      if (!navio) {
        // Criar novo navio
        navio = await prisma.navio.create({
          data: {
            nome: item.nomeNavio,
            matricula: "", // Será preenchido depois
            ilha: "Açores",
            tipoPesca: "Mista", // Valor padrão
            clienteId: cliente.id,
          },
        });
        naviosAdicionados++;
        console.log(`  ➕ Navio criado: ${item.nomeNavio}`);
        relatorioNavios.push(
          `✅ NOVO: ${item.nomeNavio} → ${item.nome} (NIF: ${item.nif})`
        );
      } else {
        naviosExistentes++;
        console.log(`  ℹ️  Navio já existe: ${item.nomeNavio}`);

        // Atualizar clienteId se não estiver associado
        if (!navio.clienteId || navio.clienteId !== cliente.id) {
          await prisma.navio.update({
            where: { id: navio.id },
            data: { clienteId: cliente.id },
          });
          naviosAjustados++;
          console.log(
            `  🔗 Navio associado ao cliente: ${item.nome} (NIF: ${item.nif})`
          );
          relatorioNavios.push(
            `🔗 ASSOCIADO: ${item.nomeNavio} → ${item.nome} (NIF: ${item.nif})`
          );
        } else {
          relatorioNavios.push(
            `✅ CONFIRMADO: ${item.nomeNavio} → ${item.nome} (NIF: ${item.nif})`
          );
        }
      }
    } catch (error) {
      console.error(`❌ Erro processando ${item.nome}: ${error}`);
      relatorioNavios.push(
        `❌ ERRO: ${item.nomeNavio} → ${item.nome}: ${error}`
      );
    }
  }

  // Gerar relatório final
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📋 RESUMO DA ATUALIZAÇÃO`);
  console.log(`${"=".repeat(70)}`);
  console.log(`✅ Clientes criados: ${clientesAdicionados}`);
  console.log(`🔄 Clientes atualizados: ${clientesAtualizados}`);
  console.log(`➕ Navios novos: ${naviosAdicionados}`);
  console.log(`✅ Navios já existentes: ${naviosExistentes}`);
  console.log(`🔗 Navios associados: ${naviosAjustados}`);
  console.log(`${"=".repeat(70)}\n`);

  console.log(`📊 RELATÓRIO DETALHADO DOS NAVIOS:`);
  console.log(`${"=".repeat(70)}`);
  relatorioNavios.forEach((r) => console.log(r));
  console.log(`${"=".repeat(70)}\n`);

  // Verificar navios na BD que não estão na lista
  const naviosTodasBD = await prisma.navio.findMany({
    include: { cliente: true },
    orderBy: { ilha: "asc" },
  });

  const naviosDaLista = new Set(
    clientesNavios.flatMap((cn) => [
      cn.nomeNavio,
      ...cn.nomeNavio.split(" / "),
    ])
  );

  const naviosNaoNaLista = naviosTodasBD.filter(
    (n) => !naviosDaLista.has(n.nome)
  );

  if (naviosNaoNaLista.length > 0) {
    console.log(`⚠️  NAVIOS NA BD QUE NÃO ESTÃO NA LISTA FORNECIDA:`);
    console.log(`${"=".repeat(70)}`);
    naviosNaoNaLista.slice(0, 20).forEach((n) => {
      console.log(
        `  • ${n.nome} (ID: ${n.id}) - Cliente: ${n.cliente?.nome || "Sem associação"}`
      );
    });
    if (naviosNaoNaLista.length > 20) {
      console.log(`  ... e ${naviosNaoNaLista.length - 20} mais`);
    }
    console.log();
  }

  // Listar todos os navios dos clientes Açores
  const clientesAçores = await prisma.cliente.findMany({
    where: { ilha: "Açores" },
    include: { navios: true },
    orderBy: { nome: "asc" },
  });

  console.log(`📋 CLIENTES DOS AÇORES E SEUS NAVIOS:`);
  console.log(`${"=".repeat(70)}`);
  clientesAçores.forEach((c) => {
    console.log(`\n${c.nome} (NIF: ${c.nif})`);
    if (c.navios.length > 0) {
      c.navios.forEach((n) => {
        console.log(`  └─ ${n.nome}`);
      });
    } else {
      console.log(`  └─ [Sem navios associados]`);
    }
  });
  console.log(`\n${"=".repeat(70)}\n`);
}

updateClientesNavios()
  .then(() => {
    console.log("✅ Atualização concluída com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na atualização:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
