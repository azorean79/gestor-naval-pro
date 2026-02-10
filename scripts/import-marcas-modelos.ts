// Script de importação de marcas, modelos, especificações e componentes
// Executar: npx tsx scripts/import-marcas-modelos.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Caminhos dos arquivos JSON
  const specsPath = path.resolve('technical-specs-detailed.json');
  const mkIIIPath = path.resolve('extracted_manuals', 'MkIII_tables.json');
  const seasavaPath = path.resolve('seasava-especificacoes-completas.json');
  const eurovinilPath = path.resolve('extracted_manuals', 'Eurovinil Leisure Syntesy Liferafts & Crewsaver ISO Type1(2) Mk 2 Mariner Mk 2_1_tables.json');
  const mkivPath = path.resolve('extracted_manuals', 'MK IV_tables.json');

  // Carregar dados
  const specs = JSON.parse(fs.readFileSync(specsPath, 'utf-8'));
  const mkIII = JSON.parse(fs.readFileSync(mkIIIPath, 'utf-8'));
  const seasava = JSON.parse(fs.readFileSync(seasavaPath, 'utf-8'));
  const eurovinil = JSON.parse(fs.readFileSync(eurovinilPath, 'utf-8'));
  const mkiv = JSON.parse(fs.readFileSync(mkivPath, 'utf-8'));

  // Importar marcas
  const marcas = [
    { nome: 'RFD', ativo: true },
    { nome: 'SEASAVA', ativo: true },
    { nome: 'Eurovinil', ativo: true },
    { nome: 'Crewsaver', ativo: true },
    { nome: 'Mariner', ativo: true },
    { nome: 'SURVIVA MKIV', ativo: true }
  ];
  for (const marca of marcas) {
    await prisma.marcaJangada.upsert({
      where: { nome: marca.nome },
      update: marca,
      create: marca
    });
  }

  // Importar modelos e especificações
  for (const item of specs) {
    const marca = await prisma.marcaJangada.findFirst({ where: { nome: item.fabricante } });
    if (!marca) continue;
    const modelo = await prisma.modeloJangada.upsert({
      where: { nome_marcaId: { nome: item.modelo, marcaId: marca.id } },
      update: { nome: item.modelo, marcaId: marca.id, sistemaInsuflacao: item.sistema_insuflacao, valvulasPadrao: item.valvulas_padrao.join(', ') },
      create: { nome: item.modelo, marcaId: marca.id, sistemaInsuflacao: item.sistema_insuflacao, valvulasPadrao: item.valvulas_padrao.join(', ') }
    });
    await prisma.especificacaoTecnica.create({
      data: {
        marcaId: marca.id,
        modeloId: modelo.id ?? "",
        lotacaoId: "",
        quantidadeCilindros: 1,
        pesoCO2: item.pressao_trabalho?.psi ?? undefined,
        pesoN2: undefined,
        volumeCilindro: undefined,
        referenciaCilindro: undefined,
        sistemaInsuflacao: item.sistema_insuflacao,
        tiposValvulas: item.valvulas_padrao.join(', ')
      }
    });
  }

  // Importar Eurovinil, Crewsaver, Mariner
  for (const tabela of eurovinil.data) {
    if (tabela.dados && tabela.dados.length > 0) {
      for (const linha of tabela.dados) {
        // Exemplo: identificar modelo/marca
        if (linha[0] && typeof linha[0] === 'string' && (linha[0].toLowerCase().includes('eurovinil') || linha[0].toLowerCase().includes('crewsaver') || linha[0].toLowerCase().includes('mariner'))) {
          const marcaNome = linha[0].split(' ')[0];
          const marca = await prisma.marcaJangada.findFirst({ where: { nome: marcaNome } });
          if (!marca) continue;
          const modeloNome = linha[0];
          await prisma.modeloJangada.upsert({
            where: { nome_marcaId: { nome: modeloNome, marcaId: marca.id } },
            update: { nome: modeloNome, marcaId: marca.id },
            create: { nome: modeloNome, marcaId: marca.id }
          });
        }
      }
    }
  }

  // Importar MkIV
  for (const tabela of mkiv.data) {
    if (tabela.dados && tabela.dados.length > 0) {
      for (const linha of tabela.dados) {
        if (linha[0] && typeof linha[0] === 'string' && (linha[0].toLowerCase().includes('mkiv') || linha[0].toLowerCase().includes('mk iv') || linha[0].toLowerCase().includes('crewsaver') || linha[0].toLowerCase().includes('eurovinil'))) {
          const marcaNome = linha[0].split(' ')[0];
          const marca = await prisma.marcaJangada.findFirst({ where: { nome: marcaNome } });
          if (!marca) continue;
          const modeloNome = linha[0];
          await prisma.modeloJangada.upsert({
            where: { nome_marcaId: { nome: modeloNome, marcaId: marca.id } },
            update: { nome: modeloNome, marcaId: marca.id },
            create: { nome: modeloNome, marcaId: marca.id }
          });
        }
      }
    }
  }

  // Importar componentes, boletins, torques, cilindros, válvulas, sistemas de insuflação
  const componentesSources = [mkIII, eurovinil, mkiv];
  for (const manual of componentesSources) {
    for (const tabela of manual.data) {
      if (tabela.dados && tabela.dados.length > 0) {
        for (const linha of tabela.dados) {
          const campos = Array.isArray(linha) ? linha : [linha];
          // Extração detalhada
          const nome = campos[0] ? String(campos[0]) : '';
          const descricao = campos[1] ? String(campos[1]) : '';
          const quantidade = campos[2] && !isNaN(Number(campos[2])) ? Number(campos[2]) : 1;
          const estado = campos[3] ? String(campos[3]) : 'ok';
          const dataValidade = campos[4] && !isNaN(Date.parse(campos[4])) ? new Date(campos[4]) : new Date();
          const observacoes = campos.slice(5).map(String).join(' | ');
          // Materiais
          if (nome.toLowerCase().includes('material')) {
            await prisma.stock.create({
              data: {
                nome,
                descricao,
                categoria: 'Material',
                quantidade,
                status: estado,
                localizacao: campos[5] ? String(campos[5]) : undefined,
                lote: campos[6] ? String(campos[6]) : undefined,
                codigoBarra: campos[7] ? String(campos[7]) : undefined,
                imagem: campos[8] ? String(campos[8]) : undefined,
                fornecedor: campos[9] ? String(campos[9]) : undefined
              }
            });
          }
          // Cilindros
          else if (nome.toLowerCase().includes('cilindro')) {
            await prisma.cilindro.create({
              data: {
                numeroSerie: descricao,
                tipo: observacoes,
                capacidade: quantidade,
                status: estado,
                dataFabricacao: dataValidade
              }
            });
          }
          // Válvulas
          else if (nome.toLowerCase().includes('valvula')) {
            await prisma.tipoValvula.create({
              data: {
                nome,
                descricao
              }
            });
          }
          // Sistemas de insuflação
          else if (nome.toLowerCase().includes('insuflacao')) {
            await prisma.sistemaCilindro.create({
              data: {
                nome,
                descricao
              }
            });
          }
          // Capacidades
          else if (nome.toLowerCase().includes('capacidade')) {
            await prisma.lotacaoJangada.create({
              data: {
                capacidade: quantidade,
                ativo: true
              }
            });
          }
          // Dimensões, peso, datas, notas, fornecedores, imagens, lote, localização
          else {
            await prisma.componentePack.create({
              data: {
                jangadaId: "",
                jangada: undefined,
                nome,
                descricao,
                quantidade,
                estado,
                dataValidade,
                observacoes
              }
            });
          }
          // Boletins de serviço
          if (nome && (nome.toLowerCase().includes('service bulletin') || nome.toLowerCase().includes('bulletin'))) {
            await prisma.stock.create({
              data: {
                nome,
                descricao,
                categoria: 'Boletim de Serviço',
                quantidade: 0,
                status: estado,
                localizacao: campos[5] ? String(campos[5]) : undefined,
                lote: campos[6] ? String(campos[6]) : undefined,
                codigoBarra: campos[7] ? String(campos[7]) : undefined,
                imagem: campos[8] ? String(campos[8]) : undefined,
                fornecedor: campos[9] ? String(campos[9]) : undefined
              }
            });
          }
        }
      }
    }
  }

  // Importar dados SEASAVA (exemplo)
  for (const item of seasava) {
    const marca = await prisma.marcaJangada.findFirst({ where: { nome: item.fabricante } });
    if (!marca) continue;
    await prisma.modeloJangada.upsert({
      where: { nome_marcaId: { nome: item.modelo, marcaId: marca.id } },
      update: { nome: item.modelo, marcaId: marca.id },
      create: { nome: item.modelo, marcaId: marca.id }
    });
    // Importar especificações detalhadas
    await prisma.especificacaoTecnica.create({
      data: {
        marcaId: marca.id,
        modeloId: "",
        lotacaoId: "",
        quantidadeCilindros: 1,
        pesoCO2: item.capacidades?.co2 ?? undefined,
        pesoN2: item.capacidades?.n2 ?? undefined,
        volumeCilindro: item.capacidades?.volume ?? undefined,
        referenciaCilindro: item.capacidades?.referencia ?? undefined,
        sistemaInsuflacao: item.sistema_insuflacao,
        tiposValvulas: Array.isArray(item.valvulas_padrao) ? item.valvulas_padrao.join(', ') : ''
      }
    });
    // Importar componentes
    if (item.caracteristicas_especiais && Array.isArray(item.caracteristicas_especiais)) {
      for (const comp of item.caracteristicas_especiais) {
        await prisma.componentePack.create({
          data: {
            jangadaId: "",
            jangada: undefined,
            nome: comp,
            descricao: '',
            quantidade: 1,
            estado: 'ok',
            dataValidade: new Date(),
            observacoes: ''
          }
        });
      }
    }
  }

  console.log('Importação concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
