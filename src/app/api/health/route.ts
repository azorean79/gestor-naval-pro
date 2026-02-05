import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAlert } from '@/lib/monitoring'

export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: false,
    api: true,
    timestamp: new Date().toISOString(),
  };

  try {
    // Teste simples de conexão - apenas executar uma query básica
    await prisma.$queryRaw`SELECT 1 as test`
    checks.database = true;

    const duration = Date.now() - startTime;

    // Se demorar mais de 5 segundos, enviar alerta
    if (duration > 5000) {
      await sendAlert('warning', `Health check lento: ${duration}ms`);
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString(),
      prisma: 'Accelerate',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    })
  } catch (error) {
    console.error('Health check failed:', error)

    // Enviar alerta crítico
    await sendAlert('error', 'Health check falhou - banco de dados indisponível', {
      error: error instanceof Error ? error.message : error,
      checks,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        checks,
      },
      { status: 503 }
    )
  }
}
