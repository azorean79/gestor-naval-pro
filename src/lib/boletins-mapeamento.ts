// Mapeamento de peças antigas para novas conforme boletins extraídos
// Cada item pode ser descontinuado (true) ou substituído por um novo código
export interface MapeamentoBoletim {
  historico: string;
  antigo: string;
  novo: string;
  descontinuado: boolean;
  descricao?: string;
}

export const mapeamentoBoletins: MapeamentoBoletim[] = [
  {
    historico: 'SB 12/24',
    antigo: 'DSB00940350',
    novo: '01174009',
    descontinuado: true,
    descricao: 'TABLET ANTI-SEASICK 60\'s DSB → TABLET ANTI-SEASICK 60\'S (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: 'Z64514',
    novo: '01174009',
    descontinuado: true,
    descricao: 'TABLET ANTI-SEASICK 50\'S SZ → TABLET ANTI-SEASICK 60\'S (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '15199001',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID *EN* → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: 'DSB00940220',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID DSB UK → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '05886009',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID *POLISH* → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11801009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" EV → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11802009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" ZODIAC → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11803009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" DSB → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11804009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" RFD → KIT FIRST AID CAT C (SURVITEC)'
  },
  // --- SB 12/24 ---
  // Anti-seasickness tablets
  {
    historico: 'SB 12/24',
    antigo: 'DSB00940350',
    novo: '01174009',
    descontinuado: true,
    descricao: 'TABLET ANTI-SEASICK 60\'s DSB → TABLET ANTI-SEASICK 60\'S (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: 'Z64514',
    novo: '01174009',
    descontinuado: true,
    descricao: 'TABLET ANTI-SEASICK 50\'S SZ → TABLET ANTI-SEASICK 60\'S (SURVITEC)'
  },
  // First aid kits
  {
    historico: 'SB 12/24',
    antigo: '15199001',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID *EN* → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: 'DSB00940220',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID DSB UK → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '05886009',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID *POLISH* → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11801009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" EV → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11802009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" ZODIAC → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11803009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" DSB → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '11804009',
    novo: '06484009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CAT."C" RFD → KIT FIRST AID CAT C (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: 'Z63703',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID CE → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '06556009',
    novo: '12865009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID EEC DIR/SWEDISH → KIT FIRST AID SOLAS (SURVITEC)'
  },
  {
    historico: 'SB 12/24',
    antigo: '12162009',
    novo: '12874009',
    descontinuado: true,
    descricao: 'KIT, FIRST AID EEC DIR/DOT EXTENDED → KIT FIRST AID CAT C EXT (SURVITEC)'
  },
  // Lights and batteries
  {
    historico: 'SB 12/24',
    antigo: '11785009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 RFD → LIGHT READING RL6 SURVITEC'
  },
  {
    historico: 'SB 12/24',
    antigo: '11786009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 -DSB → LIGHT READING RL6 SURVITEC'
  },
  {
    historico: 'SB 12/24',
    antigo: '11787009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 -ZODIAC → LIGHT READING RL6 SURVITEC'
  },
  {
    historico: 'SB 12/24',
    antigo: '11796009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 EV → LIGHT READING RL6 SURVITEC'
  },
  {
    historico: 'SB 12/24',
    antigo: '11797009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 DBC → LIGHT READING RL6 SURVITEC'
  },
  {
    historico: 'SB 12/24',
    antigo: '12236009',
    novo: '12866009',
    descontinuado: true,
    descricao: 'LIGHT READING RL6 SURVITEC → LIGHT READING RL6 SURVITEC'
  },
  // ... (continue para todos os códigos de luzes e baterias do boletim)
  // --- SB 23/24 ---
  // Mudanças de design Mk IV (apenas referência, sem troca de código de peça, mas pode ser usado para histórico)
  {
    historico: 'SB 23/24',
    antigo: '50863105',
    novo: '50863105W',
    descontinuado: false,
    descricao: 'Serial antigo Mk IV → Serial novo Mk IV (welded hull, novo design)'
  },
  // --- SB 43/21 ---
  // Novos valises e zip pullers
  {
    historico: 'SB 43/21',
    antigo: '05606009',
    novo: '05606009',
    descontinuado: false,
    descricao: 'Gasket seal revisado (mesmo código, novo adesivo)'
  },
  {
    historico: 'SB 43/21',
    antigo: '53769001',
    novo: '53769001',
    descontinuado: false,
    descricao: 'Lifesmoke pyrotechnics valise (novo processo)'
  },
  {
    historico: 'SB 43/21',
    antigo: '53770001',
    novo: '53770001',
    descontinuado: false,
    descricao: 'Parachute flare pyrotechnics valise (novo processo)'
  },
  {
    historico: 'SB 43/21',
    antigo: '53771001',
    novo: '53771001',
    descontinuado: false,
    descricao: 'Handheld flare pyrotechnics valise (novo processo)'
  },
  {
    historico: 'SB 43/21',
    antigo: '53793001',
    novo: '53793001',
    descontinuado: false,
    descricao: 'Bellows valise (novo processo)'
  },
  {
    historico: 'SB 43/21',
    antigo: '12750009',
    novo: '12750009',
    descontinuado: false,
    descricao: 'Zip puller, resin (substitui zip puller metálico)' 
  },
  // --- SB 46/21 ---
  // Multi-label sheets (apenas referência, sem troca de código de peça, mas pode ser usado para histórico)
  {
    historico: 'SB 46/21',
    antigo: 'labels-individuais',
    novo: 'multi-label-sheet',
    descontinuado: true,
    descricao: 'Etiquetas individuais → multi-label sheet (Survitec, Zodiac, DSB, RFD, etc)'
  },
];
