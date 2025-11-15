@echo off
echo 🐳 Construindo imagem Docker do BioDash Frontend...

REM Lê variáveis do arquivo .env.local
for /f "tokens=1,2 delims==" %%A in ('type .env.local ^| findstr "NEXT_PUBLIC"') do (
    set %%A=%%B
)

echo 📋 Usando variáveis de ambiente:
echo - NEXT_PUBLIC_SUPABASE_URL: %NEXT_PUBLIC_SUPABASE_URL%
echo - NEXT_PUBLIC_API_BASE_URL: %NEXT_PUBLIC_API_BASE_URL%

docker build ^
  --build-arg NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL% ^
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY% ^
  --build-arg NEXT_PUBLIC_API_BASE_URL=%NEXT_PUBLIC_API_BASE_URL% ^
  -t biodash-front .

if %ERRORLEVEL% EQU 0 (
    echo ✅ Build concluído com sucesso!
    echo 🚀 Para rodar o container: docker run -p 3001:3001 biodash-front
) else (
    echo ❌ Build falhou!
    exit /b 1
)