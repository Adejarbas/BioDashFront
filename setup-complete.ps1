# Script PowerShell para setup completo do BioDash (Frontend + Backend)

param(
    [string]$BackendPath = "../BioDashBack"
)

function Write-ColoredText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-ColoredText "🚀 Setup Completo do BioDash - Frontend + Backend" "Cyan"

# Verificar se Docker está rodando
try {
    docker version | Out-Null
} catch {
    Write-ColoredText "❌ Docker não está rodando! Inicie o Docker Desktop primeiro." "Red"
    exit 1
}

Write-ColoredText "`n📁 Verificando estrutura de pastas..." "Yellow"

# Verificar se existe pasta do backend
if (!(Test-Path $BackendPath)) {
    Write-ColoredText "⚠️  Pasta do backend não encontrada em: $BackendPath" "Yellow"
    $BackendPath = Read-Host "Digite o caminho para o repositório do backend (ou Enter para pular)"
    if (!$BackendPath -or !(Test-Path $BackendPath)) {
        Write-ColoredText "⏭️  Pulando configuração do backend. Configure manualmente depois." "Yellow"
        $BackendPath = $null
    }
}

# Setup do Frontend
Write-ColoredText "`n🎨 Configurando Frontend..." "Blue"

if (!(Test-Path ".env.local")) {
    Write-ColoredText "❌ Arquivo .env.local não encontrado!" "Red"
    Write-ColoredText "Por favor, configure suas variáveis de ambiente primeiro." "Yellow"
    exit 1
}

Write-ColoredText "📦 Instalando dependências do frontend..." "Green"
pnpm install --force

# Setup do Backend (se existir)
if ($BackendPath) {
    Write-ColoredText "`n🔧 Configurando Backend..." "Blue"
    
    # Copiar arquivos de configuração para o backend
    Copy-Item "BACKEND_SETUP_Dockerfile" "$BackendPath/Dockerfile" -Force
    Copy-Item "BACKEND_SETUP_docker-compose.yml" "$BackendPath/docker-compose.yml" -Force
    Copy-Item "BACKEND_SETUP_.env.example" "$BackendPath/.env.example" -Force
    
    Write-ColoredText "✅ Arquivos Docker copiados para o backend!" "Green"
    
    # Verificar se tem .env no backend
    if (!(Test-Path "$BackendPath/.env")) {
        Write-ColoredText "⚠️  Criando .env no backend..." "Yellow"
        Copy-Item "$BackendPath/.env.example" "$BackendPath/.env"
        Write-ColoredText "📝 Configure o arquivo $BackendPath/.env com suas chaves do Supabase!" "Yellow"
    }
    
    # Instalar dependências do backend
    Push-Location $BackendPath
    try {
        Write-ColoredText "📦 Instalando dependências do backend..." "Green"
        if (Test-Path "pnpm-lock.yaml") {
            pnpm install --force
        } elseif (Test-Path "package-lock.json") {
            npm install
        } else {
            Write-ColoredText "⚠️  Usando pnpm por padrão..." "Yellow"
            pnpm install
        }
    } finally {
        Pop-Location
    }
}

# Criar rede Docker
Write-ColoredText "`n🌐 Configurando rede Docker..." "Magenta"
try {
    docker network create biodash-network 2>$null
    Write-ColoredText "✅ Rede Docker criada!" "Green"
} catch {
    Write-ColoredText "ℹ️  Rede Docker já existe." "Cyan"
}

# Build das imagens
Write-ColoredText "`n🐳 Construindo imagens Docker..." "Blue"

Write-ColoredText "🎨 Build do Frontend..." "Cyan"
& .\build-docker.ps1
if ($LASTEXITCODE -ne 0) {
    Write-ColoredText "❌ Build do frontend falhou!" "Red"
    exit 1
}

if ($BackendPath) {
    Write-ColoredText "`n🔧 Build do Backend..." "Cyan"
    Push-Location $BackendPath
    try {
        docker build -t biodash-backend .
        if ($LASTEXITCODE -ne 0) {
            Write-ColoredText "❌ Build do backend falhou!" "Red"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

Write-ColoredText "`n🎉 Setup concluído com sucesso!" "Green"
Write-ColoredText "`nPara iniciar o ambiente completo:" "Yellow"
Write-ColoredText "  1. Frontend: docker run -p 3001:3001 biodash-front" "Cyan"
if ($BackendPath) {
    Write-ColoredText "  2. Backend:  docker run -p 3003:3003 biodash-backend" "Cyan"
}
Write-ColoredText "`nOu use docker-compose para gerenciar ambos!" "Green"