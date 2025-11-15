# Script PowerShell para gerenciar o BioDash com Docker

param(
    [string]$Command = "help"
)

function Write-ColoredText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Header {
    param([string]$Title)
    Write-ColoredText "`n=== $Title ===" "Cyan"
}

function Test-Docker {
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
    }
    catch {
        Write-ColoredText "❌ Docker ou Docker Compose não encontrado! Por favor, instale o Docker Desktop primeiro." "Red"
        exit 1
    }
}

function New-EnvFileIfNotExists {
    if (!(Test-Path ".env.local")) {
        Write-ColoredText "⚠️  Arquivo .env.local não encontrado. Criando a partir do .env.example..." "Yellow"
        Copy-Item ".env.example" ".env.local"
        Write-ColoredText "📝 Por favor, edite o arquivo .env.local com suas configurações antes de continuar." "Yellow"
        Read-Host "Pressione Enter para continuar"
    }
}

function Build-Images {
    Write-Header "Construindo imagens Docker"
    docker-compose build --no-cache
    Write-ColoredText "✅ Imagens construídas com sucesso!" "Green"
}

function Start-FrontendOnly {
    Write-Header "Iniciando apenas o Frontend"
    New-EnvFileIfNotExists
    docker-compose up biodash-front
}

function Start-Development {
    Write-Header "Iniciando ambiente de desenvolvimento completo"
    New-EnvFileIfNotExists
    docker-compose -f docker-compose.dev.yml up --build
}

function Start-Production {
    Write-Header "Iniciando ambiente de produção"
    New-EnvFileIfNotExists
    docker-compose up --build -d
    Write-ColoredText "✅ Ambiente de produção iniciado!" "Green"
    Write-ColoredText "🌐 Frontend disponível em: http://localhost:3001" "Cyan"
    Write-ColoredText "🔧 Backend disponível em: http://localhost:8000" "Cyan"
}

function Stop-All {
    Write-Header "Parando todos os serviços"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    Write-ColoredText "✅ Todos os serviços parados!" "Green"
}

function Remove-All {
    Write-Header "Limpando containers, imagens e volumes"
    docker-compose down -v --rmi all
    docker-compose -f docker-compose.dev.yml down -v --rmi all
    docker system prune -f
    Write-ColoredText "✅ Limpeza concluída!" "Green"
}

function Show-Logs {
    Write-Header "Mostrando logs dos serviços"
    docker-compose logs -f
}

function Show-Status {
    Write-Header "Status dos containers"
    docker-compose ps
    Write-Host ""
    docker ps --filter "name=biodash"
}

function Show-Help {
    Write-ColoredText "`n🐳 BioDash Docker Manager" "Cyan"
    Write-Host ""
    Write-Host "Uso: .\docker-manager.ps1 -Command [comando]"
    Write-Host ""
    Write-Host "Comandos disponíveis:"
    Write-Host "  build          - Constrói as imagens Docker"
    Write-Host "  start          - Inicia apenas o frontend"
    Write-Host "  dev            - Inicia ambiente de desenvolvimento completo"
    Write-Host "  prod           - Inicia ambiente de produção"
    Write-Host "  stop           - Para todos os serviços"
    Write-Host "  clean          - Remove containers, imagens e volumes"
    Write-Host "  logs           - Mostra logs dos serviços"
    Write-Host "  status         - Mostra status dos containers"
    Write-Host "  help           - Mostra esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:"
    Write-Host "  .\docker-manager.ps1 -Command dev     # Inicia desenvolvimento"
    Write-Host "  .\docker-manager.ps1 -Command start   # Inicia apenas frontend"
    Write-Host "  .\docker-manager.ps1 -Command prod    # Inicia produção"
    Write-Host ""
}

# Verifica se Docker está instalado
Test-Docker

# Processa comando
switch ($Command.ToLower()) {
    "build" { Build-Images }
    "start" { Start-FrontendOnly }
    "dev" { Start-Development }
    "prod" { Start-Production }
    "stop" { Stop-All }
    "clean" { Remove-All }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "help" { Show-Help }
    default {
        Write-ColoredText "❌ Comando desconhecido: $Command" "Red"
        Show-Help
        exit 1
    }
}