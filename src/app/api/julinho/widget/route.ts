import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return static suggestions to avoid Prisma issues
    // TODO: Add database queries when Prisma is properly configured
    const suggestions = [
      {
        id: 'welcome',
        title: 'Bem-vindo ao Julinho!',
        description: 'Seu assistente inteligente está pronto para ajudar.',
        priority: 'low' as const,
        category: 'Introdução',
        actionUrl: '/dashboard'
      },
      {
        id: 'chat',
        title: 'Experimente o chat',
        description: 'Clique no botão flutuante para conversar com o Julinho.',
        priority: 'low' as const,
        category: 'Introdução',
        actionUrl: null
      }
    ];

    const insights = [
      'Sistema funcionando normalmente',
      'Assistente Julinho ativo e disponível'
    ];

    const recommendations = [
      'Explore as funcionalidades do sistema',
      'Use o chat do Julinho para tirar dúvidas',
      'Mantenha os dados sempre atualizados'
    ];

    return NextResponse.json({
      suggestions,
      insights,
      recommendations
    });

  } catch (error) {
    console.error('Erro na API do widget Julinho:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        suggestions: [],
        insights: [],
        recommendations: []
      },
      { status: 500 }
    );
  }
}