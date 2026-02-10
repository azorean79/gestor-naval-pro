const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });


const { PrismaClient } = require('@prisma/client');


// Inicializar PrismaClient puro para ambiente local
const prisma = new PrismaClient();



// Permite parametrização via argumentos de linha de comando
// Exemplo: node scripts/inspecionar-jangada.js 20 20 1014 1014 199 RFD-MKIV-ESP
const args = process.argv.slice(2);
const unidadePressao = process.env.UNIDADE_PRESSAO || 'mbar';
const tempInicial = args[0] !== undefined ? Number(args[0]) : 20; // °C
const tempFinal = args[1] !== undefined ? Number(args[1]) : 20;   // °C
const pressaoAtmInicial = args[2] !== undefined ? Number(args[2]) : 1014; // hPa
const pressaoAtmFinal = args[3] !== undefined ? Number(args[3]) : 1014;   // hPa
const pressaoFinalLida = args[4] !== undefined ? Number(args[4]) : 199; // mbar
const filtroNumeroSerie = args[5] !== undefined ? args[5] : 'NANCI MARIA';

// Correção de pressão final: para cada grau de aumento, subtrai 4 mbar
function calcularPressaoCorrigida(pressaoFinal, tInicial, tFinal) {
  const deltaT = tFinal - tInicial;
  const correcao = deltaT > 0 ? deltaT * 4 : 0;
  return pressaoFinal - correcao;
}

async function inspecionarJangada() {
  console.log('🔍 INSPEÇÃO DE JANGADAS - CERTIFICADOS 2025\n');

  try {
    // 0. CARREGAR LISTA DE JANGADAS DOS CERTIFICADOS 2025
    const certificadosPath = path.resolve(__dirname, '../certificados-orey-2025-final.json');
    if (!fs.existsSync(certificadosPath)) {
      console.error('❌ Arquivo de certificados 2025 não encontrado:', certificadosPath);
      process.exit(1);
    }
    const jangadasCertificados = JSON.parse(fs.readFileSync(certificadosPath, 'utf8'));
    console.log(`   📄 ${jangadasCertificados.length} jangadas encontradas nos certificados 2025.`);

    const ignoradas = [];
    const componentesRelatorio = [];
    for (const dadosJangada of jangadasCertificados) {
      const numeroSerie = dadosJangada.numeroSerie || dadosJangada.serie || '';
      // Filtrar por número de série se argumento fornecido
      if (filtroNumeroSerie && filtroNumeroSerie !== 'NANCI MARIA' && numeroSerie !== filtroNumeroSerie) {
        continue;
      }
      if (!numeroSerie) {
        ignoradas.push(dadosJangada);
        console.log('   ⚠️  Jangada sem número de série, ignorada.');
        continue;
      }
      // Procurar ou criar jangada
      let jangada = await prisma.jangada.findFirst({ where: { numeroSerie: { contains: numeroSerie } } });
      const dataUltimaInspecao = dadosJangada.dataUltimaInspecao ? new Date(dadosJangada.dataUltimaInspecao) : null;
      const dataProximaInspecao = dadosJangada.dataProximaInspecao ? new Date(dadosJangada.dataProximaInspecao) : null;
      if (!jangada) {
        jangada = await prisma.jangada.create({ data: {
          numeroSerie,
          marca: dadosJangada.marca || null,
          modelo: dadosJangada.modelo || null,
          tipoPack: dadosJangada.tipoPack || null,
          capacidade: dadosJangada.capacidade || null,
          dataFabrico: dadosJangada.dataFabrico ? new Date(dadosJangada.dataFabrico) : null,
          dataUltimaInspecao,
          dataProximaInspecao
        }});
        console.log(`   ✅ Jangada cadastrada: ${numeroSerie}`);
      } else {
        // Atualiza datas caso existam novas
        await prisma.jangada.update({
          where: { id: jangada.id },
          data: {
            dataUltimaInspecao,
            dataProximaInspecao
          }
        });
        console.log(`   🔄 Jangada já cadastrada: ${numeroSerie} (datas atualizadas)`);
      }

      // Navio
      const nomeNavio = dadosJangada.embarcacaoNome || 'NAVIO DESCONHECIDO';
      let embarcacao = await prisma.embarcacao.findFirst({ where: { nome: nomeNavio } });
      if (!embarcacao) {
        embarcacao = await prisma.embarcacao.create({ data: { nome: nomeNavio } });
        console.log(`      🚢 Navio cadastrado: ${nomeNavio}`);
      } else {
        console.log(`      🚢 Navio já cadastrado: ${nomeNavio}`);
      }

      // Armador
      const nomeArmador = dadosJangada.armadorNome || 'CLIENTE PADRÃO';
      let armador = await prisma.armador.findFirst({ where: { nome: nomeArmador } });
      if (!armador) {
        armador = await prisma.armador.create({ data: { nome: nomeArmador } });
        console.log(`      ⚓ Armador cadastrado: ${nomeArmador}`);
      } else {
        console.log(`      ⚓ Armador já cadastrado: ${nomeArmador}`);
      }

      // Associar jangada ao navio e armador
      await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          embarcacaoId: embarcacao.id,
          armadorId: armador.id
        }
      });
      console.log('      🔗 Jangada associada ao navio e armador.');

      // Criar agendamento no calendário se houver data de próxima inspeção
      // Determinar periodicidade: trianual para recreio, anual para pesca/RFD/DSB/Zodiac
      let periodicidade = 1; // padrão anual
      const tipoEmbarcacao = dadosJangada.embarcacaoTipo ? dadosJangada.embarcacaoTipo.toLowerCase() : '';
      const modeloJangada = (dadosJangada.modelo || '').toUpperCase();
      if (tipoEmbarcacao.includes('recreio')) {
        periodicidade = 3;
      } else if (tipoEmbarcacao.includes('pesca') || modeloJangada.includes('RFD') || modeloJangada.includes('DSB') || modeloJangada.includes('ZODIAC')) {
        periodicidade = 1;
      }
      // Se não houver dataProximaInspecao, calcular a próxima inspeção
      let dataAgendamento = null;
      if (dataProximaInspecao) {
        dataAgendamento = dataProximaInspecao;
      } else {
        // Se não houver, usar dataUltimaInspecao ou data de fabrico
        let base = dataUltimaInspecao || (dadosJangada.dataFabrico ? new Date(dadosJangada.dataFabrico) : new Date());
        dataAgendamento = new Date(base);
        dataAgendamento.setFullYear(dataAgendamento.getFullYear() + periodicidade);
      }
      if (dataAgendamento) {
        await prisma.agendamento.create({
          data: {
            titulo: `Inspeção ${periodicidade === 3 ? 'Trianual' : 'Anual'} - ${numeroSerie}`,
            descricao: `Inspeção ${periodicidade === 3 ? 'trianual' : 'anual'} da jangada ${numeroSerie} (extraída dos certificados 2025)`,
            dataInicio: dataAgendamento,
            dataFim: new Date(dataAgendamento.getTime() + 3 * 60 * 60 * 1000),
            tipo: 'inspecao',
            status: 'agendado',
            prioridade: 'alta',
            responsavel: 'Julio Correia',
            jangadaId: jangada.id
          }
        });
        console.log(`      📅 Agendamento criado para ${dataAgendamento.toLocaleDateString('pt-PT')} (${periodicidade === 3 ? 'trianual' : 'anual'})`);
      }

      // REGISTRAR COMPONENTES E VALIDADES E TESTES NO BANCO
      if (Array.isArray(dadosJangada.componentes) && dadosJangada.componentes.length > 0) {
        for (const comp of dadosJangada.componentes) {
          const nome = comp.nome || '';
          const quantidade = comp.quantidade || 1;
          const estado = comp.estado || 'OK';
          const validade = comp.validade ? new Date(comp.validade) : null;
          const testeRealizado = comp.testeRealizado || '';
          // Procurar componente existente
          let existente = await prisma.inspecaoComponente.findFirst({
            where: {
              jangadaId: jangada.id,
              nome: nome
            }
          });
          if (!existente) {
            await prisma.inspecaoComponente.create({
              data: {
                jangadaId: jangada.id,
                nome,
                quantidade,
                estado,
                validade,
                testeRealizado
              }
            });
          } else {
            await prisma.inspecaoComponente.update({
              where: { id: existente.id },
              data: {
                quantidade,
                estado,
                validade,
                testeRealizado
              }
            });
          }
        }
      }

      // Para relatório CSV
      const componentes = await prisma.inspecaoComponente.findMany({ where: { jangadaId: jangada.id } });
      for (const comp of componentes) {
        componentesRelatorio.push({
          numeroSerie,
          nomeJangada: dadosJangada.nome || '',
          embarcacaoNome: dadosJangada.embarcacaoNome || '',
          armadorNome: dadosJangada.armadorNome || '',
          marca: dadosJangada.marca || '',
          modelo: dadosJangada.modelo || '',
          capacidade: dadosJangada.capacidade || '',
          tipoPack: dadosJangada.tipoPack || '',
          dataFabrico: dadosJangada.dataFabrico || '',
          componenteNome: comp.nome || '',
          componenteQuantidade: comp.quantidade || '',
          componenteEstado: comp.estado || '',
          componenteValidade: comp.validade ? comp.validade.toISOString().split('T')[0] : '',
          testeRealizado: comp.testeRealizado || '',
        });
      }
    }
    // Salvar lista de ignoradas
    if (ignoradas.length > 0) {
      const ignoradasPath = path.resolve(__dirname, '../jangadas-ignoradas.csv');
      const header = 'indice,nome,embarcacaoNome,armadorNome,marca,modelo,capacidade,tipoPack,dataFabrico\n';
      const linhas = ignoradas.map((j, idx) => {
        return [
          idx + 1,
          j.nome || '',
          j.embarcacaoNome || '',
          j.armadorNome || '',
          j.marca || '',
          j.modelo || '',
          j.capacidade || '',
          j.tipoPack || '',
          j.dataFabrico || ''
        ].join(',');
      });
      fs.writeFileSync(ignoradasPath, header + linhas.join('\n'), 'utf8');
      console.log(`\n📋 Lista de jangadas ignoradas salva em jangadas-ignoradas.csv (${ignoradas.length} registros)`);
    }
      // Salvar componentes e validades e testes
      if (componentesRelatorio.length > 0) {
        const relatorioPath = path.resolve(__dirname, '../componentes-jangadas-certificados.csv');
        const header = 'numeroSerie,nomeJangada,embarcacaoNome,armadorNome,marca,modelo,capacidade,tipoPack,dataFabrico,componenteNome,componenteQuantidade,componenteEstado,componenteValidade,testeRealizado\n';
        const linhas = componentesRelatorio.map((c) => {
          return [
            c.numeroSerie,
            c.nomeJangada,
            c.embarcacaoNome,
            c.armadorNome,
            c.marca,
            c.modelo,
            c.capacidade,
            c.tipoPack,
            c.dataFabrico,
            c.componenteNome,
            c.componenteQuantidade,
            c.componenteEstado,
            c.componenteValidade,
            c.testeRealizado
          ].join(',');
        });
        fs.writeFileSync(relatorioPath, header + linhas.join('\n'), 'utf8');
        console.log(`\n📋 Relatório de componentes salvo em componentes-jangadas-certificados.csv (${componentesRelatorio.length} registros)`);
      }
    process.exit(0);

    // 2. OBTER COMPONENTES DA JANGADA
    console.log('\n2️⃣ Carregando componentes da jangada...');
    const componentes = await prisma.inspecaoComponente.findMany({
      where: { jangadaId: jangada.id }
    });

    console.log(`✅ ${componentes.length} componentes encontrados`);

    // 3. ANÁLISE DE VALIDADES
    console.log('\n3️⃣ Quadro de Inspeção - Análise de Validades\n');
    console.log('═'.repeat(110));
    console.log('COMPONENTE                           | QTDE | ESTADO | VALIDADE      | DIAS P/ EXPIRAR | STATUS      | AÇÃO');
    console.log('═'.repeat(110));

    const agora = new Date();
    const limiteSubstituicao = 12 * 30; // 12 meses em dias
    const itensASubstituir = [];
    let totalItensOK = 0;
    let totalItensAlerta = 0;
    let totalItensExpirados = 0;

    // Equivalência SIMPL. REDUZ. <-> OCR
    function isPackOCREquivalente(nome) {
      const n = nome.toUpperCase();
      return n.includes('SIMPL') || n.includes('REDUZ') || n.includes('OCR');
    }

    for (const comp of componentes) {
      // Se for pack simplificado reduzido ou OCR, tratar como equivalente
      let nomeComp = comp.nome;
      if (isPackOCREquivalente(comp.nome)) {
        nomeComp = 'PACK OCR (SIMPL. REDUZIDO)';
      }

      if (!comp.validade) {
        console.log(
          `${nomeComp.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${comp.estado?.padEnd(6) || 'OK    '} | Sem validade  | N/A             | ✅ OK       | -`
        );
        totalItensOK++;
        continue;
      }

      const diasParaExpirar = Math.ceil((comp.validade - agora) / (1000 * 60 * 60 * 24));
      let status = '✅ OK';
      let acao = '-';

      if (diasParaExpirar < 0) {
        status = '❌ EXPIRADO';
        acao = 'SUBSTITUIR';
        itensASubstituir.push({ ...comp, nome: nomeComp });
        totalItensExpirados++;
      } else if (diasParaExpirar < limiteSubstituicao) {
        status = '⚠️  ALERTA';
        acao = 'SUBSTITUIR';
        itensASubstituir.push({ ...comp, nome: nomeComp });
        totalItensAlerta++;
      } else {
        totalItensOK++;
      }

      const dataFormatada = comp.validade.toLocaleDateString('pt-PT');
      console.log(
        `${nomeComp.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${comp.estado?.padEnd(6) || 'OK    '} | ${dataFormatada.padEnd(13)} | ${String(diasParaExpirar).padEnd(15)} | ${status.padEnd(11)} | ${acao}`
      );
    }

    console.log('═'.repeat(110));

    // 4. RESUMO DA INSPEÇÃO
    console.log('\n4️⃣ Resumo da Inspeção\n');
    console.log(`   ✅ Itens OK (válidos):           ${totalItensOK}`);
    console.log(`   ⚠️  Itens com Alerta (< 12 mês): ${totalItensAlerta}`);
    console.log(`   ❌ Itens Expirados:              ${totalItensExpirados}`);
    console.log(`   📋 Total para substituir:        ${itensASubstituir.length}`);

    if (itensASubstituir.length === 0) {
      console.log('\n🎉 Inspeção OK - Nenhum item requer substituição!');
      process.exit(0);
    }

    // 5. ITENS PARA SUBSTITUIÇÃO
    console.log('\n5️⃣ Itens que Requerem Substituição\n');
    console.log('─'.repeat(110));
    console.log('COMPONENTE                           | QTDE | MOTIVO');
    console.log('─'.repeat(110));

    for (const comp of itensASubstituir) {
      const diasParaExpirar = Math.ceil((comp.validade - agora) / (1000 * 60 * 60 * 24));
      let motivo = '';

      if (diasParaExpirar < 0) {
        motivo = `Expirado há ${Math.abs(diasParaExpirar)} dias`;
      } else {
        motivo = `Expira em ${diasParaExpirar} dias (< 12 meses)`;
      }

      console.log(
        `${comp.nome.padEnd(34)} | ${String(comp.quantidade).padEnd(4)} | ${motivo}`
      );
    }

    // 6. MOVIMENTAÇÃO DE STOCK
    console.log('\n6️⃣ Processando Movimentação de Stock\n');

    for (const comp of itensASubstituir) {
      // Procurar item no stock
      const stockItem = await prisma.stock.findFirst({
        where: {
          nome: { contains: comp.nome.split('(')[0].trim() }
        }
      });

      if (stockItem) {
        if (stockItem.quantidade >= comp.quantidade) {
          // Criar movimentação de saída
          await prisma.movimentacaoStock.create({
            data: {
              stockId: stockItem.id,
              tipo: 'saida',
              quantidade: comp.quantidade,
              motivo: `Substituição - Inspeção Jangada ${jangada.numeroSerie}`,
              responsavel: 'Julio Correia'
            }
          });

          // Atualizar stock
          await prisma.stock.update({
            where: { id: stockItem.id },
            data: { quantidade: stockItem.quantidade - comp.quantidade }
          });

          console.log(`   ✅ ${comp.nome}: ${comp.quantidade} un. retirado do stock`);
        } else {
          console.log(`   ⚠️  ${comp.nome}: Quantidade insuficiente no stock (disponível: ${stockItem.quantidade}, necessário: ${comp.quantidade})`);
        }
      } else {
        console.log(`   ℹ️  ${comp.nome}: Não encontrado no stock`);
      }
    }

    // 7. CRIAR AGENDAMENTO PARA PRÓXIMA INSPEÇÃO
    console.log('\n7️⃣ Criando agendamento para próxima inspeção...');
    const proximaInspecao = new Date(agora);
    proximaInspecao.setFullYear(proximaInspecao.getFullYear() + 1);

    const agendamento = await prisma.agendamento.create({
      data: {
        titulo: `Inspeção Anual - ${jangada.numeroSerie}`,
        descricao: `Inspeção anual da jangada ${jangada.numeroSerie} com substituição de ${itensASubstituir.length} itens`,
        dataInicio: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
        dataFim: new Date(agora.getTime() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'alta',
        responsavel: 'Julio Correia',
        jangadaId: jangada.id
      }
    });

    console.log(`   ✅ Agendamento criado para ${proximaInspecao.toLocaleDateString('pt-PT')}`);

    // 8. RESUMO FINAL
    console.log('\n🎉 Inspeção Concluída!\n');
    console.log('📊 Relatório Final:');
    // Dados do cadastro da jangada
    console.log(`   🛳️  Jangada: ${jangada.numeroSerie}`);
    console.log(`   🏷️  Marca: ${jangada.marca || 'N/A'}`);
    console.log(`   🏷️  Modelo: ${jangada.modelo || 'N/A'}`);
    console.log(`   📦 Tipo de pack: ${jangada.tipoPack || 'N/A'}`);
    console.log(`   🗓️  Data de fabrico: ${jangada.dataFabrico ? new Date(jangada.dataFabrico).toLocaleDateString('pt-PT') : 'N/A'}`);
    console.log(`   👥 Lotação: ${jangada.capacidade || 'N/A'} pessoas`);
    console.log(`   📅 Data da inspeção: 02/01/2025`);
    console.log(`   👤 Responsável: Julio Correia`);
    // Dados gerais
    console.log(`   📋 Total componentes: ${componentes.length}`);
    console.log(`   ✅ Componentes OK: ${totalItensOK}`);
    console.log(`   ⚠️  Com Alerta: ${totalItensAlerta}`);
    console.log(`   ❌ Expirados: ${totalItensExpirados}`);
    console.log(`   🔄 Itens substituídos: ${itensASubstituir.length}`);
    console.log(`   📅 Próxima inspeção: ${proximaInspecao.toLocaleDateString('pt-PT')}`);
    // Adiciona anotação dos testes realizados e unidade de pressão dinâmica
    console.log('   🧪 Testes realizados: NAP - TEST (01-25), FS - TEST (01/25)');
    let unidadesDisponiveis = ['mbar', 'inH2O', 'inHg'];
    let outrasUnidades = unidadesDisponiveis.filter(u => u !== unidadePressao);
    console.log(`   📏 Ensaios de pressão realizados em ${unidadePressao}. Outras unidades disponíveis: ${outrasUnidades.join(', ')}.`);
    // Temperatura e pressão atmosférica
    console.log(`   🌡️ Temperatura durante o teste: Inicial = ${tempInicial}°C, Final = ${tempFinal}°C`);
    console.log(`   🧭 Pressão atmosférica: Inicial = ${pressaoAtmInicial} hPa, Final = ${pressaoAtmFinal} hPa`);
    // Correção de pressão final
    const pressaoFinalCorrigida = calcularPressaoCorrigida(pressaoFinalLida, tempInicial, tempFinal);
    if (tempFinal !== tempInicial) {
      console.log(`   ⚙️  Pressão final lida: ${pressaoFinalLida} mbar | Corrigida: ${pressaoFinalCorrigida} mbar (correção de -4 mbar/°C de aumento)`);
    } else {
      console.log(`   ⚙️  Pressão final lida: ${pressaoFinalLida} mbar (não houve variação de temperatura)`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
inspecionarJangada()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
