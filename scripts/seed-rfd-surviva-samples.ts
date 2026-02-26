import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseLiferaftSurveyText(raw: string): any[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sections: { title: string; items: string[] }[] = [];
  let current: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(/^\d+\.\s*(.*)/);
    if (m) {
      if (current) sections.push(current);
      current = { title: m[1].trim(), items: [] };
      continue;
    }
    if (line === line.toUpperCase() && line.length > 3) {
      if (current) sections.push(current);
      current = { title: line, items: [] };
      continue;
    }
    if (current) {
      const parts = line.split(/\s{2,}|\s*-\s*|,\s*/).map(p => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (p.length > 3 && !/^Page No/i.test(p)) current.items.push(p);
      }
    }
  }
  if (current) sections.push(current);

  const checklist: any[] = [];
  let idCounter = 1;
  for (const s of sections) {
    const cat = s.title.length > 30 ? s.title.slice(0, 30) : s.title;
    if (s.items.length === 0) {
      checklist.push({ id: `srv-${idCounter++}`, categoria: cat, item: s.title, descricao: '', status: 'pendente', testes: [] });
    } else {
      for (const it of s.items) {
        checklist.push({ id: `srv-${idCounter++}`, categoria: cat, item: it, descricao: '', status: 'pendente', testes: [] });
      }
    }
  }
  return checklist;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const txtPath = path.join(process.cwd(), 'LIFERAFT TEST AND SURVEY REPORT.txt');
  let checklistTemplate: any[] = [];
  try {
    if (fs.existsSync(txtPath)) {
      const raw = fs.readFileSync(txtPath, 'utf8');
      checklistTemplate = parseLiferaftSurveyText(raw);
      console.log('Parsed checklist template with', checklistTemplate.length, 'items');
    } else {
      console.warn('Survey text not found, generating small default checklist');
      checklistTemplate = [
        { id: 'srv-1', categoria: 'Documentação', item: 'Certificado de Segurança', descricao: '', status: 'pendente', testes: [] },
        { id: 'srv-2', categoria: 'Equipamentos', item: 'Coletes Salva-Vidas', descricao: '', status: 'pendente', testes: [] },
      ];
    }
  } catch (e) {
    console.warn('Failed to parse survey text, using defaults', e);
    checklistTemplate = [
      { id: 'srv-1', categoria: 'Documentação', item: 'Certificado de Segurança', descricao: '', status: 'pendente', testes: [] },
    ];
  }

  // Ensure a test cliente exists
  const cliente = await prisma.cliente.upsert({
    where: { nif: '000000000' },
    update: { nome: 'Cliente RFD Surviva' },
    create: { nome: 'Cliente RFD Surviva', tipo: 'pessoa_juridica', nif: '000000000', email: 'rfd@example.local', numeroReferencia: 'CLI-RFD-000' },
  });

  const naviosCreated: any[] = [];
  const jangadasCreated: any[] = [];

  for (let i = 1; i <= 20; i++) {
    const nomeNavio = `Navio Exemplo RFD ${String(i).padStart(2, '0')}`;
    const imo = String(9000000 + i);
    const mmsi = String(200000000 + i);

    const navio = await prisma.navio.upsert({
      where: { imo },
      update: { nome: nomeNavio, mmsi },
      create: { nome: nomeNavio, imo, mmsi, tipo: 'fishing', proprietario: cliente.nome },
    });
    naviosCreated.push(navio);

    const numero = `JG-RFD-${String(i).padStart(3, '0')}`;
    const nomeJangada = `Jangada RFD Surviva ${String(i).padStart(2, '0')}`;
    const lotacao = randomInt(4, 50);

    const jangada = await prisma.jangada.upsert({
      where: { numero },
      update: {
        nome: nomeJangada,
        proprietario: cliente.nome,
        lotacao,
        marca: 'RFD',
        modelo: 'Surviva MKIV'
      },
      create: {
        numero,
        nome: nomeJangada,
        proprietario: cliente.nome,
        numeroSerie: `SN-${Date.now()}-${i}`,
        marca: 'RFD',
        modelo: 'Surviva MKIV',
        lotacao,
        status: 'ativo'
      },
    });

    jangadasCreated.push(jangada);

    // create an inspeção for the jangada
    const checklist = checklistTemplate.slice(0, Math.min(30, checklistTemplate.length)).map((c, idx) => ({ ...c, id: `${c.id}-${i}-${idx}` }));

    await prisma.inspecao.create({
      data: {
        equipamentoId: jangada.id,
        equipamentoNome: jangada.nome,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        tipoInspecao: 'rfd-surviva-mkiv-sample',
        tecnico: `Tec ${i}`,
        dataInspecao: new Date(),
        status: 'concluida',
        checklist: JSON.stringify(checklist),
        observacoesGerais: 'Seeded sample inspection synchronized with RFD Surviva MKIV manual'
      }
    });
  }

  console.log('Created', naviosCreated.length, 'navios and', jangadasCreated.length, 'jangadas with inspections');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
