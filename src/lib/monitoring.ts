import { NextRequest, NextResponse } from 'next/server';

interface AlertConfig {
  email?: string;
  webhook?: string;
  slackWebhook?: string;
}

interface AlertData {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  timestamp: string;
  url?: string;
  userAgent?: string;
  ip?: string;
}

class AlertService {
  private config: AlertConfig;

  constructor(config: AlertConfig = {}) {
    this.config = config;
  }

  async sendAlert(alert: AlertData) {
    const promises = [];

    if (this.config.email) {
      promises.push(this.sendEmailAlert(alert));
    }

    if (this.config.webhook) {
      promises.push(this.sendWebhookAlert(alert));
    }

    if (this.config.slackWebhook) {
      promises.push(this.sendSlackAlert(alert));
    }

    // Sempre log no console para desenvolvimento
    this.logAlert(alert);

    await Promise.allSettled(promises);
  }

  private async sendEmailAlert(alert: AlertData) {
    try {
      // Em produção, usar um serviço como SendGrid, Mailgun, etc.
      console.log('📧 EMAIL ALERT:', {
        to: this.config.email,
        subject: `[${alert.type.toUpperCase()}] ${alert.message}`,
        body: this.formatAlertMessage(alert)
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private async sendWebhookAlert(alert: AlertData) {
    try {
      await fetch(this.config.webhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  private async sendSlackAlert(alert: AlertData) {
    try {
      const slackMessage = {
        text: `[${alert.type.toUpperCase()}] ${alert.message}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 ${alert.type.toUpperCase()}: ${alert.message}`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Timestamp:* ${alert.timestamp}`
              },
              {
                type: 'mrkdwn',
                text: `*URL:* ${alert.url || 'N/A'}`
              }
            ]
          }
        ]
      };

      if (alert.details) {
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:* \`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``
          }
        });
      }

      await fetch(this.config.slackWebhook!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private logAlert(alert: AlertData) {
    const emoji = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    console.log(`${emoji[alert.type]} [${alert.timestamp}] ${alert.message}`, {
      details: alert.details,
      url: alert.url,
      ip: alert.ip
    });
  }

  private formatAlertMessage(alert: AlertData): string {
    return `
🚨 ALERTA: ${alert.type.toUpperCase()}

Mensagem: ${alert.message}
Timestamp: ${alert.timestamp}
URL: ${alert.url || 'N/A'}
IP: ${alert.ip || 'N/A'}
User Agent: ${alert.userAgent || 'N/A'}

${alert.details ? `Detalhes: ${JSON.stringify(alert.details, null, 2)}` : ''}
    `.trim();
  }
}

// Instância global do serviço de alertas
export const alertService = new AlertService({
  // Configurar com variáveis de ambiente em produção
  email: process.env.ALERT_EMAIL,
  webhook: process.env.ALERT_WEBHOOK,
  slackWebhook: process.env.SLACK_WEBHOOK,
});

// Middleware para capturar erros e enviar alertas
export async function withErrorMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  request: NextRequest
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    // Enviar alerta para erro crítico
    await alertService.sendAlert({
      type: 'error',
      message: `Erro crítico na API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      details: {
        error: error instanceof Error ? error.stack : error,
        method: request.method,
        url: request.url,
      },
      timestamp: new Date().toISOString(),
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown',
    });

    // Retornar resposta de erro
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função utilitária para alertas manuais
export async function sendAlert(
  type: AlertData['type'],
  message: string,
  details?: any,
  request?: NextRequest
) {
  await alertService.sendAlert({
    type,
    message,
    details,
    timestamp: new Date().toISOString(),
    url: request?.url,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: request?.headers.get('x-forwarded-for') ||
        request?.headers.get('x-real-ip') ||
        request?.headers.get('cf-connecting-ip') ||
        'unknown',
  });
}