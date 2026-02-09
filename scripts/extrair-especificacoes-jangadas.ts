import fs from 'fs';
import path from 'path';

const resultadosPath = path.join(__dirname, '../resultados-pdfs.json');

function extrairEspecificacoes(texto: string) {
  const termos = [
    'especifica[çc]ão', 'configura[çc]ão', 'torque', 'pressão', 'capacidade', 'dimens[ãa]o',
    'peso', 'material', 'lotação', 'cilindro', 'válvula', 'volume', 'comprimento', 'largura',
    'altura', 'diâmetro', 'tipo', 'modelo', 'certificado', 'norma', 'ISO', 'EN', 'SOLAS',
    'container', 'contentor', 'equipamento', 'manual', 'valvula', 'co2', 'n2', 'acessório',
    'acessórios', 'tabela', 'dados', 'parâmetro', 'parâmetros', 'potência', 'força', 'resistência',
    'tensão', 'corrente', 'frequência', 'volume', 'lotação', 'pessoas', 'tripulantes', 'tripulação'
  ];
  const regex = new RegExp(termos.join('|'), 'i');
  const linhas = texto.split('\n');
  return linhas.filter(l => regex.test(l));
}

function processarEspecificacoes() {
  if (!fs.existsSync(resultadosPath)) {
    console.error('Arquivo de resultados dos PDFs não encontrado. Rode o script de processamento primeiro.');
    return;
  }
  const resultados = JSON.parse(fs.readFileSync(resultadosPath, 'utf-8'));
  const especificacoes: any[] = [];

  for (const pdf of resultados) {
    const specs = extrairEspecificacoes(pdf.textSample);
    especificacoes.push({
      arquivo: pdf.path,
      especificacoes: specs
    });
  }

  fs.writeFileSync('especificacoes-jangadas.json', JSON.stringify(especificacoes, null, 2), 'utf-8');
  console.log('Especificações extraídas em especificacoes-jangadas.json');
}

processarEspecificacoes();
