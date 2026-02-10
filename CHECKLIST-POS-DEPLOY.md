# ✅ Checklist Pós-Deploy – Gestor Naval Pro

## 1. Verificações Básicas
- [ ] Site acessível pelo domínio de produção
- [ ] Login e autenticação funcionando
- [ ] Cadastro, edição e exclusão de navios, jangadas e inspeções funcionando
- [ ] Comentários e colaboração funcionando em navios, inspeções e jangadas
- [ ] Dashboard e agenda exibindo dados corretamente

## 2. Testes de API e Integrações
- [ ] Todas as rotas de API respondendo corretamente
- [ ] Integrações externas (e-mail, notificações, etc) funcionando
- [ ] Lembretes e cron jobs executando conforme esperado

## 3. Performance e Acessibilidade
- [ ] Teste de performance (Lighthouse > 90)
- [ ] Teste em dispositivos móveis/tablet
- [ ] Navegação fluida e sem erros visuais

## 4. Segurança
- [ ] Variáveis de ambiente protegidas
- [ ] Sem dados sensíveis expostos no frontend
- [ ] HTTPS ativo
- [ ] Logs sensíveis desativados

## 5. Monitoramento e Alertas
- [ ] Monitoramento de uptime ativo (Vercel Analytics, UptimeRobot, etc)
- [ ] Alertas de erro configurados (Sentry, LogRocket, etc)
- [ ] Logs de produção sendo coletados

## 6. Documentação e Suporte
- [ ] Guia rápido de uso enviado para usuários
- [ ] Equipe treinada para uso e suporte
- [ ] Canal de suporte/documentação disponível

## 7. Backup e Recuperação
- [ ] Backup do banco de dados realizado
- [ ] Plano de recuperação de desastre documentado

---

**Dica:** Marque cada item após validar em produção. Repita o checklist após cada atualização importante.

**Status:** _Pós-deploy validado e monitorado!_
