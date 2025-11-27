#!/bin/bash

# Script para gerenciar o BioDash com Docker

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_colored() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    print_colored "\n=== $1 ===" $BLUE
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_colored "❌ Docker não encontrado! Por favor, instale o Docker primeiro." $RED
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_colored "❌ Docker Compose não encontrado! Por favor, instale o Docker Compose primeiro." $RED
        exit 1
    fi
}

create_env_if_not_exists() {
    if [ ! -f .env.local ]; then
        print_colored "⚠️  Arquivo .env.local não encontrado. Criando a partir do .env.example..." $YELLOW
        cp .env.example .env.local
        print_colored "📝 Por favor, edite o arquivo .env.local com suas configurações antes de continuar." $YELLOW
        read -p "Pressione Enter para continuar..."
    fi
}

build_images() {
    print_header "Construindo imagens Docker"
    docker-compose build --no-cache
    print_colored "✅ Imagens construídas com sucesso!" $GREEN
}

start_frontend_only() {
    print_header "Iniciando apenas o Frontend"
    create_env_if_not_exists
    docker-compose up biodash-front
}

start_development() {
    print_header "Iniciando ambiente de desenvolvimento completo"
    create_env_if_not_exists
    docker-compose -f docker-compose.dev.yml up --build
}

start_production() {
    print_header "Iniciando ambiente de produção"
    create_env_if_not_exists
    docker-compose up --build -d
    print_colored "✅ Ambiente de produção iniciado!" $GREEN
    print_colored "🌐 Frontend disponível em: http://localhost:3001" $BLUE
    print_colored "🔧 Backend disponível em: http://localhost:8000" $BLUE
}

stop_all() {
    print_header "Parando todos os serviços"
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    print_colored "✅ Todos os serviços parados!" $GREEN
}

clean_all() {
    print_header "Limpando containers, imagens e volumes"
    docker-compose down -v --rmi all
    docker-compose -f docker-compose.dev.yml down -v --rmi all
    docker system prune -f
    print_colored "✅ Limpeza concluída!" $GREEN
}

show_logs() {
    print_header "Mostrando logs dos serviços"
    docker-compose logs -f
}

show_status() {
    print_header "Status dos containers"
    docker-compose ps
    echo ""
    docker ps --filter "name=biodash"
}

show_help() {
    print_colored "\n🐳 BioDash Docker Manager" $BLUE
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  build          - Constrói as imagens Docker"
    echo "  start          - Inicia apenas o frontend"
    echo "  dev            - Inicia ambiente de desenvolvimento completo"
    echo "  prod           - Inicia ambiente de produção"
    echo "  stop           - Para todos os serviços"
    echo "  clean          - Remove containers, imagens e volumes"
    echo "  logs           - Mostra logs dos serviços"
    echo "  status         - Mostra status dos containers"
    echo "  help           - Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 dev         # Inicia desenvolvimento com frontend + backend"
    echo "  $0 start       # Inicia apenas frontend"
    echo "  $0 prod        # Inicia produção"
    echo ""
}

# Verifica se Docker está instalado
check_docker

# Processa argumentos
case "${1:-help}" in
    build)
        build_images
        ;;
    start)
        start_frontend_only
        ;;
    dev)
        start_development
        ;;
    prod)
        start_production
        ;;
    stop)
        stop_all
        ;;
    clean)
        clean_all
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_colored "❌ Comando desconhecido: $1" $RED
        show_help
        exit 1
        ;;
esac