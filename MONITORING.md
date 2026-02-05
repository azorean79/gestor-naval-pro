# Configurações de Monitoramento e Alertas

# ===========================================
# MONITORAMENTO
# ===========================================

# URL base da aplicação para monitoramento
NEXT_PUBLIC_APP_URL=https://gestor-naval-pro.vercel.app

# ===========================================
# ALERTAS (Configurar um dos métodos abaixo)
# ===========================================

# Email para alertas (usar SendGrid, Mailgun, etc.)
ALERT_EMAIL=admin@gestor-naval.com

# Webhook genérico para alertas
ALERT_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Slack webhook (recomendado)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# ===========================================
# CONFIGURAÇÃO DO MONITOR
# ===========================================

# Intervalo de verificação em segundos (padrão: 300 = 5 minutos)
MONITOR_INTERVAL=300

# Threshold de falhas consecutivas para alerta (padrão: 3)
MONITOR_FAILURE_THRESHOLD=3

# Threshold de tempo de resposta em ms (padrão: 5000 = 5 segundos)
MONITOR_RESPONSE_TIME_THRESHOLD=5000

# ===========================================
# DASHBOARD DE MÉTRICAS
# ===========================================

# Vercel Analytics (já configurado)
# Vercel Analytics será usado para métricas de performance

# ===========================================
# LOGS ESTRUTURADOS
# ===========================================

# Nível de log (development/production)
LOG_LEVEL=info

# Formato de log (json/console)
LOG_FORMAT=json

# ===========================================
# INSTRUÇÕES DE CONFIGURAÇÃO
# ===========================================

# 1. Configure pelo menos um método de alerta (email ou Slack)
# 2. Para Slack: Crie um webhook em https://api.slack.com/apps
# 3. Para email: Configure um provedor como SendGrid
# 4. Execute: npm run monitor (em produção com PM2)
# 5. Monitore os logs para verificar funcionamento

# ===========================================
# SCRIPTS ÚTEIS
# ===========================================

# Executar monitoramento em background:
# pm2 start npm --name "gestor-monitor" -- run monitor

# Ver logs do monitor:
# pm2 logs gestor-monitor

# Reiniciar monitor:
# pm2 restart gestor-monitor

# Parar monitor:
# pm2 stop gestor-monitor