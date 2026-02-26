import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

const prisma = new PrismaClient();

function sanitizeString(value?: string) {
  if (!value) return value;
  try {
    return value.normalize('NFKC').replace(/\u2026/g, '...');
  } catch (e) {
    return value.replace(/\u2026/g, '...');
  }
}

function sanitizeForPrisma(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForPrisma);
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      out[k] = sanitizeForPrisma(obj[k]);
    }
    return out;
  }
  return obj;
}

function sanitizeChecklist(obj: any): any {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeChecklist);
  if (typeof obj === 'object') {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string') out[k] = sanitizeString(v);
      else out[k] = sanitizeChecklist(v);
    }
    return out;
  }
  return obj;
}

// GET - Buscar inspeções
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const equipamentoId = sanitizeString(searchParams.get('equipamentoId') || undefined);
    const clienteId = sanitizeString(searchParams.get('clienteId') || undefined);
    const status = sanitizeString(searchParams.get('status') || undefined);

    const where: any = {};

    if (equipamentoId) where.equipamentoId = equipamentoId;
    if (clienteId) where.clienteId = clienteId;
    if (status) where.status = status;

    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 500;
    const skip = (page - 1) * limit;

    let inspecoes: any[] = [];
    let total = 0;
    try {
      const safeWhere = sanitizeForPrisma(where);
      const [found, count] = await Promise.all([
        prisma.inspecao.findMany({ where: safeWhere, orderBy: { dataInspecao: 'desc' }, skip, take: limit }),
        prisma.inspecao.count({ where: safeWhere }),
      ]);
      inspecoes = found;
      total = count;
    } catch (err) {
      console.warn('Prisma error fetching inspecoes, returning empty list:', err);
      inspecoes = [];
      total = 0;
    }

    // Parse checklist JSON for each inspection
    const inspecoesParsed = inspecoes.map(inspecao => ({
      ...inspecao,
      checklist: JSON.parse(inspecao.checklist || '[]')
    }));

    return NextResponse.json({ data: inspecoesParsed, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Erro ao buscar inspeções:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar inspeções' },
      { status: 500 }
    );
  }
}

// POST - Criar nova inspeção
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // sanitize incoming fields
    body.tipoInspecao = sanitizeString(body.tipoInspecao);
    body.tecnico = sanitizeString(body.tecnico);
    body.observacoesGerais = sanitizeString(body.observacoesGerais);
    const {
      equipamentoId,
      equipamentoNome,
      clienteId,
      clienteNome,
      tipoInspecao,
      tecnico,
      dataInspecao,
      checklist,
      observacoesGerais
    } = body;

    // Buscar cliente. The UI sometimes sends a cliente identifier that is
    // actually the cliente `id`, but offline/mock data uses the cliente name
    // (proprietario). Try id lookup first, then fall back to name/numeroReferencia.
    let cliente = null;
    try {
      const safeClienteId = sanitizeString(clienteId);
      if (safeClienteId) {
        cliente = await prisma.cliente.findUnique({ where: { id: safeClienteId } });
      }

      if (!cliente && safeClienteId) {
        // try match by nome or numeroReferencia for mock/offline cases
        cliente = await prisma.cliente.findFirst({
          where: {
            OR: [
              { nome: safeClienteId },
              { numeroReferencia: safeClienteId }
            ]
          }
        });
      }
    } catch (err) {
      console.error('Prisma error finding cliente:', err);
      return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }

    if (!cliente) {
      // Cliente não encontrado no DB — não bloqueamos a criação da inspeção.
      // Usaremos o nome enviado pelo cliente (clienteNome) ou o identificador
      // enviado (clienteId) como fallback para persistir a inspeção.
      console.warn('Cliente não encontrado no DB, continuando com dados fornecidos:', clienteId, clienteNome);
      cliente = { id: String(clienteId || `offline-${Date.now()}`), nome: clienteNome || String(clienteId || 'Cliente desconhecido') } as any;
    }

    // Gerar checklist padrão baseado no tipo de equipamento
    let equipamento = await prisma.navio.findUnique({ where: { id: equipamentoId } });
    if (!equipamento) {
      equipamento = await prisma.jangada.findUnique({ where: { id: equipamentoId } });
    }

    if (!equipamento) {
      // Equipamento não existe no DB (provavelmente estamos a usar dados "mock" no cliente).
      // Criar um objeto mínimo para permitir gerar o checklist padrão.
      console.warn('Equipamento não encontrado no DB, usando fallback com valores fornecidos:', equipamentoId);
      equipamento = {
        id: equipamentoId,
        nome: sanitizeString(equipamentoNome || equipamentoId),
        numeroSerie: sanitizeString((body && (body.numeroSerie || body.numero)) || equipamentoId)
      } as any;
    }

    const checklistPadrao = await gerarChecklistPadrao(tipoInspecao, equipamento);

    // Prefer client-provided checklist when present, otherwise use generated one.
    const checklistToSave = (checklist && checklist.length)
      ? sanitizeChecklist(checklist)
      : sanitizeChecklist(checklistPadrao);

    let inspecao;
    try {
      inspecao = await prisma.inspecao.create({
          data: {
            equipamentoId,
            equipamentoNome: sanitizeString(equipamento.nome),
            clienteId,
            clienteNome: sanitizeString(cliente.nome),
            tipoInspecao: sanitizeString(tipoInspecao),
            tecnico: sanitizeString(tecnico),
            dataInspecao: new Date(dataInspecao),
            status: 'em_andamento',
            checklist: JSON.stringify(checklistToSave),
            observacoesGerais: sanitizeString(observacoesGerais)
          }
        });
    } catch (err) {
      console.error('Prisma error creating inspecao:', err);
      return NextResponse.json({ error: 'Erro ao criar inspeção (DB)' }, { status: 500 });
    }

    // Parse checklist back for response (return array, not JSON string)
    const inspecaoParsed = {
      ...inspecao,
      checklist: checklistToSave
    };

    return NextResponse.json(inspecaoParsed, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar inspeção:', error);
    return NextResponse.json(
      { error: 'Erro ao criar inspeção' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar inspeção
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, checklist, status, observacoesGerais, dataConclusao } = body;

    const updateData: any = {};

    if (checklist) updateData.checklist = JSON.stringify(sanitizeChecklist(checklist));
    if (status) updateData.status = sanitizeString(status);
    if (observacoesGerais !== undefined) updateData.observacoesGerais = sanitizeString(observacoesGerais);
    if (dataConclusao) updateData.dataConclusao = new Date(dataConclusao);

    const inspecao = await prisma.inspecao.update({
      where: { id },
      data: updateData
    });

    // Parse checklist back for response
    const inspecaoParsed = {
      ...inspecao,
      checklist: checklist ? checklist : JSON.parse(inspecao.checklist || '[]')
    };

    return NextResponse.json(inspecaoParsed);
  } catch (error) {
    console.error('Erro ao atualizar inspeção:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar inspeção' },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar checklist padrão
async function gerarChecklistPadrao(tipoInspecao: string, equipamento: any): Promise<any[]> {
  const isNavio = equipamento && 'comprimento' in equipamento;
  const isJangada = equipamento && 'numeroSerie' in equipamento;

  // load stock items associated with jangada to link checklist items
  let stockItemsForEquipamento: { id: string; nome: string }[] = [];
  if (isJangada) {
    try {
      stockItemsForEquipamento = await prisma.itemStock.findMany({
        where: { associadoJangada: equipamento.id },
        select: { id: true, nome: true }
      });
    } catch (err) {
      console.warn('Erro ao buscar stock associado à jangada:', err);
      stockItemsForEquipamento = [];
    }
  }

  const attachStock = (itemName: string) => {
    if (!stockItemsForEquipamento || stockItemsForEquipamento.length === 0) return [];
    const key = itemName.toLowerCase();
    return stockItemsForEquipamento.filter(s => s.nome && s.nome.toLowerCase().includes(key));
  };

  const checklistBase = [
    {
      id: 'doc-1',
      categoria: 'Documentação',
      item: 'Certificado de Segurança',
      descricao: 'Verificar validade do certificado de segurança da embarcação',
      status: 'pendente',
      testes: [{
        id: 'teste-doc-1',
        nome: 'Validade Certificado',
        descricao: 'Verificar se o certificado está dentro do prazo de validade',
        valorEsperado: 'Válido',
        unidade: '',
        status: 'pendente'
      }]
    },
    {
      id: 'doc-2',
      categoria: 'Documentação',
      item: 'Licença de Navegação',
      descricao: 'Confirmar que a licença de navegação está atualizada',
      status: 'pendente'
    }
  ];

  // Note: this application focuses on jangadas inspections; motor-specific
  // checklist items are intentionally omitted.

  const checklistSeguranca = [
    {
      id: 'seg-1',
      categoria: 'Equipamentos de Segurança',
      item: 'Coletes Salva-Vidas',
      descricao: 'Verificar quantidade, estado e validade dos coletes',
      status: 'pendente',
      testes: [{
        id: 'teste-coletes-1',
        nome: 'Quantidade Mínima',
        descricao: 'Verificar se há coletes para todos os passageiros',
        valorEsperado: isJangada ? '6' : '12+',
        unidade: 'unidades',
        status: 'pendente'
      }]
      ,
      stockItems: attachStock('colete')
    }
  ];

  // Combine all checklist sections (jangada-focused)
  const combined = [
    ...checklistBase,
    ...checklistSeguranca
  ];

  // Try to load survey template from repository and use it when appropriate
  const surveyPath = path.join(process.cwd(), 'LIFERAFT TEST AND SURVEY REPORT.txt');
  const surveyPdfPath = path.join(process.cwd(), 'manuais', 'Service Manual for Marine MK IV.pdf');
  try {
    // Prefer PDF if available and pdftotext exists
    if (isJangada) {
      try {
        if (fs.existsSync(surveyPdfPath)) {
          // try to extract text via pdftotext command-line if available
          try {
            const out = child_process.execSync(`pdftotext -layout "${surveyPdfPath}" -`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
            const parsedPdf = parseLiferaftSurveyText(out);
            if (parsedPdf && parsedPdf.length > 0) return parsedPdf;
          } catch (e) {
            // pdftotext may not be available; fall back to txt
            // console.warn('pdftotext extraction failed, falling back to TXT', e);
          }
        }

        if (fs.existsSync(surveyPath)) {
          const raw = fs.readFileSync(surveyPath, 'utf8');
          const parsed = parseLiferaftSurveyText(raw);
          if (parsed && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to load survey template, using default checklist.', e);
      }
    }
  } catch (e) {
    console.warn('Failed to load survey template, using default checklist.', e);
  }

  // Ensure every checklist item includes a `stockItems` array by searching stock for matching names
  const enriched = combined.map(item => {
    try {
      const matches = attachStock(item.item || item.nome || '');
      return { ...item, stockItems: matches };
    } catch (e) {
      return { ...item, stockItems: [] };
    }
  });

  // Add metadata verification items useful for jangadas
  if (isJangada) {
    enriched.unshift(
      { id: 'meta-1', categoria: 'Dados da Jangada', item: 'Marca e modelo verificados', descricao: 'Confirmar marca e modelo da jangada', status: 'pendente', testes: [] },
      { id: 'meta-2', categoria: 'Dados da Jangada', item: 'Lotação verificada', descricao: 'Confirmar lotação máxima e número de passageiros', status: 'pendente', testes: [] }
    );
  }

  // Add technical checks commonly required for liferaft/jangada service
  if (isJangada) {
    const technicalChecks = [
      { id: 'chk-valvulas', categoria: 'Equipamentos / Válvulas', item: 'Válvulas de sobrepressão e de enchimento - verificar operação e fugas', descricao: 'Testar abertura/fecho e vedação das válvulas; registar leituras', status: 'pendente', testes: [] },
      { id: 'chk-torques', categoria: 'Aperto / Torques', item: 'Parafusos e conexões - verificar torques e aperto recomendados', descricao: 'Verificar torque nas braçadeiras e conexões críticas', status: 'pendente', testes: [] },
      { id: 'chk-mangueiras', categoria: 'Mangueiras e Hoses', item: 'Mangueiras e conexões - inspecionar desgaste, fissuras e substituição', descricao: 'Inspecionar todas as mangueiras do sistema de inflação', status: 'pendente', testes: [] },
      { id: 'chk-adaptadores', categoria: 'Adaptadores e Fittings', item: 'Adaptadores, acopladores e fittings - verificar integridade e compatibilidade', descricao: 'Verificar roscas, selos e estado geral', status: 'pendente', testes: [] },
      { id: 'chk-testes', categoria: 'Testes Funcionais', item: 'Testes de pressão / WP / Blast / Overpressure', descricao: 'Executar testes de pressão e registar resultados (WP, blast, overpressure)', status: 'pendente', testes: [] }
    ];

    // Only add if not already present (by item text)
    for (const tc of technicalChecks) {
      if (!enriched.some(e => e.item && String(e.item).toLowerCase().includes(String(tc.item).toLowerCase().slice(0,10)))) {
        enriched.push(tc);
      }
    }
  }

  // Add gas requirements and strap counts based on lotação (when available)
  if (isJangada) {
    try {
      const lotacao = Number(equipamento.lotacao || equipamento.lotacao || 0) || 0;
      const { co2, n2 } = computeGasRequirements(lotacao);
      const straps = computeStrapCounts();

      enriched.push({
        id: 'gas-req',
        categoria: 'Gás / Cilindros',
        item: `Requisitos de gás para lotação ${lotacao}`,
        descricao: `Recomendado: CO2: ${co2} cilindros; N2: ${n2} cilindros. Ajustar por especificação do fabricante.`,
        status: 'pendente',
        testes: []
      });

      enriched.push({
        id: 'straps-req',
        categoria: 'Cintas de Fecho',
        item: 'Quantidade de cintas de fecho por tipo/tamanho de contentor',
        descricao: `Pequeno: ${straps.small} cintas; Médio: ${straps.medium} cintas; Grande: ${straps.large} cintas.`,
        status: 'pendente',
        testes: []
      });
    } catch (e) {
      console.warn('Erro ao calcular requisitos de gás/cintas:', e);
    }
  }

  return enriched;
}

// Parse the liferaft test & survey text into a simple checklist structure.
function parseLiferaftSurveyText(raw: string): any[] {
  try {
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const sections: { title: string; items: string[] }[] = [];
    let current: { title: string; items: string[] } | null = null;

    for (const line of lines) {
      // detect numbered section headers like '1.' or '4.'
      const m = line.match(/^\d+\.\s*(.*)/);
      if (m) {
        if (current) sections.push(current);
        current = { title: m[1].trim(), items: [] };
        continue;
      }
      // detect ALL-CAPS headings as section titles
      if (line === line.toUpperCase() && line.length > 3) {
        if (current) sections.push(current);
        current = { title: line, items: [] };
        continue;
      }
      // bullet-like lines
      if (current) {
        // split long comma-separated lists into items
        const parts = line.split(/\s{2,}|\s*-\s*|,\s*/).map(p => p.trim()).filter(Boolean);
        for (const p of parts) {
          // skip short lines
          if (p.length > 3 && !/^Page No/i.test(p)) current.items.push(p);
        }
      }
    }
    if (current) sections.push(current);

    // Map sections into checklist items
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
  } catch (e) {
    console.warn('parseLiferaftSurveyText failed', e);
    return [];
  }
}

// Heuristic mapping from lotação to required gas cylinder counts.
function computeGasRequirements(lotacao: number) {
  // These are conservative heuristic defaults and should be reviewed against the
  // actual Service Manual values. Values represent number of cylinders of each gas.
  let co2 = 0;
  if (lotacao <= 6) co2 = 1;
  else if (lotacao <= 12) co2 = 1;
  else if (lotacao <= 25) co2 = 2;
  else if (lotacao <= 50) co2 = 4;
  else if (lotacao <= 100) co2 = 6;
  else co2 = Math.ceil(lotacao / 20);

  // N2 typically used for certain inflation systems; default to smaller counts
  const n2 = Math.ceil(lotacao / 50);
  return { co2, n2 };
}

// Default strap counts by container size. These can be adjusted later or
// loaded from configuration or the Service Manual mapping.
function computeStrapCounts() {
  return { small: 4, medium: 6, large: 8 };
}