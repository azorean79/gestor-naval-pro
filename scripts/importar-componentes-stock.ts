import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

const especificacoesPath = path.join(__dirname, '../especificacoes-jangadas.json');

async function importarComponentesStock() {
  if (!fs.existsSync(especificacoesPath)) {
    console.error('Arquivo de especificações não encontrado. Rode o script de extração primeiro.');
    return;
  }
  const especificacoes = JSON.parse(fs.readFileSync(especificacoesPath, 'utf-8'));

  for (const item of especificacoes) {
    for (const linha of item.especificacoes) {
      // Busca por componentes e part numbers
      if (/part.?number|pn|componente|item|ref|referência|modelo|tipo/i.test(linha)) {
        await prisma.componenteStock.create({
          data: {
            arquivo: item.arquivo,
            descricao: linha,
            // Aqui pode-se adicionar lógica para extrair o part number, nome, tipo, etc.
          }
        });
      }
    }
  }
  console.log('Componentes importados para o estoque com part numbers e informações.');
}

importarComponentesStock().catch(console.error);
