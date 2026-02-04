import { NextRequest, NextResponse } from 'next/server';
import { openai, ASSISTENTE_SYSTEM_PROMPT } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Mensagens inválidas' },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ASSISTENTE_SYSTEM_PROMPT,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar a sua mensagem.';

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
      usage: completion.usage,
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
