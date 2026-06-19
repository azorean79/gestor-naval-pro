import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ClienteNavio {
  nome: string;
  nif: string;
  nomeNavio: string;
}

// Lista fornecida para verificação
const listaVerificacao: ClienteNavio[] = [
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
    nomeNavio: "PATRÍCIA CATARIN", // Nota: possivelmente incompleto
  },
];

async function verificarListaClientesNavios() {
  console.log(`\n✅ VERIFICAÇÃO DE LISTA DE CLIENTES E NAVIOS`);
  console.log(`${"=".repeat(100)}\n`);
  console.log(`Total de registos a verificar: ${listaVerificacao.length}\n`);

  let encontrados = 0;
  let naoEncontrados: Array<{ item: ClienteNavio; motivo: string }> = [];
  const resultado: string[] = [];

  for (const item of listaVerificacao) {
    // Normalizar nomes
    const nomeNormalizado = item.nome
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    const navioNormalizado = item.nomeNavio
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    console.log(`🔍 Verificando: ${nomeNormalizado} / ${navioNormalizado}`);

    // 1. Verificar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { nif: item.nif },
      include: { navios: true },
    });

    if (!cliente) {
      console.log(`  ❌ CLIENTE NÃO ENCONTRADO (NIF: ${item.nif})`);
      naoEncontrados.push({
        item,
        motivo: `Cliente não existe (NIF: ${item.nif})`,
      });
      resultado.push(
        `❌ FALTA CLIENTE: ${nomeNormalizado} (NIF: ${item.nif})`
      );
      continue;
    }

    // 2. Verificar navio
    const navio = cliente.navios.find(
      (n) => n.nome.toUpperCase() === navioNormalizado.toUpperCase()
    );

    if (!navio) {
      // Procurar no BD inteiro em caso de não estar associado ao cliente
      const navioGeral = await prisma.navio.findFirst({
        where: {
          nome: {
            mode: "insensitive",
            contains: navioNormalizado,
          },
        },
      });

      if (navioGeral) {
        if (navioGeral.clienteId !== cliente.id) {
          console.log(`  ⚠️  NAVIO EXISTE MAS NÃO ESTÁ ASSOCIADO AO CLIENTE`);
          console.log(`     Navio: ${navioGeral.nome} (ID: ${navioGeral.id})`);
          console.log(`     Cliente atual: ${navioGeral.cliente?.nome || "Nenhum"}`);
          naoEncontrados.push({
            item,
            motivo: `Navio existe mas associado a outro cliente`,
          });
          resultado.push(
            `⚠️  DESASSOCIADO: ${navioNormalizado} → precisa associar a ${nomeNormalizado}`
          );
        } else {
          console.log(`  ✅ ENCONTRADO`);
          encontrados++;
          resultado.push(`✅ OK: ${nomeNormalizado} / ${navioNormalizado}`);
        }
      } else {
        console.log(`  ❌ NAVIO NÃO EXISTE`);
        naoEncontrados.push({
          item,
          motivo: `Navio não existe: "${navioNormalizado}"`,
        });
        resultado.push(
          `❌ FALTA NAVIO: ${navioNormalizado} para cliente ${nomeNormalizado}`
        );
      }
    } else {
      console.log(`  ✅ ENCONTRADO`);
      encontrados++;
      resultado.push(`✅ OK: ${nomeNormalizado} / ${navioNormalizado}`);
    }
    console.log();
  }

  // Resumo
  console.log(`${"=".repeat(100)}`);
  console.log(`📊 RESUMO DA VERIFICAÇÃO`);
  console.log(`${"=".repeat(100)}`);
  console.log(`✅ Encontrados e corretos: ${encontrados}/${listaVerificacao.length}`);
  console.log(`❌ Problemas encontrados: ${naoEncontrados.length}/${listaVerificacao.length}`);
  console.log(`${"=".repeat(100)}\n`);

  if (naoEncontrados.length > 0) {
    console.log(`⚠️  ITENS COM PROBLEMAS:\n`);
    naoEncontrados.forEach((item) => {
      console.log(`  • ${item.item.nome} (NIF: ${item.item.nif})`);
      console.log(`    Navio: ${item.item.nomeNavio}`);
      console.log(`    Motivo: ${item.motivo}\n`);
    });
  }

  console.log(`${"=".repeat(100)}`);
  console.log(`📋 RESULTADO FINAL:\n`);
  resultado.forEach((r) => console.log(r));
  console.log(`${"=".repeat(100)}\n`);

  // Se todas as verificações passarem, mostrar status final
  if (naoEncontrados.length === 0) {
    console.log(`✅ PERFEITO! TODOS OS REGISTOS FORAM ENCONTRADOS E ESTÃO CORRETOS!\n`);
  } else {
    console.log(
      `⚠️  ${naoEncontrados.length} problema(s) encontrado(s). Revisar acima.\n`
    );
  }
}

verificarListaClientesNavios()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro na verificação:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
