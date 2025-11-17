# 🐳 Docker Setup - BioDash Backend

## 🚀 Como usar o Docker (Guia Completo)

### **📋 CENÁRIO 1: Apenas Backend (Recomendado)**

```bash
# 1. Clonar o repositório
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD

# 2. Trocar para a branch Docker
git checkout feature/docker-integration

# 3. Verificar se tem o arquivo .env.local (já configurado)
# Se não tiver, copiar do exemplo:
# cp .env.example .env.local

# 4. Rodar apenas o backend
docker-compose up biodash-backend --build

# ✅ Backend estará rodando em: http://localhost:3003
```

### **📋 CENÁRIO 2: Frontend + Backend Completo**

```bash
# Passos 1-3 iguais ao anterior...

# 4. Rodar projeto completo (quando a imagem do frontend estiver disponível)
docker-compose up --build

# ✅ Frontend: http://localhost:3001
# ✅ Backend: http://localhost:3003
```

### **📋 CENÁRIO 3: Desenvolvimento (modo background)**

```bash
# Rodar em background para continuar usando o terminal
docker-compose up biodash-backend -d

# Ver logs em tempo real
docker-compose logs -f biodash-backend

# Parar containers
docker-compose down
```

## 🔧 **Comandos Úteis**

```bash
# Ver containers rodando
docker ps

# Rebuild sem cache (se houver problemas)
docker-compose build --no-cache

# Parar tudo e limpar
docker-compose down
docker system prune -f

# Testar se a API está funcionando
curl http://localhost:3003/api/health
curl http://localhost:3003/api/user
```

## 📁 **Arquivos Docker Incluídos**

```
BioDashBD/
├── Dockerfile              ✅ Configuração do container (Node.js 20)
├── docker-compose.yml      ✅ Orquestração completa 
├── .env.example            ✅ Exemplo de variáveis de ambiente
├── .env.local              ✅ Variáveis reais (já configuradas)
├── DOCKER_USAGE.md         ✅ Este arquivo
├── docker-setup.md         ✅ Documentação técnica
└── app/api/health/         ✅ Rota de health check
```

## ⚡ **Exemplo Prático - Passo a Passo**

```bash
# No seu terminal:
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD
git checkout feature/docker-integration
docker-compose up biodash-backend --build

# Aguarde aparecer estas linhas:
#    ▲ Next.js 16.0.1 (Turbopack)
#    - Local:        http://localhost:3003
#    - Network:      http://172.x.x.x:3003
#  ✓ Starting...

# Em outro terminal, teste a API:
curl http://localhost:3003/api/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

## 🎯 **Resolução de Problemas**

### **Porta 3003 ocupada:**
```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <NUMBER> /F

# Linux/Mac  
sudo kill -9 $(lsof -t -i:3003)
```

### **Container não sobe:**
```bash
docker-compose down
docker-compose up biodash-backend --build
```

### **Problemas de cache:**
```bash
docker system prune -f
docker-compose build --no-cache
docker-compose up biodash-backend --build
```

### **Erro de versão Node.js:**
O Dockerfile já está configurado com Node.js 20 (requerido pelo Next.js 16)

## 🌐 **APIs Disponíveis**

Com o backend rodando, você pode acessar:

- **Health Check:** `GET http://localhost:3003/api/health`
- **Usuários:** `GET http://localhost:3003/api/user`  
- **Atividades:** `GET http://localhost:3003/api/activities`
- **Dashboard:** `GET http://localhost:3003/api/dashboard/indicators`
- **Biodigestor:** `GET http://localhost:3003/api/biodigester/data`
- **Auth:** `POST http://localhost:3003/api/auth/login`
- **Stripe:** `POST http://localhost:3003/api/stripe`

## 🔥 **Status do Projeto**

- ✅ **Dockerfile** funcionando (Node.js 20 + Alpine)
- ✅ **docker-compose.yml** configurado
- ✅ **Health check** implementado
- ✅ **Variáveis de ambiente** configuradas
- ✅ **CORS** habilitado para frontend
- ✅ **API Routes** todas funcionais

## 📞 **Comunicação Frontend ↔ Backend**

### **Backend Local + Frontend Docker:**
```javascript
// Frontend usa:
const API_BASE = "http://localhost:3003"
```

### **Ambos em Docker:**
```javascript
// Frontend usa:
const API_BASE = "http://biodash-backend:3003"
```

---

## 🏁 **Pronto para Usar!**

O backend está **100% dockerizado** e **testado**. Qualquer pessoa pode clonar o repositório, entrar na branch `feature/docker-integration`, rodar `docker-compose up biodash-backend --build` e ter o backend funcionando em poucos minutos!

**Para desenvolvedores:** Este setup suporta hot reload, volumes persistentes e debugging completo.