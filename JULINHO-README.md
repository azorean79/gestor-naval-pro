# Assistente Julinho - IA Integrada

## 🤖 Visão Geral

O **Julinho** é um assistente de IA integrado em toda a aplicação Gestor Naval Pro, desenvolvido para ajudar utilizadores com todas as funcionalidades do sistema de gestão naval.

## ✨ Funcionalidades

### 1. Interface Flutuante
- Botão acessível em todas as páginas (canto inferior direito)
- Design moderno com gradiente azul-roxo
- Indicador de status online
- Animações suaves e responsivas

### 2. Capacidades do Assistente

#### Consultas de Informação
- ✅ Ver alertas ativos do sistema
- 🔍 Buscar jangadas por número de série
- 📊 Consultar estatísticas do dashboard
- 📦 Verificar disponibilidade de stock
- ⚠️ Listar jangadas próximas do vencimento

#### Cálculos Técnicos
- 🧮 Calcular testes SOLAS baseados na idade da jangada
- 💰 Estimar custos de inspeções
- 📅 Determinar próxima data de inspeção

#### Ações Executáveis
- 📋 Criar agendamentos
- 🔧 Registrar inspeções
- 📈 Gerar relatórios
- 🚢 Consultar informações de navios e clientes

### 3. Conhecimento Técnico

O Julinho possui conhecimento especializado em:
- Regulamentos SOLAS III/20
- Normas IMO (MSC.218(82), MSC.81(70), MSC.48(66))
- Manutenção de jangadas salva-vidas
- Gestão de cilindros de alta pressão
- Componentes e peças de segurança marítima

### 4. Sistema de Ações

O assistente pode executar ações automaticamente:

| Ação | Descrição |
|------|-----------|
| `listar_alertas` | Mostra todos os alertas ativos |
| `buscar_jangada` | Busca jangada por número de série |
| `consultar_stock` | Verifica disponibilidade de itens |
| `calcular_testes_solas` | Calcula testes necessários |
| `listar_jangadas_vencimento` | Jangadas próximas de inspeção |
| `criar_agendamento` | Agenda nova inspeção/serviço |
| `estatisticas_dashboard` | Estatísticas gerais do sistema |

## 🏗️ Arquitetura

### Componentes Criados

1. **`src/lib/openai.ts`**
   - Configuração do cliente OpenAI
   - System prompt completo com conhecimento do domínio
   - Instruções de personalidade e comunicação

2. **`src/hooks/use-assistente.ts`**
   - Hook React para gestão de estado do chat
   - Envio de mensagens
   - Execução de ações
   - Gestão de histórico de conversa

3. **`src/components/assistente-julinho.tsx`**
   - Interface de chat flutuante
   - Botão de ativação
   - Visualização de mensagens
   - Ações rápidas
   - Indicadores de typing

4. **`src/app/api/assistente/route.ts`**
   - Endpoint de API para comunicação com OpenAI
   - Processamento de mensagens
   - Parsing de ações

5. **`src/app/api/assistente/action/route.ts`**
   - Execução de ações do assistente
   - Integração com Prisma
   - Handlers específicos por tipo de ação

### Integração

O assistente está integrado no `layout.tsx` principal, tornando-o disponível em todas as páginas da aplicação.

## 💬 Exemplos de Uso

### Verificar Alertas
**Utilizador:** "Tenho alertas?"  
**Julinho:** "✅ Deixa-me verificar... Encontrei: ⚠️ 12 jangadas com inspeção nos próximos 90 dias..."

### Buscar Jangada
**Utilizador:** "Busca a jangada RFD-MKIV-ESP-1770163975684"  
**Julinho:** "🔍 Encontrei a jangada: Modelo RFD MKIV ESP, próxima inspeção: 04/02/2027..."

### Calcular Testes
**Utilizador:** "Que testes precisa uma jangada de 2010?"  
**Julinho:** "Para uma jangada de 16 anos: 4 testes obrigatórios (Visual, Pressão, Full Service, NAP)..."

### Consultar Stock
**Utilizador:** "Tenho tubos de alta pressão?"  
**Julinho:** "📦 A verificar stock... Encontrados 15 itens de tubos alta pressão..."

## 🔧 Configuração

### Variáveis de Ambiente

Já configurado em `.env.local`:
```env
OPENAI_API_KEY=sk-proj-vQd4PnAVgTqH9EavSY_f...
```

### Modelo AI

Utiliza **GPT-4o-mini** para:
- Resposta rápida
- Custo otimizado
- Boa compreensão de contexto técnico

## 🎨 Design

### Cores
- Gradiente principal: Azul (#2563EB) → Roxo (#9333EA)
- Background: Branco / Cinza escuro (dark mode)
- Mensagens utilizador: Azul
- Mensagens assistente: Cinza claro

### Componentes UI
- Botão flutuante com animação hover
- Chat responsivo 450x650px
- Scroll automático para mensagens novas
- Badges para ações executadas
- Typing indicators animados

## 📊 Métricas e Uso

O sistema rastreia:
- Número de mensagens enviadas
- Ações executadas
- Tempo de resposta
- Uso de tokens (via OpenAI usage)

## 🚀 Próximas Melhorias

Funcionalidades planejadas:
- [ ] Voz (speech-to-text)
- [ ] Sugestões automáticas baseadas em contexto
- [ ] Aprendizado de preferências do utilizador
- [ ] Integração com notificações
- [ ] Geração de relatórios complexos
- [ ] Criação automática de jangadas via conversa
- [ ] Upload de documentos para processamento

## 🔒 Segurança

- API Key armazenada em variáveis de ambiente
- Validação de inputs
- Rate limiting (a implementar)
- Sanitização de outputs

## 📚 Tecnologias

- **OpenAI GPT-4o-mini** - Modelo de linguagem
- **Next.js 16** - Framework React
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para base de dados
- **Radix UI** - Componentes acessíveis
- **Tailwind CSS** - Estilos

## 🎯 Conclusão

O Julinho representa uma evolução significativa na usabilidade do Gestor Naval Pro, fornecendo uma interface conversacional intuitiva para todas as funcionalidades do sistema, reduzindo a curva de aprendizagem e aumentando a produtividade dos utilizadores.
