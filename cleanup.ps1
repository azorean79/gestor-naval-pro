# Script de limpeza de ficheiros e pastas desnecessarios
# OREYAZORES26 - Cleanup Script

Write-Host "Iniciando limpeza de ficheiros desnecessarios..." -ForegroundColor Cyan
Write-Host ""

$cleaned = 0
$errors = 0

# 1. Eliminar todos os ficheiros temporarios (tmp_*)
Write-Host "Eliminando ficheiros temporarios (tmp_*)..." -ForegroundColor Yellow
Get-ChildItem -Path . -Filter "tmp_*" -File | ForEach-Object {
    try {
        Remove-Item $_.FullName -Force
        Write-Host "  OK: $($_.Name)" -ForegroundColor Green
        $cleaned++
    }
    catch {
        Write-Host "  ERRO: $($_.Name)" -ForegroundColor Red
        $errors++
    }
}

# 2. Eliminar pastas de build desnecessarias
Write-Host ""
Write-Host "Eliminando pastas de build..." -ForegroundColor Yellow
$buildFolders = @("prisma_build", "prisma_dist", "dist", "generated")
foreach ($folder in $buildFolders) {
    if (Test-Path $folder) {
        try {
            Remove-Item $folder -Recurse -Force
            Write-Host "  OK: $folder/" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $folder/" -ForegroundColor Red
            $errors++
        }
    }
}

# 3. Eliminar logs antigos
Write-Host ""
Write-Host "Eliminando logs antigos..." -ForegroundColor Yellow
if (Test-Path "prisma\logs") {
    Get-ChildItem -Path "prisma\logs" -Filter "*.log" -File | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force
            Write-Host "  OK: $($_.Name)" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $($_.Name)" -ForegroundColor Red
            $errors++
        }
    }
    
    Get-ChildItem -Path "prisma\logs" -Filter "backup_*.json" -File | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force
            Write-Host "  OK: $($_.Name)" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $($_.Name)" -ForegroundColor Red
            $errors++
        }
    }
}

# 4. Eliminar ficheiros de dados obsoletos (JSON dumps)
Write-Host ""
Write-Host "Eliminando ficheiros de dados obsoletos..." -ForegroundColor Yellow
$obsoleteFiles = @(
    "db_dump.json",
    "db_dump.sql",
    "clientes.json",
    "navios.json",
    "jangadas.json",
    "rafts.json",
    "inspecoes_2025.json",
    "jangadas_certificados_2025.json",
    "ligacoes_jangadas_navios.json",
    "ligacoes_navios_clientes.json",
    "list_certs.txt"
)
foreach ($file in $obsoleteFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "  OK: $file" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $file" -ForegroundColor Red
            $errors++
        }
    }
}

# 5. Eliminar scripts de verificacao obsoletos
Write-Host ""
Write-Host "Eliminando scripts obsoletos..." -ForegroundColor Yellow
$obsoleteScripts = @(
    "check_data.ts",
    "check_database.ts",
    "check_ins_dups.ts",
    "count_inspections.ts",
    "list_validade_items.ts",
    "backup_db.js",
    "backup_db_sql.js",
    "server.js"
)
foreach ($script in $obsoleteScripts) {
    if (Test-Path $script) {
        try {
            Remove-Item $script -Force
            Write-Host "  OK: $script" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $script" -ForegroundColor Red
            $errors++
        }
    }
}

# 6. Eliminar ficheiros de build TypeScript
Write-Host ""
Write-Host "Eliminando ficheiros de build TS..." -ForegroundColor Yellow
$tsBuildFiles = @("tsc-output.txt", "tsconfig.tsbuildinfo")
foreach ($file in $tsBuildFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "  OK: $file" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $file" -ForegroundColor Red
            $errors++
        }
    }
}

# 7. Eliminar ficheiros CSV/XLSX processados
Write-Host ""
Write-Host "Eliminando ficheiros processados..." -ForegroundColor Yellow
$processedFiles = @(
    "lista embarcacoes.csv",
    "lista embarcacoes.xlsx",
    "OMT - Lista Embarcacoes.pdf",
    "OMT - Moradas.pdf",
    "2025-II-Despacho-2025-09-17.pdf"
)
foreach ($file in $processedFiles) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "  OK: $file" -ForegroundColor Green
            $cleaned++
        }
        catch {
            Write-Host "  ERRO: $file" -ForegroundColor Red
            $errors++
        }
    }
}

# 8. Eliminar ficheiro .lnk
Write-Host ""
Write-Host "Eliminando atalhos..." -ForegroundColor Yellow
if (Test-Path "OREYAZORES 1.0.lnk") {
    try {
        Remove-Item "OREYAZORES 1.0.lnk" -Force
        Write-Host "  OK: OREYAZORES 1.0.lnk" -ForegroundColor Green
        $cleaned++
    }
    catch {
        Write-Host "  ERRO: OREYAZORES 1.0.lnk" -ForegroundColor Red
        $errors++
    }
}

# Resumo
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Limpeza concluida!" -ForegroundColor Green
Write-Host "   Ficheiros eliminados: $cleaned" -ForegroundColor Green
Write-Host "   Erros: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
