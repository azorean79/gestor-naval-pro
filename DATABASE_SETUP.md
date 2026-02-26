# ===========================================
# CONFIGURAÇÃO DE BANCO DE DADOS POSTGRESQL ONLINE
# ===========================================

# OPÇÃO 1: NEON.TECH (Recomendado - Gratuito)
# 1. Acesse: https://neon.tech
# 2. Crie uma conta gratuita
# 3. Crie um novo projeto
# 4. Copie a connection string e substitua abaixo:
# DATABASE_URL="postgresql://[username]:[password]@[hostname]/[database]?sslmode=require"

# OPÇÃO 2: SUPABASE (Gratuito com limites)
# 1. Acesse: https://supabase.com
# 2. Crie um projeto
# 3. Vá em Settings > Database
# 4. Use a connection string fornecida

# OPÇÃO 3: ELEPHANTSQL (Gratuito limitado)
# 1. Acesse: https://www.elephantsql.com
# 2. Crie uma conta Tiny Turtle (gratuito)
# 3. Copie a URL de conexão

# OPÇÃO 4: RAILWAY (Créditos gratuitos)
# 1. Acesse: https://railway.app
# 2. Conecte com GitHub
# 3. Crie um banco PostgreSQL

# OPÇÃO 5: PLANETSCALE (MySQL, mas pode usar PostgreSQL)
# 1. Acesse: https://planetscale.com
# 2. Crie um banco de dados

# ===========================================
# EXEMPLO DE CONFIGURAÇÃO PARA NEON.TECH:
# ===========================================
# DATABASE_URL="postgresql://johndoe:AbCdEfGhIjKlMnOp@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"

# IMPORTANTE:
# 1. Substitua a DATABASE_URL no arquivo .env pela sua string de conexão
# 2. Execute: npx prisma generate
# 3. Execute: npx prisma db push
# 4. Teste a aplicação: npm run dev

