import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Função para gerar declaração de isenção de IVA
export async function gerarDeclaracaoIVA({
  cliente,
  nif,
  morada,
  navio,
  matricula,
  portoRegisto,
  numeroSerie,
  data,
  outros = {}
}: {
  cliente: string;
  nif: string;
  morada: string;
  navio: string;
  matricula: string;
  portoRegisto: string;
  numeroSerie: string;
  data: Date;
  outros?: Record<string, string>;
}) {
  // Carrega o template Word
  const templatePath = join(process.cwd(), 'public', 'templates', 'TEMPLATE ISENÇÃO DE IVA.docx');
  // TODO: Usar biblioteca para substituir campos no template docx
  // Exemplo: usar docx-templates ou similar para merge
  // Aqui apenas cria um documento simples
  // Busca o último número de requisição salvo
  let numeroRequisicao = 1;
  const pasta = join(process.cwd(), 'DGRM');
  const anoAtual = new Date().getFullYear();
  const arquivoNumeracao = join(pasta, `numeracao-requisicao-${anoAtual}.txt`);
  try {
    const ultimo = readFileSync(arquivoNumeracao, 'utf-8');
    numeroRequisicao = parseInt(ultimo, 10) + 1;
  } catch {}
  writeFileSync(arquivoNumeracao, String(numeroRequisicao));

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun(`REQUISIÇÃO Nº-${numeroRequisicao.toString().padStart(3, '0')}/${anoAtual}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(`Declaração de isenção de IVA referente à inspeção de jangada com o número de série ${numeroSerie}`),
            ],
          }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  const nomeArquivo = join(pasta, `declaracao-iva-${cliente}-${data.toISOString().split('T')[0]}.docx`);
  writeFileSync(nomeArquivo, buffer);
  return nomeArquivo;
}
