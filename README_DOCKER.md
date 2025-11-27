# 🐳 BioDash - Guia Docker Completo

## 🚀 **Como rodar o BioDash com Docker**

### **📋 PASSO A PASSO**

## **1️⃣ PRÉ-REQUISITOS**
- Docker Desktop instalado e rodando
- Git

## **2️⃣ BACKEND**

```bash
# 1. Clonar e configurar backend
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD
git checkout feature/docker-integration

# 2. Configurar variáveis
copy .env.example .env.local
# Edite .env.local com suas chaves reais

# 3. Rodar backend
docker-compose up biodash-backend --build

# ✅ Backend: http://localhost:3003
# ✅ Health: http://localhost:3003/api/health
```

## **3️⃣ FRONTEND**

```bash
# Em outro terminal (manter backend rodando):

# 1. Clonar e configurar frontend
git clone https://github.com/Adejarbas/BioDashFront
cd BioDashFront
git checkout hotfix/atualizar-docker

# 2. Configurar variáveis
copy .env.example .env.local
# Edite .env.local com suas chaves reais

# 3. Rodar frontend
docker compose -f docker-compose.dev.yml up biodash-frontend-dev --build

# ✅ Frontend: http://localhost:3001
```

## **🔧 COMANDOS ÚTEIS**

```bash
# Ver containers rodando
docker ps

# Parar containers
docker compose down

# Rebuild completo
docker compose build --no-cache

# Ver logs
docker compose logs -f NOME_DO_SERVICE
```

## **⚠️ PROBLEMAS COMUNS**

**Porta ocupada:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <NUMERO> /F
```

**Container não sobe:**
```bash
docker compose down --remove-orphans
docker compose up --build
```

**Erro de dependências:**
- Frontend usa `npm install --legacy-peer-deps`
- Backend já está configurado

---

## **🎯 RESUMO**
1. Clone backend → `docker-compose up biodash-backend --build`
2. Clone frontend → `copy .env.example .env.local` → `docker compose -f docker-compose.dev.yml up biodash-frontend-dev --build`
3. Acesse: Frontend em :3001, Backend em :3003

**🎉 Pronto! BioDash funcionando com Docker!**