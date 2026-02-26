// prisma/seed.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clientesReais = [
  // === SAO MIGUEL - TURISMO MARITIMO ===
  {
    nome: 'Atlantis Azores',
    email: 'info@atlantisazores.com',
    telefone: '+351 296 249 000',
    morada: 'Rua dos Baleeiros, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '514123456',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Atlantis Azores',
    observacoes: 'Empresa de turismo maritimo em Sao Miguel',
  },
  {
    nome: 'Ocean Emotion',
    email: 'bookings@oceanemotion.pt',
    telefone: '+351 296 284 044',
    morada: 'Marina de Ponta Delgada, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '512345678',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Ocean Emotion',
    observacoes: 'Empresa de turismo maritimo em Sao Miguel',
  },
  {
    nome: 'Whale Watching Azores',
    email: 'info@whalewatchingazores.com',
    telefone: '+351 296 301 900',
    morada: 'Rua do Contador, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '516789012',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Whale Watching Azores',
    observacoes: 'Empresa especializada em observacao de baleias',
  },
  {
    nome: 'Futurismo - Viagens e Turismo',
    email: 'futurismo@futurismo.pt',
    telefone: '+351 296 629 729',
    morada: 'Rua do Galo, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '517890123',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Futurismo - Viagens e Turismo',
    observacoes: 'Agencia de viagens especializada em turismo maritimo',
  },
  {
    nome: 'Espaco Talasso',
    email: 'info@espacotalasso.pt',
    telefone: '+351 296 249 100',
    morada: 'Marina de Ponta Delgada, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '518901234',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Espaco Talasso',
    observacoes: 'Centro de thalassotherapy com atividades maritimas',
  },
  {
    nome: 'Azores Dive Center',
    email: 'info@azoresdivecenter.com',
    telefone: '+351 296 284 200',
    morada: 'Marina de Ponta Delgada, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '519012345',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Azores Dive Center',
    observacoes: 'Centro de mergulho profissional',
  },

  // === TERCEIRA - TURISMO MARITIMO ===
  {
    nome: 'Terra Nostra Park Hotel',
    email: 'info@terranostra.pt',
    telefone: '+351 295 635 635',
    morada: 'Rua Padre Jose Jacinto Botelho, 9700-035 Angra do Heroismo, Terceira',
    nif: '520123456',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Terra Nostra Park Hotel',
    observacoes: 'Hotel historico com atividades de turismo maritimo',
  },
  {
    nome: 'Whale Watching Terceira',
    email: 'info@whaleterceira.com',
    telefone: '+351 295 635 100',
    morada: 'Marina de Angra, 9700-075 Angra do Heroismo, Terceira',
    nif: '521234567',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Whale Watching Terceira',
    observacoes: 'Empresa de observação de baleias na Terceira',
    
  },

  // === GRACIOSA - TURISMO MARÍTIMO ===
  {
    nome: 'Graciosa Diving',
    email: 'info@graciosadiving.com',
    telefone: '+351 295 730 080',
    morada: 'Marina da Graciosa, 9880-000 Santa Cruz da Graciosa, Graciosa',
    nif: '522345678',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Graciosa Diving',
    observacoes: 'Centro de mergulho na ilha Graciosa',
    
  },

  // === SAO JORGE - TURISMO MARITIMO ===
  {
    nome: 'Sao Jorge Sea Tours',
    email: 'info@sjseatours.com',
    telefone: '+351 295 432 100',
    morada: 'Marina de Velas, 9800-000 Velas, Sao Jorge',
    nif: '523456789',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Sao Jorge Sea Tours',
    observacoes: 'Tours maritimos na ilha de Sao Jorge',
  },

  // === PICO - TURISMO MARITIMO ===
  {
    nome: 'Pico Sportfishing',
    email: 'info@picosportfishing.com',
    telefone: '+351 292 642 200',
    morada: 'Marina do Madaleno, 9930-000 Madalena, Pico',
    nif: '524567890',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pico Sportfishing',
    observacoes: 'Pesca desportiva no Pico',
    
  },

  // === FAIAL - TURISMO MARITIMO ===
  {
    nome: 'Faial Diving Center',
    email: 'info@faialdiving.com',
    telefone: '+351 292 200 400',
    morada: 'Marina da Horta, 9900-000 Horta, Faial',
    nif: '525678901',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Faial Diving Center',
    observacoes: 'Centro de mergulho no Faial',
    
  },

  // === FLORES - TURISMO MARITIMO ===
  {
    nome: 'Flores Marine Tours',
    email: 'info@floresmarinetours.com',
    telefone: '+351 292 592 100',
    morada: 'Marina de Lajes das Flores, 9970-000 Lajes das Flores, Flores',
    nif: '526789012',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Flores Marine Tours',
    observacoes: 'Tours marítimos na ilha das Flores',
    
  },

  // === CORVO - TURISMO MARITIMO ===
  {
    nome: 'Corvo Island Tours',
    email: 'info@corvoislandtours.com',
    telefone: '+351 292 596 200',
    morada: 'Marina do Corvo, 9980-000 Vila do Corvo, Corvo',
    nif: '527890123',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Corvo Island Tours',
    observacoes: 'Tours na ilha do Corvo',
    
  },

  // === SAO MIGUEL - PESCA ===
  {
    nome: 'Coral Cintilante Pescas Unipessoal Lda.',
    email: 'geral@coralcintilante.pt',
    telefone: '+351 296 123 456',
    morada: 'Rua dos Pescadores, 9500-764 Ponta Delgada, Sao Miguel',
    nif: '528901234',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Coral Cintilante Pescas Unipessoal Lda.',
    observacoes: 'Empresa de pesca em Sao Miguel',
  },
  {
    nome: 'Mare Nova, Sociedade de Pescas e Comercio de Peixe, Lda.',
    email: 'contacto@mare-nova.pt',
    telefone: '+351 296 234 567',
    morada: 'Zona Industrial de Ribeira Grande, 9600-000 Ribeira Grande, Sao Miguel',
    nif: '529012345',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Mare Nova, Sociedade de Pescas e Comercio de Peixe, Lda.',
    observacoes: 'Empresa de pesca e comercio de peixe',
    
  },
  {
    nome: 'Pescas Açoreanas S.A.',
    email: 'info@pescasacoreanass.pt',
    telefone: '+351 296 345 678',
    morada: 'Avenida Infante Dom Henrique, 9500-764 Ponta Delgada, São Miguel',
    nif: '530123456',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas Açoreanas S.A.',
    observacoes: 'Empresa de pesca industrial',
    
  },

  // === TERCEIRA - PESCA ===
  {
    nome: 'Pescas da Terceira Lda.',
    email: 'info@pescasterceira.pt',
    telefone: '+351 295 123 456',
    morada: 'Zona Industrial de Angra, 9700-075 Angra do Heroísmo, Terceira',
    nif: '531234567',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas da Terceira Lda.',
    observacoes: 'Empresa de pesca na Terceira',
    
  },

  // === GRACIOSA - PESCA ===
  {
    nome: 'Pescas da Graciosa',
    email: 'contacto@pescasgraciosa.pt',
    telefone: '+351 295 730 100',
    morada: 'Marina da Graciosa, 9880-000 Santa Cruz da Graciosa, Graciosa',
    nif: '532345678',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas da Graciosa',
    observacoes: 'Empresa de pesca na Graciosa',
    
  },

  // === SÃO JORGE - PESCA ===
  {
    nome: 'Cooperativa de Pescas de São Jorge',
    email: 'coopsjorge@pescas.pt',
    telefone: '+351 295 432 200',
    morada: 'Marina de Velas, 9800-000 Velas, São Jorge',
    nif: '533456789',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Cooperativa de Pescas de São Jorge',
    observacoes: 'Cooperativa de pescas em São Jorge',
    
  },

  // === PICO - PESCA ===
  {
    nome: 'Pescas do Pico Lda.',
    email: 'info@pescaspico.pt',
    telefone: '+351 292 642 300',
    morada: 'Marina do Madaleno, 9930-000 Madalena, Pico',
    nif: '534567890',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas do Pico Lda.',
    observacoes: 'Empresa de pesca no Pico',
    
  },

  // === FAIAL - PESCA ===
  {
    nome: 'Armação de Pesca do Faial',
    email: 'armacao@faial.pt',
    telefone: '+351 292 200 500',
    morada: 'Marina da Horta, 9900-000 Horta, Faial',
    nif: '535678901',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Armação de Pesca do Faial',
    observacoes: 'Armação de pesca no Faial',
    
  },

  // === FLORES - PESCA ===
  {
    nome: 'Pescas das Flores',
    email: 'pescas@flores.pt',
    telefone: '+351 292 592 200',
    morada: 'Marina de Lajes das Flores, 9970-000 Lajes das Flores, Flores',
    nif: '536789012',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas das Flores',
    observacoes: 'Empresa de pesca nas Flores',
    
  },

  // === CORVO - PESCA ===
  {
    nome: 'Pescas do Corvo',
    email: 'pescas@corvo.pt',
    telefone: '+351 292 596 300',
    morada: 'Marina do Corvo, 9980-000 Vila do Corvo, Corvo',
    nif: '537890123',
    tipo: 'empresa',
    status: 'ativo',
    dataNascimento: null,
    profissao: null,
    empresa: 'Pescas do Corvo',
    observacoes: 'Empresa de pesca no Corvo',
    
  }
];

// Dados de navios
const naviosReais = [
  // === NAVIOS DE TURISMO MARÍTIMO ===
  {
    nome: 'Atlantis Explorer',
    imo: 'IMO1234567',
    mmsi: '232123456',
    tipo: 'Barco de Turismo',
    bandeira: 'Portugal',
    comprimento: 15.5,
    largura: 4.2,
    calado: 1.8,
    capacidade: 2,
    ultimaInspecao: new Date('2024-06-15'),
    proximaInspecao: new Date('2026-06-15'),
    status: 'ativo',
    observacoes: 'Barco de turismo em bom estado',
    proprietario: 'Atlantis Azores', // Associado ao cliente Atlantis Azores
  },
  {
    nome: 'Ocean Dream',
    imo: 'IMO1234568',
    mmsi: '232123457',
    tipo: 'Catamarã',
    bandeira: 'Portugal',
    comprimento: 18.0,
    largura: 6.0,
    calado: 2.0,
    capacidade: 3,
    ultimaInspecao: new Date('2024-07-20'),
    proximaInspecao: new Date('2026-07-20'),
    status: 'ativo',
    observacoes: 'Catamarã em excelente estado',
    proprietario: 'Ocean Emotion', // Associado ao cliente Ocean Emotion
  },
  {
    nome: 'Whale Watcher I',
    imo: 'IMO1234569',
    mmsi: '232123458',
    tipo: 'Barco de Observação',
    bandeira: 'Portugal',
    comprimento: 20.0,
    largura: 5.5,
    calado: 2.2,
    capacidade: 2.5,
    ultimaInspecao: new Date('2024-05-10'),
    proximaInspecao: new Date('2026-05-10'),
    status: 'ativo',
    observacoes: 'Especializado em observação de baleias',
    proprietario: 'Whale Watching Azores', // Associado ao cliente Whale Watching Azores
  },
  {
    nome: 'São Miguel Pescador I',
    imo: 'IMO1234570',
    mmsi: '232123459',
    tipo: 'Navio de Pesca',
    bandeira: 'Portugal',
    comprimento: 12.0,
    largura: 4.0,
    calado: 1.5,
    capacidade: 1.5,
    ultimaInspecao: new Date('2024-07-15'),
    proximaInspecao: new Date('2026-07-15'),
    status: 'ativo',
    observacoes: 'Navio de pesca costeira',
    proprietario: 'Futurismo - Viagens e Turismo', // Associado ao cliente Futurismo - Viagens e Turismo
  },
  {
    nome: 'Ribeira Grande Fisher',
    imo: 'IMO1234571',
    mmsi: '232123460',
    tipo: 'Navio de Pesca',
    bandeira: 'Portugal',
    comprimento: 11.5,
    largura: 3.8,
    calado: 1.4,
    capacidade: 1.2,
    ultimaInspecao: new Date('2024-08-20'),
    proximaInspecao: new Date('2026-08-20'),
    status: 'ativo',
    observacoes: 'Navio de pesca artesanal',
    proprietario: 'Espaço Talasso', // Associado ao cliente Espaço Talasso
  },
  // === EMBARCAÇÕES DE PESCA DOS AÇORES ===
  {
    nome: 'Baía do Corvo',
    imo: 'PRT000024073',
    matricula: 'PTSCF-123101-L',
    tipo: 'pesca',
    bandeira: 'Portugal',
    status: 'ativo',
    observacoes: 'Ilha de registo: Corvo',
    proprietario: 'Coral Cintilante Pescas Unipessoal Lda.', // Associado ao cliente Coral Cintilante Pescas Unipessoal Lda.
  },
  {
    nome: 'Belladona',
    imo: 'PRT000024236',
    matricula: 'PTSCF-123208-L',
    tipo: 'pesca',
    bandeira: 'Portugal',
    status: 'ativo',
    observacoes: 'Ilha de registo: Corvo',
    proprietario: 'Maré Nova, Sociedade de Pescas e Comércio de Peixe, Lda.', // Associado ao cliente Maré Nova
  },
  // Add more vessels here...
  {
    nome: 'Yasmin Perinho',
    imo: 'PRT000025420',
    matricula: 'PTVDP-141825-L',
    tipo: 'pesca',
    bandeira: 'Portugal',
    status: 'ativo',
    observacoes: 'Ilha de registo: Santa Maria',
    proprietario: 'Pescas Açoreanas S.A.', // Associado ao cliente Pescas Açoreanas S.A.
  }
];

// Dados de jangadas
const jangadasReais = [
  {
    nome: 'Jangada São Miguel I',
    tipo: 'jangada',
    status: 'ativo',
    comprimento: 8.0,
    largura: 2.5,
    calado: 0.8,
    capacidadeCarga: 500,
    // anoConstrucao: 2020,
    material: 'Madeira',
    proprietarioNome: 'João Silva',
    numeroSerie: 'JSM001',
    ultimaInspecao: new Date('2024-06-10'),
    proximaInspecao: new Date('2026-06-10'),
    certificados: ['Certificado de Segurança'],
    observacoes: 'Jangada tradicional em bom estado',
    clienteId: null,
  },
  {
    nome: 'Jangada Terceira II',
    tipo: 'jangada',
    status: 'ativo',
    comprimento: 7.5,
    largura: 2.3,
    calado: 0.7,
    capacidadeCarga: 400,
    // anoConstrucao: 2019,
    material: 'Madeira',
    proprietarioNome: 'Manuel Costa',
    numeroSerie: 'JTE002',
    ultimaInspecao: new Date('2024-07-15'),
    proximaInspecao: new Date('2026-07-15'),
    certificados: ['Certificado de Segurança'],
    observacoes: 'Jangada para pesca lúdica',
    clienteId: null,
  },
  {
    nome: 'Jangada Graciosa III',
    tipo: 'jangada',
    status: 'ativo',
    comprimento: 8.2,
    largura: 2.6,
    calado: 0.9,
    capacidadeCarga: 600,
    // anoConstrucao: 2021,
    material: 'Madeira',
    proprietarioNome: 'António Pereira',
    numeroSerie: 'JGR003',
    ultimaInspecao: new Date('2024-08-20'),
    proximaInspecao: new Date('2026-08-20'),
    certificados: ['Certificado de Segurança'],
    observacoes: 'Jangada nova em excelente estado',
    clienteId: null,
  }
];

// Dados de itens de stock
const itensStock = [
  {
    nome: 'Colete Salva-Vidas Adulto',
    codigo: 'CSV-ADULT-001',
    descricao: 'Colete salva-vidas para adultos, tamanho único',
    categoria: 'Equipamentos de Segurança',
    quantidade: 50,
    quantidadeMinima: 10,
    unidade: 'unidade',
    precoUnitario: 45.00,
    localizacao: 'Armazém A - Prateleira 1',
    dataValidade: null,
    status: 'ativo',
    observacoes: 'Certificado SOLAS',
    fornecedorId: null,
  },
  {
    nome: 'Extintor ABC 5kg',
    codigo: 'EXT-ABC-005',
    descricao: 'Extintor de incêndio tipo ABC, capacidade 5kg',
    categoria: 'Equipamentos de Segurança',
    quantidade: 25,
    quantidadeMinima: 5,
    unidade: 'unidade',
    precoUnitario: 85.00,
    localizacao: 'Armazém A - Prateleira 2',
    dataValidade: null,
    status: 'ativo',
    observacoes: 'Revisão anual obrigatória',
    fornecedorId: null,
  },
  {
    nome: 'Cabo de Amarração 20m',
    codigo: 'CAB-AM-020',
    descricao: 'Cabo de amarração sintético, diâmetro 12mm, 20 metros',
    categoria: 'Acessórios Marítimos',
    quantidade: 30,
    quantidadeMinima: 8,
    unidade: 'rolo',
    precoUnitario: 120.00,
    localizacao: 'Armazém B - Prateleira 1',
    dataValidade: null,
    status: 'ativo',
    observacoes: 'Resistente à água salgada',
    fornecedorId: null,
  },
  {
    nome: 'Óleo Motor 4T 1L',
    codigo: 'OLE-4T-001',
    descricao: 'Óleo para motores 4 tempos, viscosidade 10W-40, 1 litro',
    categoria: 'Lubrificantes',
    quantidade: 100,
    quantidadeMinima: 20,
    unidade: 'litro',
    precoUnitario: 12.50,
    localizacao: 'Armazém B - Prateleira 3',
    dataValidade: null,
    status: 'ativo',
    observacoes: 'Para motores de popa',
    fornecedorId: null,
  },
  {
    nome: 'Filtro de Combustível',
    codigo: 'FLT-COMB-001',
    descricao: 'Filtro de combustível para motores a diesel',
    categoria: 'Peças de Motor',
    quantidade: 40,
    quantidadeMinima: 10,
    unidade: 'unidade',
    precoUnitario: 25.00,
    localizacao: 'Armazém C - Prateleira 1',
    dataValidade: null,
    status: 'ativo',
    observacoes: 'Compatível com motores Yanmar',
    fornecedorId: null,
  }
];

// Dados de cilindros
const cilindrosReais = [
  {
    numeroSerie: 'CIL-O2-001',
    pesoBruto: 85.5,
    tara: 75.2,
    quantidadeCO2: 0,
    quantidadeN2: 0,
    testeHidraulico: new Date('2024-03-15'),
    proximoTesteHidraulico: new Date('2026-03-15'),
    tipoSistemaInsuflacao: 'oxigênio',
    status: 'operacional',
    localizacao: 'Atlantis Explorer - Sala de Máquinas',
    proprietario: 'Air Liquide',
    observacoes: 'Cilindro de oxigênio para mergulho',
    clienteId: null,
    navioId: null,
  },
  {
    numeroSerie: 'CIL-CO2-002',
    pesoBruto: 120.8,
    tara: 25.3,
    quantidadeCO2: 95.5,
    quantidadeN2: 0,
    testeHidraulico: new Date('2024-08-20'),
    proximoTesteHidraulico: new Date('2026-08-20'),
    tipoSistemaInsuflacao: 'CO2',
    status: 'operacional',
    localizacao: 'Ocean Dream - Sistema de Extinção',
    proprietario: 'Praxair',
    observacoes: 'Cilindro para sistema de extinção de incêndio',
    clienteId: null,
    navioId: null,
  },
  {
    numeroSerie: 'CIL-AR-003',
    pesoBruto: 45.2,
    tara: 15.8,
    quantidadeCO2: 0,
    quantidadeN2: 29.4,
    testeHidraulico: new Date('2024-01-10'),
    proximoTesteHidraulico: new Date('2026-01-10'),
    tipoSistemaInsuflacao: 'ar comprimido',
    status: 'operacional',
    localizacao: 'Whale Watcher I - Sistema Pneumático',
    proprietario: 'Atlas Copco',
    observacoes: 'Cilindro de ar comprimido para ferramentas',
    clienteId: null,
    navioId: null,
  }
];

async function main() {
  console.log('🚀 Iniciando seed da base de dados com Prisma...');

  try {
    // Seed de clientes
    console.log('📝 Fazendo seed de clientes...');
    const clientesCriados = [];
    for (const [idx, cliente] of clientesReais.entries()) {
      if (!cliente.numeroReferencia) {
        cliente.numeroReferencia = cliente.nif ? `CL-${cliente.nif}` : `CL-${idx + 1}`;
      }
      const clienteCriado = await prisma.cliente.upsert({
        where: { numeroReferencia: cliente.numeroReferencia },
        update: cliente,
        create: cliente,
      });
      clientesCriados.push(clienteCriado);
    }
    console.log(`✅ ${clientesCriados.length} clientes inseridos com sucesso!`);

    // Criar mapa de clientes para associar navios
    const clienteMap = new Map();
    clientesCriados.forEach(cliente => {
      clienteMap.set(cliente.nome, cliente.id);
    });

    // Seed de navios
    console.log('🚢 Fazendo seed de navios...');
    const naviosCriados = [];
    for (const [idx, navio] of naviosReais.entries()) {
      if (!navio.numeroReferencia) {
        navio.numeroReferencia = navio.imo ? `NV-${navio.imo}` : `NV-${idx + 1}`;
      }
      const navioData = {
        nome: navio.nome,
        imo: navio.imo,
        mmsi: navio.mmsi,
        matricula: navio.matricula,
        bandeira: navio.bandeira,
        ilha: navio.ilha,
        portoEscala: navio.portoEscala,
        comprimento: navio.comprimento,
        largura: navio.largura,
        calado: navio.calado,
        capacidade: navio.capacidade,
        proprietario: navio.proprietario,
        status: navio.status,
        ultimaInspecao: navio.ultimaInspecao,
        proximaInspecao: navio.proximaInspecao,
        observacoes: navio.observacoes,
        numeroReferencia: navio.numeroReferencia,
      };
      const navioCriado = await prisma.navio.upsert({
        where: { numeroReferencia: navio.numeroReferencia },
        update: navioData,
        create: navioData,
      });
      naviosCriados.push(navioCriado);
    }
    console.log(`✅ ${naviosCriados.length} navios inseridos com sucesso!`);

    // Seed de jangadas
    console.log('🛶 Fazendo seed de jangadas...');
    const jangadasCriadas = [];
    for (const [idx, jangada] of jangadasReais.entries()) {
      const numeroRef = jangada.numeroSerie ? `JG-${jangada.numeroSerie}` : `JG-${idx + 1}`;
      const jangadaCriada = await prisma.jangada.upsert({
        where: { numeroReferencia: numeroRef },
        update: {
          nome: jangada.nome,
          numero: jangada.numeroSerie || numeroRef,
          proprietario: jangada.proprietarioNome,
          numeroSerie: jangada.numeroSerie,
          lotacao: Math.floor(jangada.capacidadeCarga / 100),
          status: jangada.status,
          ultimaInspecao: jangada.ultimaInspecao,
          proximaInspecao: jangada.proximaInspecao,
          observacoes: jangada.observacoes,
        },
        create: {
          numeroReferencia: numeroRef,
          nome: jangada.nome,
          numero: jangada.numeroSerie || numeroRef,
          proprietario: jangada.proprietarioNome,
          numeroSerie: jangada.numeroSerie,
          lotacao: Math.floor(jangada.capacidadeCarga / 100),
          status: jangada.status,
          ultimaInspecao: jangada.ultimaInspecao,
          proximaInspecao: jangada.proximaInspecao,
          observacoes: jangada.observacoes,
        },
      });
      jangadasCriadas.push(jangadaCriada);
    }
    console.log(`✅ ${jangadasCriadas.length} jangadas inseridas com sucesso!`);

    // Seed de itens de stock
    console.log('📦 Fazendo seed de itens de stock...');
    const itensCriados = [];
    for (const [idx, item] of itensStock.entries()) {
      const { codigo: _codigo, quantidade, fornecedorId, dataValidade: _dataValidade, ...itemData } = item;
      if (!itemData.numeroReferencia) {
        itemData.numeroReferencia = item.codigo ? `PN-${item.codigo}` : `IS-${idx + 1}`;
      }
      const itemCriado = await prisma.itemStock.upsert({
        where: { numeroReferencia: itemData.numeroReferencia },
        update: {
          ...itemData,
          quantidadeAtual: quantidade,
          fornecedor: fornecedorId,
        },
        create: {
          ...itemData,
          quantidadeAtual: quantidade,
          fornecedor: fornecedorId,
        },
      });
      itensCriados.push(itemCriado);
    }
    console.log(`✅ ${itensCriados.length} itens de stock inseridos com sucesso!`);

    // Seed de cilindros
    console.log('🔧 Fazendo seed de cilindros...');
    const cilindrosCriados = [];
    for (const cilindro of cilindrosReais) {
      const { clienteId: _clienteId, navioId: _navioId, ...cilindroData } = cilindro;
      const cilindroCriado = await prisma.cilindro.upsert({
        where: { numeroSerie: cilindroData.numeroSerie },
        update: cilindroData,
        create: cilindroData,
      });
      cilindrosCriados.push(cilindroCriado);
    }
    console.log(`✅ ${cilindrosCriados.length} cilindros inseridos com sucesso!`);

    console.log('🎉 Seed da base de dados concluído com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - ${clientesCriados.length} clientes`);
    console.log(`   - ${naviosCriados.length} navios`);
    console.log(`   - ${jangadasCriadas.length} jangadas`);
    console.log(`   - ${itensCriados.length} itens de stock`);
    console.log(`   - ${cilindrosCriados.length} cilindros`);
    const total = clientesCriados.length + naviosCriados.length + jangadasCriadas.length + itensCriados.length + cilindrosCriados.length;
    console.log(`   - Total: ${total} registros`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
