import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

interface ChatRequest {
  message: string;
  context: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, context }: ChatRequest = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida' },
        { status: 400 }
      );
    }

    // Usar Gemini Lite para gerar resposta inteligente
    const response = await generateJulinhoResponseWithGemini(message, context);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no chatbot Julinho:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function generateJulinhoResponseWithGemini(message: string, context: ChatMessage[]): Promise<string> {
  try {
    // Verificar se há chave da API do Gemini
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    console.log('🔑 API Key encontrada:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length);

    if (!apiKey) {
      console.warn('❌ GEMINI_API_KEY não configurada, usando respostas locais');
      return generateFallbackResponse(message, context);
    }

    console.log('🚀 Inicializando GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ GoogleGenerativeAI inicializado');

    console.log('🤖 Obtendo modelo Gemini...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Modelo Gemini obtido');

    console.log('💬 Enviando mensagem simples para teste...');
    const result = await model.generateContent(`Responda de forma breve: ${message}`);
    const response = await result.response;
    const text = response.text();

    console.log('🎯 Resposta do Gemini recebida:', text.substring(0, 50) + '...');

    return text || 'Desculpe, não consegui gerar uma resposta. Tente reformular sua pergunta.';

  } catch (error) {
    console.error('❌ Erro ao usar Gemini:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return generateFallbackResponse(message, context);
  }
}

function generateFallbackResponse(message: string, context: ChatMessage[]): string {
  const lowerMessage = message.toLowerCase();

  // Respostas específicas baseadas em palavras-chave
  if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
    return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar com questões sobre o sistema Marine Safe Station.';
  }

  if (lowerMessage.includes('jangada') || lowerMessage.includes('jangadas')) {
    return 'Sobre jangadas: Posso ajudar você a consultar informações sobre jangadas, verificar status de inspeções, ou orientar sobre procedimentos de manutenção. O que você gostaria de saber especificamente?';
  }

  if (lowerMessage.includes('inspeção') || lowerMessage.includes('inspecoes')) {
    return 'Sobre inspeções: Você pode agendar novas inspeções, consultar o histórico, ou verificar o status das inspeções pendentes. Precisa de ajuda com algum aspecto específico das inspeções?';
  }

  if (lowerMessage.includes('navio') || lowerMessage.includes('navios')) {
    return 'Sobre navios: Posso ajudar com consultas sobre frota de navios, informações técnicas, ou procedimentos relacionados aos navios. O que você gostaria de verificar?';
  }

  if (lowerMessage.includes('cliente') || lowerMessage.includes('clientes')) {
    return 'Sobre clientes: Você pode consultar informações de clientes, adicionar novos registros, ou verificar histórico de serviços. Como posso ajudar com os clientes?';
  }

  if (lowerMessage.includes('stock') || lowerMessage.includes('componente') || lowerMessage.includes('componentes')) {
    return 'Sobre stock/componentes: Posso ajudar com consultas de inventário, verificação de disponibilidade, ou informações sobre componentes. O que você precisa saber sobre o stock?';
  }

  if (lowerMessage.includes('relatório') || lowerMessage.includes('relatorios')) {
    return 'Sobre relatórios: Você pode gerar relatórios de inspeções, estatísticas de manutenção, ou análises de performance. Que tipo de relatório você gostaria de criar?';
  }

  if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
    return 'Estou aqui para ajudar! Posso auxiliar com:\n\n• Consultas sobre jangadas e equipamentos\n• Informações sobre inspeções e manutenção\n• Dados de navios e clientes\n• Gestão de stock e componentes\n• Geração de relatórios\n• Procedimentos operacionais\n\nO que você gostaria de fazer?';
  }

  if (lowerMessage.includes('obrigado') || lowerMessage.includes('obrigada')) {
    return 'De nada! Estou sempre à disposição para ajudar. Se precisar de mais alguma coisa, é só perguntar. 😊';
  }

  if (lowerMessage.includes('tchau') || lowerMessage.includes('até logo') || lowerMessage.includes('adeus')) {
    return 'Até logo! Foi um prazer ajudar. Volte sempre que precisar. 👋';
  }

  // Respostas baseadas em contexto da conversa
  if (context && context.length > 0) {
    const lastUserMessage = context.filter(m => m.role === 'user').slice(-1)[0];
    if (lastUserMessage && lowerMessage.includes('sim')) {
      return 'Ótimo! Vamos prosseguir. O que você gostaria de fazer agora?';
    }
    if (lastUserMessage && lowerMessage.includes('não') || lowerMessage.includes('nao')) {
      return 'Entendi. Há algo mais em que posso ajudar você hoje?';
    }
  }

  // Respostas genéricas inteligentes
  if (lowerMessage.includes('como') || lowerMessage.includes('como faço')) {
    return 'Para orientações específicas, você pode consultar a documentação do sistema ou me perguntar sobre procedimentos específicos. Que atividade você gostaria de realizar?';
  }

  if (lowerMessage.includes('problema') || lowerMessage.includes('erro') || lowerMessage.includes('não funciona')) {
    return 'Se você está enfrentando algum problema, posso tentar ajudar. Descreva o que está acontecendo e vou orientar sobre os próximos passos ou soluções possíveis.';
  }

  if (lowerMessage.includes('novo') || lowerMessage.includes('criar') || lowerMessage.includes('adicionar')) {
    return 'Para criar novos registros, você pode usar as seções específicas do sistema (jangadas, navios, clientes, etc.). Que tipo de registro você gostaria de adicionar?';
  }

  // Resposta padrão quando não entende
  const defaultResponses = [
    'Entendi sua pergunta. Posso ajudar de várias formas no sistema Marine Safe Station. Você pode me perguntar sobre jangadas, inspeções, navios, clientes, ou procedimentos específicos.',
    'Interessante! Sou especializado em auxiliar com questões relacionadas ao sistema de gestão naval. Que aspecto específico você gostaria de explorar?',
    'Estou aqui para ajudar! Que informação ou funcionalidade do sistema você precisa? Posso orientar sobre inspeções, manutenção, relatórios, ou outros procedimentos.',
    'Como posso ajudar você hoje? Estou familiarizado com todas as funcionalidades do Marine Safe Station e posso guiar você pelos processos.'
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}