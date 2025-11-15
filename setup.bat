@echo off
echo ============================================
echo           BioDash Frontend Setup
echo ============================================

echo.
echo 1. Verificando Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker não está instalado ou não está funcionando
    echo    Por favor, instale o Docker Desktop
    exit /b 1
)
echo ✅ Docker encontrado

echo.
echo 2. Verificando pnpm...
pnpm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ pnpm não está instalado
    echo    Instalando pnpm...
    npm install -g pnpm
    if %ERRORLEVEL% neq 0 (
        echo ❌ Falha ao instalar pnpm
        exit /b 1
    )
)
echo ✅ pnpm encontrado

echo.
echo 3. Instalando dependências...
pnpm install --force
if %ERRORLEVEL% neq 0 (
    echo ❌ Falha ao instalar dependências
    exit /b 1
)
echo ✅ Dependências instaladas

echo.
echo 4. Construindo imagem Docker...
docker build -t biodash-front . --progress=plain
if %ERRORLEVEL% neq 0 (
    echo ❌ Falha ao construir imagem Docker
    exit /b 1
)
echo ✅ Imagem Docker construída com sucesso

echo.
echo 5. Verificando arquivo de ambiente...
if not exist .env.local (
    echo ⚠️  Arquivo .env.local não encontrado
    echo    Copiando .env.local.example para .env.local...
    copy .env.local.example .env.local >nul
    echo ✅ Arquivo .env.local criado
    echo    ⚠️  IMPORTANTE: Edite o arquivo .env.local com suas configurações
)

echo.
echo ============================================
echo           Setup Concluído! 
echo ============================================
echo.
echo Para rodar o projeto:
echo   - Desenvolvimento: docker-compose --profile dev up
echo   - Produção:       docker-compose up
echo   - Local (pnpm):   pnpm dev
echo.
echo Acesse: http://localhost:3001
echo ============================================
pause