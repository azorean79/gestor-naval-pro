#!/bin/bash

# 🧪 TESTES COMPLETOS - GESTOR NAVAL PRO
# ========================================

$base_url = "http://localhost:3000"
$results = @()

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [hashtable]$body
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🧪 TESTE: $name" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    try {
        $url = "$base_url$endpoint"
        Write-Host "   URL: $method $url" -ForegroundColor Gray
        
        $params = @{
            Uri = $url
            Method = $method
            Headers = @{ "Content-Type" = "application/json" }
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $params["Body"] = $body | ConvertTo-Json
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        
        if ($status -eq 200 -or $status -eq 201 -or $status -eq 204) {
            Write-Host "   ✅ STATUS: $status OK" -ForegroundColor Green
            
            if ($response.Content) {
                $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
                Write-Host "   📋 RESPOSTA: $($content | ConvertTo-Json -Depth 2 | Select-Object -First 5)" -ForegroundColor Green
            }
            
            return $true
        } else {
            Write-Host "   ❌ STATUS: $status (Esperado 200/201)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "   ❌ ERRO: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   🚀 TESTES COMPLETOS - GESTOR NAVAL PRO                      ║" -ForegroundColor Magenta
Write-Host "║   Servidor: http://localhost:3000                             ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

# TESTE 1: Julinho com Gemini
Write-Host ""
Write-Host "1️⃣  TESTANDO JULINHO COM GEMINI" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Qual é o teu nome? Apresenta-te."
        }
    )
} | ConvertTo-Json

$result1 = Test-Endpoint -name "Chat com Julinho (Gemini)" -method "POST" -endpoint "/api/assistente" -body $body

# TESTE 2: Verificar Dashboard
Write-Host ""
Write-Host "2️⃣  TESTANDO DASHBOARD" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    Write-Host "   🌐 Abrindo http://localhost:3000/dashboard" -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "$base_url/dashboard" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Dashboard carregando" -ForegroundColor Green
        $result2 = $true
    }
} catch {
    Write-Host "   ⚠️  Dashboard pode estar em construção" -ForegroundColor Yellow
    $result2 = $false
}

# TESTE 3: Listar Jangadas
Write-Host ""
Write-Host "3️⃣  TESTANDO LISTAR JANGADAS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$base_url/api/jangadas" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✅ Total de Jangadas: $($data | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor Green
        $result3 = $true
    }
} catch {
    Write-Host "   ❌ Erro ao listar: $($_.Exception.Message)" -ForegroundColor Red
    $result3 = $false
}

# TESTE 4: Verificar Página de Upload
Write-Host ""
Write-Host "4️⃣  TESTANDO INTERFACE DE UPLOAD" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$base_url/jangadas/import-quadro" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Página Import Quadro carregando" -ForegroundColor Green
        Write-Host "   📍 URL: http://localhost:3000/jangadas/import-quadro" -ForegroundColor Cyan
        $result4 = $true
    }
} catch {
    Write-Host "   ⚠️  Página pode estar em construção" -ForegroundColor Yellow
    $result4 = $false
}

# TESTE 5: Verificar Assistente Demo
Write-Host ""
Write-Host "5️⃣  TESTANDO PÁGINA ASSISTENTE DEMO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$base_url/assistente-demo" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Página Assistente Demo carregando" -ForegroundColor Green
        Write-Host "   📍 URL: http://localhost:3000/assistente-demo" -ForegroundColor Cyan
        $result5 = $true
    }
} catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $result5 = $false
}

# TESTE 6: Testar Stock
Write-Host ""
Write-Host "6️⃣  TESTANDO PÁGINA STOCK" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$base_url/stock" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Página Stock carregando" -ForegroundColor Green
        Write-Host "   📍 URL: http://localhost:3000/stock" -ForegroundColor Cyan
        $result6 = $true
    }
} catch {
    Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    $result6 = $false
}

# RESUMO FINAL
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   📊 RESUMO DOS TESTES                                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

$total = 6
$passed = 0

$tests = @(
    @{ name = "✅ Julinho + Gemini"; result = $result1 },
    @{ name = "📊 Dashboard"; result = $result2 },
    @{ name = "🚢 Listar Jangadas"; result = $result3 },
    @{ name = "📥 Upload Interface"; result = $result4 },
    @{ name = "🤖 Assistente Demo"; result = $result5 },
    @{ name = "📦 Stock Interface"; result = $result6 }
)

foreach ($test in $tests) {
    $status = if ($test.result) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "   $($test.name.PadRight(30)) $status" -ForegroundColor $(if ($test.result) { "Green" } else { "Red" })
    if ($test.result) { $passed++ }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📈 RESULTADO: $passed/$total testes passaram" -ForegroundColor Yellow

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Alguns testes falharam. Verifique os erros acima." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📱 TESTES MANUAIS RECOMENDADOS:" -ForegroundColor Cyan
Write-Host "   1. Abra: http://localhost:3000/assistente-demo" -ForegroundColor Cyan
Write-Host "   2. Clique em Julinho (botão flutuante)" -ForegroundColor Cyan
Write-Host "   3. Converse com o assistente IA" -ForegroundColor Cyan
Write-Host ""
