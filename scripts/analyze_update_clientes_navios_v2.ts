import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ClienteNavio {
  nome: string;
  nif: string;
  nomeNavio: string;
}

// Dados atualizados da lista fornecida - MAR 2025 (versão corrigida com navios distintos)
const clientesNavios: ClienteNavio[] = [
  {
    nome: "JOÃO NATALINO - PESCA, UNIPESSOAL LDA",
    nif: "512066804",
    nomeNavio: "ANDRÉ E TIAGO",
  },
  {
    nome: "ELIAS DE SOUSA & FILHOS, LDA",
    nif: "512011031",
    nomeNavio: "VOZ DO MAR",
  },
  {
    nome: "MANUEL VIEIRA CABRAL SEBASTIÃO",
    nif: "126938221",
    nomeNavio: "NATIVIDADE DE JESUS",
  },
  {
    nome: "ANDRÉ FILIPE PACHECO DA SILVA",
    nif: "258296360",
    nomeNavio: "MESTRE SILVINO",
  },
  {
    nome: "GIL MANUEL CABRAL VIEIRA",
    nif: "196881773",
    nomeNavio: "FÁBIO E MESSIAS",
  },
  {
    nome: "DANIEL MIGUEL VIEIRA ANDRADE",
    nif: "211933096",
    nomeNavio: "CARLA FLOR",
  },
  {
    nome: "ANTÓNIO ALBERTO PONTE DOS SANTOS ARRAIAL",
    nif: "129045430",
    nomeNavio: "MESTRE ARRAIAL",
  },
  {
    nome: "MANUEL JOÃO CABRAL VIEIRA",
    nif: "120539163",
    nomeNavio: "MESTRE VIEIRA",
  },
  {
    nome: "HUMBERTO CABRAL DA ROCHA & FILHOS, LDA",
    nif: "512012178",
    nomeNavio: "ANA MARGARIDA",
  },
  {
    nome: "HUMBERTO CABRAL DA ROCHA & FILHOS, LDA",
    nif: "512012178",
    nomeNavio: "SILVEIRA",
  },
  {
    nome: "FLÁVIA ANDREIA CASSIS MELO",
    nif: "224673679",
    nomeNavio: "PATRÍCIA CATARINA",
  },
];

async function analyzeAndUpdateClientesNavios() {
  console.log(`\n📊 ANÁLISE E ATUALIZAÇÃO DETALHADA DE CLIENTES E NAVIOS (MAR 2025)...`);
  console.log(`Total de registos para processar: ${clientesNavios.length}\n`);

  let clientesAtualizados = 0;
  let naviosAdicionados = 0;
  let naviosAtualizados = 0;
  let naviosConfirmados = 0;
  const relatorioDetalhado: string[] = [];

  // Mapa para rastrear clientes já processados
  const clientesProcessados = new Map<
    string,
    { id: number; nome: string; navios: string[] }
  >();

  for (const item of clientesNavios) {
    try {
      // 1. Normalizar dados (converter para title case)
      const nomeNormalizado = item.nome
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
      const navioNormalizado = item.nomeNavio
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      // 2. Verificar/Atualizar Cliente
      let cliente = await prisma.cliente.findUnique({
        where: { nif: item.nif },
      });

      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: nomeNormalizado,
            nif: item.nif,
            ilha: "Açores",
            tipoCliente: nomeNormalizado.toUpperCase().includes("LDA")
              ? "Empresa"
              : "Pessoa Física",
          },
        });
        console.log(`✅ NOVO Cliente: ${nomeNormalizado} (NIF: ${item.nif})`);
        relatorioDetalhado.push(
          `✅ NOVO Cliente: ${nomeNormalizado} (NIF: ${item.nif})`
        );
      } else {
        // Atualizar nome se diferente (normalizar)
        if (
          cliente.nome.toUpperCase() !== nomeNormalizado.toUpperCase()
        ) {
          cliente = await prisma.cliente.update({
            where: { nif: item.nif },
            data: { nome: nomeNormalizado },
          });
          clientesAtualizados++;
          console.log(
            `🔄 Cliente ATUALIZADO: ${nomeNormalizado} (NIF: ${item.nif})`
          );
          relatorioDetalhado.push(
            `🔄 Cliente ATUALIZADO: ${nomeNormalizado} (NIF: ${item.nif})`
          );
        } else {
          console.log(
            `ℹ️  Cliente existe: ${nomeNormalizado} (NIF: ${item.nif})`
          );
        }
      }

      // Rastrear clientes processados
      if (!clientesProcessados.has(item.nif)) {
        clientesProcessados.set(item.nif, {
          id: cliente.id,
          nome: nomeNormalizado,
          navios: [],
        });
      }
      clientesProcessados.get(item.nif)!.navios.push(navioNormalizado);

      // 3. Verificar/Atualizar Navio
      let navio = await prisma.navio.findFirst({
        where: {
          nome: {
            mode: "insensitive", // Case-insensitive search
            equals: navioNormalizado,
          },
        },
      });

      if (!navio) {
        navio = await prisma.navio.create({
          data: {
            nome: navioNormalizado,
            matricula: "",
            ilha: "Açores",
            tipoPesca: "Mista",
            clienteId: cliente.id,
          },
        });
        naviosAdicionados++;
        console.log(`  ➕ NOVO Navio: ${navioNormalizado}`);
        relatorioDetalhado.push(
          `  ➕ NOVO Navio: ${navioNormalizado} → ${nomeNormalizado} (NIF: ${item.nif})`
        );
      } else {
        // Verificar se está associado ao cliente correto
        if (!navio.clienteId || navio.clienteId !== cliente.id) {
          await prisma.navio.update({
            where: { id: navio.id },
            data: { clienteId: cliente.id },
          });
          naviosAtualizados++;
          console.log(
            `  🔗 Navio ASSOCIADO: ${navioNormalizado} → ${nomeNormalizado}`
          );
          relatorioDetalhado.push(
            `  🔗 Navio ASSOCIADO: ${navioNormalizado} → ${nomeNormalizado} (NIF: ${item.nif})`
          );
        } else {
          naviosConfirmados++;
          console.log(`  ✅ Navio CONFIRMADO: ${navioNormalizado}`);
          relatorioDetalhado.push(
            `  ✅ Navio CONFIRMADO: ${navioNormalizado} → ${nomeNormalizado}`
          );
        }
      }
    } catch (error) {
      console.error(`❌ Erro processando ${item.nome} / ${item.nomeNavio}: ${error}`);
      relatorioDetalhado.push(
        `❌ ERRO: ${item.nome} / ${item.nomeNavio}: ${error}`
      );
    }
  }

  // Gerar relatório final detalhado
  console.log(`\n${"=".repeat(80)}`);
  console.log(`📋 RESUMO FINAL DA ANÁLISE E ATUALIZAÇÃO`);
  console.log(`${"=".repeat(80)}`);
  console.log(`🔄 Clientes atualizados: ${clientesAtualizados}`);
  console.log(`➕ Navios novos adicionados: ${naviosAdicionados}`);
  console.log(`🔗 Navios associados aos clientes: ${naviosAtualizados}`);
  console.log(`✅ Navios confirmados: ${naviosConfirmados}`);
  console.log(`${"=".repeat(80)}\n`);

  // Listar clientes processados com múltiplos navios
  console.log(`📊 CLIENTES COM MÚLTIPLOS NAVIOS (VERIFICADOS):`);
  console.log(`${"=".repeat(80)}`);
  const clientesComMultiplosNavios = Array.from(clientesProcessados.values()).filter(
    (c) => c.navios.length > 1
  );

  if (clientesComMultiplosNavios.length > 0) {
    clientesComMultiplosNavios.forEach((cliente) => {
      console.log(`\n${cliente.nome}`);
      cliente.navios.forEach((navio) => {
        console.log(`  ├─ ${navio}`);
      });
    });
  } else {
    console.log("Nenhum cliente com múltiplos navios encontrado.");
  }
  console.log(`${"=".repeat(80)}\n`);

  // Relatório detalhado
  console.log(`📋 RELATÓRIO DETALHADO:`);
  console.log(`${"=".repeat(80)}`);
  relatorioDetalhado.forEach((r) => console.log(r));
  console.log(`${"=".repeat(80)}\n`);

  // Validação final: listar todos os clientes dos Açores com seus navios
  const clientesAçoresCompletos = await prisma.cliente.findMany({
    where: { ilha: "Açores" },
    include: {
      navios: {
        orderBy: { nome: "asc" },
      },
    },
    orderBy: { nome: "asc" },
  });

  console.log(`📋 ESTADO FINAL - CLIENTES DOS AÇORES E SEUS NAVIOS:`);
  console.log(`${"=".repeat(80)}`);
  console.log(`Total de clientes dos Açores: ${clientesAçoresCompletos.length}\n`);

  clientesAçoresCompletos.forEach((cliente) => {
    console.log(`${cliente.nome} (NIF: ${cliente.nif})`);
    if (cliente.navios.length > 0) {
      cliente.navios.forEach((navio, idx) => {
        const isLast = idx === cliente.navios.length - 1;
        console.log(`  ${isLast ? "└─" : "├─"} ${navio.nome}`);
      });
    } else {
      console.log(`  └─ [Sem navios associados]`);
    }
    console.log();
  });
  console.log(`${"=".repeat(80)}\n`);

  // Gerar CSV para exportação (opcional)
  console.log(`📄 DADOS EM FORMATO CSV (para exportação):`);
  console.log(`${"=".repeat(80)}`);
  console.log(`Nome do Beneficiário,NIF,Nome do Navio`);
  clientesAçoresCompletos.forEach((cliente) => {
    if (cliente.navios.length > 0) {
      cliente.navios.forEach((navio) => {
        console.log(
          `"${cliente.nome}","${cliente.nif}","${navio.nome}"`
        );
      });
    } else {
      console.log(`"${cliente.nome}","${cliente.nif}",""`);
    }
  });
  console.log(`${"=".repeat(80)}\n`);
}

analyzeAndUpdateClientesNavios()
  .then(() => {
    console.log("✅ Análise e atualização concluídas com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na atualização:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
