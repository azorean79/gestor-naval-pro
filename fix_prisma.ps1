# Script de recuperação do Prisma Client travado
# 1. Feche o VS Code e todos os terminais/servidores Node.js
# 2. Execute este script no PowerShell na raiz do projeto

# Finaliza todos os processos node.exe
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove a pasta .prisma e node_modules travadas
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Reinstala as dependências
npm install

# Gera o Prisma Client
npx prisma generate

# Executa o seed completo
npx prisma db seed

echo 'Pronto! Prisma Client regenerado e seed executado.'
