/**
 * Componentes consumidos durante inspeções de jangadas
 * Baseado nos ConteudoPack (SOLAS, ISO, etc) com validades
 */

export const COMPONENTES_INSPECAO = [
  // Rações e Água
  {
    nome: 'Painter Line Sachet',
    categoria: 'Inspeção',
    descricao: 'Saco da linha de amarração para otimização do serviço',
    validade_anos: 0,
    observacao: 'Adicionar conforme boletim de otimização'
  },
  { 
    nome: 'Rações de Emergência', 
    categoria: 'Inspeção', 
    descricao: 'Rações de sobrevivência marinhas',
    validade_anos: 5,
    observacao: 'Conforme especificações SOLAS/IMO'
  },
  { 
    nome: 'Água Potável', 
    categoria: 'Inspeção', 
    descricao: 'Água potável em embalagem SOLAS',
    validade_anos: 6,
    observacao: 'Embalagem estéril conforme SOLAS'
  },

  // Primeiros Socorros
  { 
    nome: 'Kit de Primeiros Socorros', 
    categoria: 'Inspeção', 
    descricao: 'Kit médico à prova de água conforme SOLAS',
    validade_anos: 5,
    observacao: 'Verificar datas individuais de medicamentos'
  },
  { 
    nome: 'Comprimidos para o Enjoo', 
    categoria: 'Inspeção', 
    descricao: 'Medicamento anti-enjoo, 6 doses/pessoa',
    validade_anos: 4,
    observacao: 'Conforme fabricante'
  },
  { 
    nome: 'Sacos para Enjoo', 
    categoria: 'Inspeção', 
    descricao: 'Sacos individuais para enjoados',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },

  // Pirotécnicos/Comunicações
  { 
    nome: 'Foguetes com Paraquedas', 
    categoria: 'Inspeção', 
    descricao: 'Sinalizadores pirotécnicos com paraquedas - SOLAS/IMO',
    validade_anos: 4,
    observacao: 'Conforme normas SOLAS/IMO'
  },
  { 
    nome: 'Fachos de Mão', 
    categoria: 'Inspeção', 
    descricao: 'Fachos de mão para sinalização noturna - SOLAS/IMO',
    validade_anos: 4,
    observacao: 'Conforme normas SOLAS/IMO'
  },
  { 
    nome: 'Sinais Flutuantes de Fumo', 
    categoria: 'Inspeção', 
    descricao: 'Potes flutuantes de fumo colorido - SOLAS/IMO',
    validade_anos: 4,
    observacao: 'Conforme normas SOLAS/IMO'
  },

  // Equipamento de Sinalização
  { 
    nome: 'Lanterna Estanque', 
    categoria: 'Inspeção', 
    descricao: 'Lanterna submersível com pilhas sobressalentes',
    validade_anos: 0,
    observacao: 'Corpo indefinido; pilhas: 2 anos'
  },
  { 
    nome: 'Heliógrafo (Espelho de Sinais)', 
    categoria: 'Inspeção', 
    descricao: 'Espelho de sinais para comunicação durante o dia',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Apito', 
    categoria: 'Inspeção', 
    descricao: 'Apito de sinal marítimo',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },

  // Ferramentas e Utensílios
  { 
    nome: 'Faca de Ponta Redonda Flutuante', 
    categoria: 'Inspeção', 
    descricao: 'Faca flutuante à prova de água',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Esponjas', 
    categoria: 'Inspeção', 
    descricao: 'Esponjas para limpeza de ferimentos (2 unidades)',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Abre-latas', 
    categoria: 'Inspeção', 
    descricao: 'Abre-latas/Acessório múltiplo de sobrevivência (3 un.)',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Copos Graduados', 
    categoria: 'Inspeção', 
    descricao: 'Copos para ração de água (medição)',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },

  // Isolamento Térmico
  { 
    nome: 'Manta Térmica', 
    categoria: 'Inspeção', 
    descricao: 'Mantas térmicas de sobrevivência (2 unidades)',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },

  // Equipamento de Pesca
  { 
    nome: 'Kit de Pesca', 
    categoria: 'Inspeção', 
    descricao: 'Kit completo de anzóis, linhas e boias',
    validade_anos: 5,
    observacao: 'Linha e anzóis'
  },

  // Documentação e Instruções
  { 
    nome: 'Manual de Sobrevivência', 
    categoria: 'Inspeção', 
    descricao: 'Manual de instruções de sobrevivência marítima',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Tabela de Sinais de Salvamento', 
    categoria: 'Inspeção', 
    descricao: 'Tabela de sinais internacionais de salvamento',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },

  // Manutenção/Reparação
  { 
    nome: 'Fole ou Bomba de Enchimento', 
    categoria: 'Inspeção', 
    descricao: 'Fole/bomba manual para encher a balsa',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Tampões para Furos', 
    categoria: 'Inspeção', 
    descricao: 'Tampões de diversos tamanhos para furos (vários)',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  },
  { 
    nome: 'Kit de Reparação', 
    categoria: 'Inspeção', 
    descricao: 'Kit de reparação com adesivos para balsa',
    validade_anos: 5,
    observacao: 'Adesivos e materiais'
  },

  // Âncoras/Drogas
  { 
    nome: 'Âncora Flutuante (Drogue)', 
    categoria: 'Inspeção', 
    descricao: 'Âncora flutuante para estabilizar balsa',
    validade_anos: 0,
    observacao: 'Durabilidade ilimitada'
  }
] as const;

/**
 * Mapeamento de componentes consumidos por tipo de inspeção
 */
export const CONSUMO_INSPECAO_POR_TIPO: Record<string, Array<{ nome: string; quantidade: number }>> = {
  'anual': [
    { nome: 'Foguetes com Paraquedas', quantidade: 2 },
    { nome: 'Fachos de Mão', quantidade: 2 },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: 1 },
    { nome: 'Lanterna Estanque', quantidade: 1 },
  ],
  'extraordinaria': [
    { nome: 'Foguetes com Paraquedas', quantidade: 1 },
    { nome: 'Fachos de Mão', quantidade: 1 },
  ],
  'inicial': [
    { nome: 'Foguetes com Paraquedas', quantidade: 4 },
    { nome: 'Fachos de Mão', quantidade: 6 },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: 2 },
    { nome: 'Lanterna Estanque', quantidade: 1 },
    { nome: 'Kit de Primeiros Socorros', quantidade: 1 },
  ],
  'final': [
    { nome: 'Foguetes com Paraquedas', quantidade: 2 },
    { nome: 'Fachos de Mão', quantidade: 3 },
    { nome: 'Sinais Flutuantes de Fumo', quantidade: 1 },
    { nome: 'Lanterna Estanque', quantidade: 1 },
  ]
};

/**
 * Obter componentes que devem estar em stock para inspeção
 */
export function getComponentesInspeçao(): typeof COMPONENTES_INSPECAO {
  return COMPONENTES_INSPECAO;
}

/**
 * Obter quantidade consumida para um tipo de inspeção
 */
export function getConsumoInspeção(tipo: string): Array<{ nome: string; quantidade: number }> {
  return CONSUMO_INSPECAO_POR_TIPO[tipo] || [];
}
