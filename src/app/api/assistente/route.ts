import { NextRequest, NextResponse } from 'next/server';
import { geminiJulinho } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Mensagens inválidas' },
        { status: 400 }
      );
    }

    // Call Gemini API
    const responseMessage = await geminiJulinho(messages);

    // Parse action if present
    let action = null;
    const actionMatch = responseMessage.match(/ACTION:([^|]+)(\|(.+))?/);
    if (actionMatch) {
      const actionType = actionMatch[1];
      const actionParams: Record<string, any> = {};
      
      if (actionMatch[3]) {
        const params = actionMatch[3].split('|');
        params.forEach((param) => {
          const [key, value] = param.split(':');
          if (key && value) {
            actionParams[key.trim()] = value.trim();
          }
        });
      }

      action = {
        type: actionType,
        params: actionParams,
      };
    }

    // Remove ACTION from message if present
    const cleanMessage = responseMessage.replace(/ACTION:[^\n]+\n?/g, '').trim();

    return NextResponse.json({
      message: cleanMessage || responseMessage,
      action,
    });
  } catch (error: any) {
    console.error('Erro na API do assistente:', error);
    
    return NextResponse.json(
      {
        error: 'Erro ao processar mensagem',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
