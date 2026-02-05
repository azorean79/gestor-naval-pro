#!/usr/bin/env node

/**
 * Script de Monitoramento Contínuo
 * Executa verificações periódicas de saúde da aplicação
 */

const https = require('https');
const { sendAlert } = require('../src/lib/monitoring');

const CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  interval: 5 * 60 * 1000, // 5 minutos
  endpoints: [
    '/api/health',
    '/api/marcas-jangada',
    '/api/dashboard/resumo',
    '/api/clientes',
    '/api/jangadas'
  ],
  alerts: {
    consecutiveFailures: 3,
    responseTimeThreshold: 5000, // 5 segundos
  }
};

class HealthMonitor {
  constructor() {
    this.failureCounts = new Map();
    this.lastCheck = null;
  }

  async checkEndpoint(endpoint) {
    const url = `${CONFIG.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(url);
      const responseTime = Date.now() - startTime;

      if (response.statusCode === 200) {
        // Reset failure count on success
        this.failureCounts.set(endpoint, 0);

        // Check response time
        if (responseTime > CONFIG.alerts.responseTimeThreshold) {
          await sendAlert('warning', `Endpoint lento: ${endpoint} (${responseTime}ms)`);
        }

        return { success: true, responseTime, statusCode: response.statusCode };
      } else {
        await this.handleFailure(endpoint, `Status ${response.statusCode}`, responseTime);
        return { success: false, responseTime, statusCode: response.statusCode };
      }
    } catch (error) {
      await this.handleFailure(endpoint, error.message, Date.now() - startTime);
      return { success: false, error: error.message };
    }
  }

  async handleFailure(endpoint, reason, responseTime) {
    const currentFailures = this.failureCounts.get(endpoint) || 0;
    const newFailureCount = currentFailures + 1;

    this.failureCounts.set(endpoint, newFailureCount);

    console.log(`❌ ${endpoint}: ${reason} (${newFailureCount}/${CONFIG.alerts.consecutiveFailures})`);

    if (newFailureCount >= CONFIG.alerts.consecutiveFailures) {
      await sendAlert('error',
        `Endpoint crítico falhando: ${endpoint}`,
        {
          reason,
          responseTime,
          consecutiveFailures: newFailureCount,
          lastCheck: this.lastCheck
        }
      );
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        resolve(res);
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runHealthCheck() {
    console.log(`🔍 Iniciando verificação de saúde - ${new Date().toISOString()}`);

    const results = [];
    for (const endpoint of CONFIG.endpoints) {
      const result = await this.checkEndpoint(endpoint);
      results.push({ endpoint, ...result });
    }

    this.lastCheck = new Date().toISOString();

    const healthy = results.filter(r => r.success).length;
    const total = results.length;

    console.log(`✅ ${healthy}/${total} endpoints saudáveis`);

    // Alert if less than 80% healthy
    if (healthy / total < 0.8) {
      await sendAlert('error', `Múltiplos endpoints com problema: ${healthy}/${total} saudáveis`);
    }

    return results;
  }

  start() {
    console.log('🚀 Iniciando monitoramento contínuo...');
    console.log(`📊 Intervalo: ${CONFIG.interval / 1000}s`);
    console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);

    // Executar imediatamente
    this.runHealthCheck();

    // Agendar verificações periódicas
    setInterval(() => {
      this.runHealthCheck();
    }, CONFIG.interval);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Encerrando monitoramento...');
    process.exit(0);
  });
}

module.exports = { HealthMonitor };