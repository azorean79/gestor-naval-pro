# deploy.ps1
Write-Host "Iniciando deploy para a Vercel..." -ForegroundColor Cyan

# Verifica se o CLI da Vercel está instalado
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI não encontrado. A instalar globalmente..." -ForegroundColor Yellow
    npm install -g vercel
}

# Faz push para produção
Write-Host "A publicar na Vercel (Produção)..." -ForegroundColor Cyan
vercel --prod

Write-Host "Deploy concluído!" -ForegroundColor Green