# Marine Safe Station v2.0

Sistema completo de gestão naval para controle de jangadas, navios, clientes, stock e operações portuárias.

## � Funcionamento Offline

A aplicação foi desenvolvida para funcionar completamente **offline**, sem necessidade de conexão com a internet:

### ✅ Recursos Offline
- **Base de dados local**: SQLite integrada, não requer servidor externo
- **Dados mock**: Fallback automático para dados offline quando APIs falham
- **PWA (Progressive Web App)**: Instalável como aplicativo nativo
- **Cache inteligente**: Dados armazenados localmente para acesso rápido
- **Sincronização**: Dados sincronizados quando conexão retorna

### 🚀 Como Usar Offline

1. **Instalação PWA**:
   - Abra a aplicação no navegador
   - Clique em "Instalar" ou "Adicionar à tela inicial"
   - A aplicação funcionará como um app nativo

2. **Primeiro Acesso**:
   - A aplicação carrega dados da base local automaticamente
   - Se APIs falharem, usa dados offline como fallback
   - Funciona mesmo sem internet

3. **Recursos Disponíveis Offline**:
   - ✅ Dashboard com estatísticas
   - ✅ Lista de jangadas, navios e clientes
   - ✅ Gestão de stock e cilindros
   - ✅ Formulários de cadastro
   - ✅ Relatórios locais

### 🔄 Sincronização
- Dados são salvos localmente primeiro
- Quando conexão retorna, sincroniza com servidor
- Conflitos são resolvidos automaticamente

## �🚀 Funcionalidades

### 📊 Dashboard
- Visão geral do sistema com estatísticas em tempo real
- Alertas e notificações de itens críticos
- Métricas de performance e KPIs

### 🛶 Jangadas
- Gestão completa da frota de jangadas
- Controle de inspeções e certificados
- Documentação e histórico de manutenção
- Rastreamento de status operacional

### 🚢 Navios
- Registro e controle de navios
- Gestão de certificados e equipamentos
- Histórico de inspeções e manutenções
- Controle de proprietários e armadores

### 👥 Clientes
- Cadastro completo de clientes (PF/PJ)
- Gestão de contactos de emergência
- Controle de documentos e validações
- Histórico de interações

### 📦 Stock
- Controle de inventário em tempo real
- Gestão de entradas e saídas
- Alertas de stock baixo e esgotado
- Relatórios de movimentação

### 🗓️ Agenda
- Agendamento de inspeções e manutenções
- Controle de tarefas e eventos
- Sistema de lembretes e notificações
- Calendário integrado

### 📈 Relatórios
- Relatórios personalizáveis
- Análises de performance
- Exportação em múltiplos formatos
- Dashboards executivos

### ⚙️ Administração
- Gestão de usuários e permissões
- Configurações do sistema
- Backup e recuperação de dados
- Logs de auditoria

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 16.1.6 com App Router
- **UI/UX**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Firebase/Firestore
- **Autenticação**: Firebase Auth
- **Estado**: React Query (TanStack Query)
- **Formulários**: React Hook Form + Zod
- **Testes**: Jest + Playwright
- **Linguagem**: TypeScript

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase

## 🚀 Instalação e Execução

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd marine-safe-station
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   ```

   Configure as seguintes variáveis:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_client_email
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_DATABASE_URL=your_database_url
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   ```
   http://localhost:3000
   ```

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes unitários
- `npm run test:e2e` - Executa os testes end-to-end

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── jangadas/          # Gestão de jangadas
│   ├── navios/            # Gestão de navios
│   ├── clientes/          # Gestão de clientes
│   ├── stock/             # Controle de stock
│   ├── agenda/            # Sistema de agendamento
│   ├── relatorios/        # Relatórios e análises
│   ├── admin/             # Administração do sistema
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── dashboard/        # Componentes do dashboard
│   ├── jangadas/         # Componentes de jangadas
│   └── ...
├── lib/                  # Utilitários e configurações
│   ├── firebase.ts       # Configuração Firebase (cliente)
│   ├── firebase-admin.ts # Configuração Firebase Admin
│   ├── query-client.ts   # Configuração React Query
│   ├── types.ts          # Definições TypeScript
│   └── utils.ts          # Funções utilitárias
├── hooks/                # Custom hooks
├── services/             # Serviços de API
└── validations/          # Esquemas de validação Zod
```

## 🔒 Segurança

- Autenticação baseada em Firebase Auth
- Controle de permissões por módulo
- Logs de auditoria completos
- Backup automático de dados
- Validação de entrada de dados

## 📊 Monitoramento

- Métricas de performance em tempo real
- Alertas automáticos para itens críticos
- Logs detalhados de operações
- Relatórios de uso do sistema

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@marinesafestation.com
- Documentação: [Link para documentação completa]

---

**Marine Safe Station v2.0** - Sistema de Gestão Naval Completo
