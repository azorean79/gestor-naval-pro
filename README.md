# Gestor Naval Pro

Sistema completo de gestão naval para jangadas, navios, clientes e equipamentos marítimos.

## 🚢 Sobre o Projeto

O Gestor Naval Pro é uma aplicação web moderna desenvolvida em Next.js para gestão completa de operações navais, incluindo:

- **Gestão de Jangadas**: Controle de jangadas de salvamento com inspeções e certificações
- **Gestão de Navios**: Administração de frota com dados técnicos e manutenção
- **Gestão de Clientes**: Base de dados de clientes e proprietários
- **Controle de Stock**: Inventário de equipamentos e peças
- **Gestão de Cilindros**: Controle de cilindros de oxigênio e manutenção
- **Sistema de Agenda**: Agendamento de inspeções e manutenções
- **Relatórios**: Geração de relatórios operacionais e financeiros

## 🛠️ Tecnologias Utilizadas

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Prisma 7** - ORM para base de dados
- **PostgreSQL** - Base de dados de produção
- **React Query** - Gerenciamento de estado e cache
- **shadcn/ui** - Componentes UI acessíveis
- **Zod** - Validação de dados
- **Vercel** - Plataforma de deploy

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd gestor-naval-pro
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── clientes/          # Gestão de clientes
│   ├── navios/            # Gestão de navios
│   ├── jangadas/          # Gestão de jangadas
│   ├── stock/             # Controle de stock
│   ├── cilindros/         # Gestão de cilindros
│   └── gestao/
│       └── agenda/        # Sistema de agendamento
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   └── providers.tsx     # Provedores React Query
├── hooks/                # Hooks customizados
│   ├── use-clientes.ts   # Hooks para clientes
│   ├── use-navios.ts     # Hooks para navios
│   ├── use-jangadas.ts   # Hooks para jangadas
│   └── use-dados-cruzados.ts # Hook para estatísticas
├── lib/                  # Utilitários
│   ├── prisma.ts         # Cliente Prisma
│   ├── query-client.ts   # Cliente React Query
│   ├── types.ts          # Tipos TypeScript
│   ├── utils.ts          # Funções utilitárias
│   └── validation-schemas.ts # Schemas Zod
└── prisma/               # Configuração Prisma
    ├── schema.prisma     # Schema da base de dados
    └── migrations/       # Migrações
```

## 🎯 Funcionalidades

### Dashboard
- Visão geral com estatísticas em tempo real
- Alertas e notificações importantes
- Ações rápidas para operações comuns

### Gestão de Entidades
- **Clientes**: CRUD completo com dados de contacto
- **Navios**: Gestão técnica com inspeções e certificações
- **Jangadas**: Controle de equipamentos de salvamento
- **Stock**: Inventário com alertas de reposição
- **Cilindros**: Gestão de equipamentos de oxigênio

### Sistema de Agenda
- Agendamento de inspeções e manutenções
- Controle de prioridades e status
- Integração com entidades do sistema

### Relatórios
- Relatórios operacionais
- Análise financeira
- Estatísticas de manutenção

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint

## 📊 Base de Dados

O sistema utiliza SQLite para desenvolvimento e pode ser configurado para PostgreSQL em produção. O schema inclui as seguintes entidades principais:

- Clientes e Proprietários
- Navios e Jangadas
- Certificados e Inspeções
- Stock e Movimentações
- Cilindros e Manutenção
- Agendamentos e Notificações
- Faturas e Relatórios

## 🚀 Deploy

Para instruções completas de deploy em produção, consulte o [Guia de Deploy](./DEPLOYMENT-GUIDE.md).

### Vercel (Recomendado)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente (DATABASE_URL)
3. Deploy automático com PostgreSQL

### Outros
O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contacto através de:
- Email: suporte@gestornaval.com
- Documentação: [Link para documentação completa]

---

**Desenvolvido com ❤️ para a comunidade náutica**
