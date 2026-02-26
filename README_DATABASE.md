##  Configuração do Banco de Dados Online

### Passo 1: Escolher um Provedor PostgreSQL

Escolha uma das opções abaixo e siga as instruções no arquivo DATABASE_SETUP.md:

**Opções Recomendadas:**
- **Neon.tech** (Gratuito, recomendado)
- **Supabase** (Gratuito com limites)
- **ElephantSQL** (Gratuito limitado)
- **Railway** (Créditos gratuitos)

### Passo 2: Configurar a DATABASE_URL

1. Após criar sua conta e banco de dados, copie a string de conexão
2. Abra o arquivo .env
3. Substitua a linha DATABASE_URL pela sua string de conexão real

Exemplo:
`
DATABASE_URL="postgresql://johndoe:AbCdEfGhIjKlMnOp@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
`

### Passo 3: Migrar os Dados

Execute os comandos abaixo para migrar seus dados do SQLite local para o PostgreSQL online:

`ash
# 1. Gerar o cliente Prisma para PostgreSQL
npx prisma generate

# 2. Criar as tabelas no banco online
npx prisma db push

# 3. Migrar os dados existentes (opcional)
node migrate-to-online.js
`

### Passo 4: Testar a Aplicação

`ash
# Iniciar o servidor de desenvolvimento
npm run dev
`

A aplicação estará disponível em http://localhost:3000 conectada ao seu banco de dados online!

###  Comandos Úteis

`ash
# Verificar status do banco
npx prisma db push --preview-feature

# Resetar banco de dados
npx prisma migrate reset

# Ver dados no banco
npx prisma studio

# Executar seeds (se houver)
npx prisma db seed
`

###  Solução de Problemas

**Erro de conexão:**
- Verifique se a DATABASE_URL está correta
- Certifique-se de que o banco permite conexões externas
- Adicione ?sslmode=require na string de conexão

**Erro de migração:**
- Execute 
px prisma generate primeiro
- Verifique se todas as tabelas foram criadas com 
px prisma db push

**Dados não migraram:**
- Execute 
ode migrate-to-online.js novamente
- Verifique os logs de erro no console

---

 **Sua aplicação agora está conectada a um banco de dados online e pode ser acessada de qualquer lugar!
