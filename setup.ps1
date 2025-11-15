#!/usr/bin/env pwsh

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "           BioDash Frontend Setup" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está instalado ou não está funcionando" -ForegroundColor Red
    Write-Host "   Por favor, instale o Docker Desktop" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Verificando pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host "✅ pnpm encontrado: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm não está instalado" -ForegroundColor Red
    Write-Host "   Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao instalar pnpm" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ pnpm instalado com sucesso" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Instalando dependências..." -ForegroundColor Yellow
pnpm install --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar dependências" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "4. Construindo imagem Docker..." -ForegroundColor Yellow
docker build -t biodash-front . --progress=plain
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao construir imagem Docker" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Imagem Docker construída com sucesso" -ForegroundColor Green

Write-Host ""
Write-Host "5. Verificando arquivo de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Arquivo .env.local não encontrado" -ForegroundColor Yellow
    Write-Host "   Copiando .env.local.example para .env.local..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
    Write-Host "   ⚠️  IMPORTANTE: Edite o arquivo .env.local com suas configurações" -ForegroundColor Yellow
} else {
    Write-Host "✅ Arquivo .env.local encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "           Setup Concluído! " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para rodar o projeto:" -ForegroundColor White
Write-Host "  - Desenvolvimento: docker-compose --profile dev up" -ForegroundColor Gray
Write-Host "  - Produção:       docker-compose up" -ForegroundColor Gray  
Write-Host "  - Local (pnpm):   pnpm dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Acesse: http://localhost:3001" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Read-Host "Pressione Enter para continuar"