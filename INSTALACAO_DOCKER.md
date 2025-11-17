# 🐳 BioDash - Guia de Instalação Docker

## 🚀 **Como instalar e usar o BioDash (Frontend + Backend)**

### **📋 PASSO A PASSO COMPLETO**

## **1️⃣ PRÉ-REQUISITOS**

```bash
# 1. Instalar Docker Desktop
# Baixar de: https://www.docker.com/products/docker-desktop

# 2. Verificar instalação
docker --version
docker-compose --version
```

## **2️⃣ BACKEND (BioDashBD)**

```bash
# 1. Clonar repositório do backend
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD

# 2. Entrar na branch Docker
git checkout feature/docker-integration

# 3. Verificar arquivo .env.local (já configurado)
# Se não existir, copie do exemplo:
# cp .env.example .env.local

# 4. Rodar APENAS o backend (importante: sem o frontend junto)
docker-compose up biodash-backend --build

# ✅ Backend funcionando em: http://localhost:3003
# ✅ API Health check: http://localhost:3003/api/health
```

## **3️⃣ FRONTEND (BioDashFront)**

```bash
# Em outro terminal (manter backend rodando):

# 1. Clonar repositório do frontend
git clone https://github.com/Adejarbas/BioDashFront
cd BioDashFront

# 2. Entrar na branch Docker
git checkout feature/docker-setup

# 3. Rodar APENAS o frontend (sem tentar subir backend junto)
docker-compose up biodash-front --build

# ✅ Frontend funcionando em: http://localhost:3001
```

## **4️⃣ VERIFICAR SE ESTÁ FUNCIONANDO**

```bash
# Testar backend
curl http://localhost:3003/api/health
# Deve retornar: {"status":"ok","timestamp":"..."}

# Testar frontend
curl http://localhost:3001
# Deve retornar: HTML da página inicial

# Ver containers rodando
docker ps
# Deve mostrar ambos containers ativos
```

## **🔧 COMANDOS ÚTEIS**

```bash
# Ver containers rodando
docker ps

# Ver logs do backend
docker-compose logs -f biodash-backend

# Ver logs do frontend  
docker-compose logs -f biodash-front

# Parar containers
docker-compose down

# Rebuild completo (se houver problemas)
docker-compose build --no-cache
docker-compose up --build

# Limpar Docker (se necessário)
docker system prune -f
```

## **⚠️ RESOLUÇÃO DE PROBLEMAS**

### **Erro: "service depends on undefined service":**
```bash
# Isso acontece quando o frontend tenta depender de um backend que não existe no mesmo arquivo
# SOLUÇÃO: Rodar backend e frontend SEPARADAMENTE em terminais diferentes
```

### **Warning: "DATABASE_URL variable is not set":**
```bash
# Isso é normal no frontend - ele não precisa dessas variáveis
# O backend deve ter seu próprio .env.local configurado
```

### **Warning: "version is obsolete":**
```bash
# Docker Compose versões mais novas não precisam da linha version
# É apenas um warning, não afeta o funcionamento
```

### **Porta ocupada:**
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :3003
taskkill /PID <NUMERO> /F

# Linux/Mac
sudo kill -9 $(lsof -t -i:3001)
sudo kill -9 $(lsof -t -i:3003)
```

### **Container não sobe:**
```bash
# Parar tudo e tentar novamente
docker-compose down
docker-compose up --build

# Se persistir, limpar cache
docker system prune -f
docker-compose build --no-cache
```

### **Erro de conexão Frontend ↔ Backend:**
```bash
# Verificar se ambos estão na mesma rede Docker
docker network ls
docker network inspect biodash-network
```

## **🌐 URLS DE ACESSO**

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3003
- **Health Check:** http://localhost:3003/api/health
- **Swagger/Docs:** http://localhost:3003/api/docs (se disponível)

## **📦 ARQUITETURA**

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│   Backend       │
│   Port: 3001    │    │   Port: 3003    │
│   Docker Image  │    │   Docker Build  │
│   (Docker Hub)  │    │   (Local Build) │
└─────────────────┘    └─────────────────┘
         │                       │
         └───── biodash-network ──┘
```

## **🎯 STATUS DO PROJETO**

- ✅ **Frontend:** Imagem disponível no Docker Hub
- ✅ **Backend:** Docker configurado e funcionando
- ✅ **Comunicação:** Frontend ↔ Backend testada
- ✅ **Health Checks:** Implementados e funcionais
- ✅ **Hot Reload:** Disponível em modo desenvolvimento

## **🔥 EXEMPLO PRÁTICO**

```bash
# Sequência completa de instalação:

# Terminal 1 - Backend
git clone https://github.com/Adejarbas/BioDashBD
cd BioDashBD
git checkout feature/docker-integration
docker-compose up biodash-backend --build

# Terminal 2 - Frontend (aguardar backend estar rodando)
git clone https://github.com/Adejarbas/BioDashFront
cd BioDashFront
git checkout feature/docker-setup
docker-compose up biodash-front --build

# Terminal 3 - Verificação
curl http://localhost:3003/api/health
curl http://localhost:3001

# ✅ Pronto! BioDash funcionando completo!
```

---

## **📞 SUPORTE**

Se encontrar problemas:
1. Verificar se Docker Desktop está rodando
2. Conferir se as portas 3001 e 3003 estão livres
3. Tentar rebuild com `--no-cache`
4. Verificar logs dos containers com `docker-compose logs -f`

**🎉 Agora você tem o BioDash funcionando com Docker!**