import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Atalhos de navegação para o Julinho
export const navegarPara = (router: AppRouterInstance, destino: string) => {
  const rotas: Record<string, string> = {
    // Dashboard e home
    'dashboard': '/dashboard',
    'home': '/',
    'inicio': '/',
    
    // Jangadas
    'jangadas': '/jangadas',
    'nova-jangada': '/jangadas/novo',
    'criar-jangada': '/jangadas/novo',
    
    // Inspeções
    'inspecoes': '/inspecoes',
    'inspecções': '/inspecoes',
    'testes-solas': '/inspecoes/testes-solas-demo',
    
    // Stock
    'stock': '/stock',
    'estoque': '/stock',
    'inventario': '/stock',
    
    // Clientes
    'clientes': '/clientes',
    'novo-cliente': '/clientes/novo',
    
    // Navios
    'navios': '/navios',
    'embarcacoes': '/navios',
    'novo-navio': '/navios/novo',
    
    // Cilindros
    'cilindros': '/cilindros',
    
    // Obras
    'obras': '/obras',
    'servicos': '/obras',
    
    // Logística
    'logistica': '/logistica',
    'transportes': '/logistica',
    
    // Agenda
    'agenda': '/agenda',
    'agendamentos': '/gestao/agenda',
    'calendario': '/agenda',
    
    // Alertas
    'alertas': '/alertas',
    'avisos': '/alertas',
    
    // Settings
    'configuracoes': '/settings',
    'definicoes': '/settings',
    'settings': '/settings',
    
    // Estação serviço
    'estacao-servico': '/estacao-servico',
    
    // Demo Julinho
    'assistente': '/assistente-demo',
    'julinho': '/assistente-demo',
  };

  const rota = rotas[destino.toLowerCase()];
  if (rota) {
    router.push(rota);
    return true;
  }
  
  return false;
};

// Templates de respostas do Julinho
export const templates = {
  saudacao: `👋 Olá! Sou o Julinho, o seu assistente inteligente para gestão naval. Como posso ajudar hoje?`,
  
  jangadasVencimento: (quantidade: number, dias: number) =>
    `⚠️ Encontrei ${quantidade} jangada${quantidade !== 1 ? 's' : ''} com inspeção agendada nos próximos ${dias} dias. Quer ver os detalhes?`,
  
  stockBaixo: (quantidade: number) =>
    `📦 Alerta: ${quantidade} ${quantidade !== 1 ? 'itens de stock estão' : 'item de stock está'} abaixo do mínimo recomendado. Deseja ver a lista completa?`,
  
  cilindrosExpirados: (quantidade: number) =>
    `❌ Atenção: ${quantidade} cilindro${quantidade !== 1 ? 's' : ''} ${quantidade !== 1 ? 'estão' : 'está'} com validade expirada. É importante agendar os testes.`,
  
  testesSOLAS: (idade: number, numTestes: number) =>
    `📊 Para uma jangada com ${idade} anos de idade, são necessários ${numTestes} testes SOLAS obrigatórios. Quer ver os detalhes de cada teste?`,
  
  erro: `❌ Desculpe, ocorreu um erro ao processar o seu pedido. Por favor, tente novamente ou reformule a pergunta.`,
  
  naoEncontrado: (tipo: string) =>
    `🔍 Não encontrei ${tipo} com esses critérios. Quer tentar com outros termos de busca?`,
  
  sucesso: (acao: string) =>
    `✅ ${acao} realizada com sucesso!`,
  
  confirmacao: (acao: string) =>
    `Confirma que deseja ${acao}? Responda "sim" para continuar ou "não" para cancelar.`,
};

// Frases comuns que o Julinho entende
export const comandosComuns = {
  saudacoes: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'ei'],
  ajuda: ['ajuda', 'help', 'socorro', 'como funciona', 'o que fazes', 'capacidades'],
  agradecimentos: ['obrigado', 'obrigada', 'thanks', 'valeu', 'agradeço'],
  confirmacoes: ['sim', 'yes', 'confirmo', 'ok', 'está bem', 'pode ser'],
  negacoes: ['não', 'nao', 'no', 'cancela', 'desiste'],
};

// Emojis do Julinho
export const emojis = {
  sucesso: '✅',
  erro: '❌',
  alerta: '⚠️',
  info: 'ℹ️',
  busca: '🔍',
  calendario: '📅',
  stock: '📦',
  jangada: '🚢',
  navio: '⛵',
  cilindro: '🔧',
  relatorio: '📊',
  certificado: '📋',
  loading: '⏳',
  ajuda: '💡',
  dinheiro: '💰',
  alerta_urgente: '🚨',
  ok: '👍',
  pensando: '🤔',
};
