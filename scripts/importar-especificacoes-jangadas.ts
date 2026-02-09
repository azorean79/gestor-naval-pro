import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

const especificacoesPath = path.join(__dirname, '../especificacoes-jangadas.json');

async function importarEspecificacoes() {
  if (!fs.existsSync(especificacoesPath)) {
    console.error('Arquivo de especificações não encontrado. Rode o script de extração primeiro.');
    return;
  }
  const especificacoes = JSON.parse(fs.readFileSync(especificacoesPath, 'utf-8'));

  for (const item of especificacoes) {
    for (const linha of item.especificacoes) {
      await prisma.especificacaoJangada.create({
        data: {
          arquivo: item.arquivo,
          descricao: linha,
        }
      });
    }
  }
  console.log('Especificações importadas para o banco de dados.');
}

importarEspecificacoes().catch(console.error);
