# Script PowerShell para build do Docker com variáveis de ambiente

Write-Host "🐳 Construindo imagem Docker do BioDash Frontend..." -ForegroundColor Cyan

# Lê variáveis do arquivo .env.local
$envVars = @{}
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match "^([^#][^=]*?)=(.*)$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }
}

$supabaseUrl = $envVars["NEXT_PUBLIC_SUPABASE_URL"]
$supabaseKey = $envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
$apiUrl = $envVars["NEXT_PUBLIC_API_BASE_URL"]

Write-Host "📋 Usando variáveis de ambiente:" -ForegroundColor Yellow
Write-Host "- NEXT_PUBLIC_SUPABASE_URL: $supabaseUrl" -ForegroundColor Green
Write-Host "- NEXT_PUBLIC_API_BASE_URL: $apiUrl" -ForegroundColor Green

Write-Host "🔨 Executando build..." -ForegroundColor Blue

docker build `
  --build-arg "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl" `
  --build-arg "NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseKey" `
  --build-arg "NEXT_PUBLIC_API_BASE_URL=$apiUrl" `
  -t biodash-front .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    Write-Host "🚀 Para rodar o container: docker run -p 3001:3001 biodash-front" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}