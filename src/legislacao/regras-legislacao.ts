// Relacionamento de artigos/decretos com regras do sistema
// Exemplo: cada regra pode ter um id, descrição, e referência(s) legal(is)

export interface RegraLegislacao {
  id: string;
  descricao: string;
  artigos: string[]; // Ex: ['Artigo 5º', 'Artigo 12º']
  decretos: string[]; // Ex: ['Decreto-Lei n.º 149_2014 _ DR.pdf']
  aplicaEm: string[]; // Ex: ['inspecao', 'stock', 'checklist']
  alerta?: string; // Mensagem de alerta a ser exibida
}

export const regrasLegislacao: RegraLegislacao[] = [
  {
    id: 'equipamento-obrigatorio',
    descricao: 'Obrigatoriedade de equipamentos de salvatagem conforme legislação vigente.',
    artigos: ['Artigo 5º', 'Artigo 12º'],
    decretos: ['Decreto-Lei n.º 149_2014 _ DR.pdf'],
    aplicaEm: ['inspecao', 'checklist'],
    alerta: 'Verifique se todos os equipamentos obrigatórios estão presentes conforme legislação.'
  },
  {
    id: 'validade-certificados',
    descricao: 'Validade dos certificados deve estar em conformidade com o decreto.',
    artigos: ['Artigo 8º'],
    decretos: ['Decreto-Lei n.º 149_2014 _ DR.pdf'],
    aplicaEm: ['certificados', 'inspecao'],
    alerta: 'Atenção à validade dos certificados segundo legislação.'
  },
  // Adicione mais regras conforme necessário
];
