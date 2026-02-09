// Função utilitária para gerar ficha de identificação de jangada em formato Word (docx)
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';

export async function gerarFichaIdentificacaoJangada({
  numeroSerie,
  marca,
  modelo,
  capacidade,
  anoFabricacao,
  paisFabricacao,
  cliente,
  dataInspecao,
  outrosDados = {}
}: {
  numeroSerie: string;
  marca: string;
  modelo: string;
  capacidade: string;
  anoFabricacao: string;
  paisFabricacao: string;
  cliente: string;
  dataInspecao: string;
  outrosDados?: Record<string, string>;
}) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Ficha de Identificação de Jangada', bold: true, size: 32 }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph(`Número de Série: ${numeroSerie}`),
          new Paragraph(`Marca: ${marca}`),
          new Paragraph(`Modelo: ${modelo}`),
          new Paragraph(`Capacidade: ${capacidade}`),
          new Paragraph(`Ano de Fabricação: ${anoFabricacao}`),
          new Paragraph(`País de Fabricação: ${paisFabricacao}`),
          new Paragraph(`Cliente: ${cliente}`),
          new Paragraph(`Data da Inspeção: ${dataInspecao}`),
          ...Object.entries(outrosDados).map(([k, v]) => new Paragraph(`${k}: ${v}`)),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(`./DGRM/ficha de identificação de jangada - ${numeroSerie}.docx`, buffer);
}

// Exemplo de uso:
// gerarFichaIdentificacaoJangada({
//   numeroSerie: 'RFD12345',
//   marca: 'RFD',
//   modelo: 'MKIV',
//   capacidade: '10',
//   anoFabricacao: '2022',
//   paisFabricacao: 'Inglaterra',
//   cliente: 'Navio X',
//   dataInspecao: '07/02/2026',
// });
