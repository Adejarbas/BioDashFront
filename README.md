# BioDash Frontend

Dashboard para monitoramento de biodigestores desenvolvido com Next.js 15, React 19, TypeScript e Tailwind CSS.

## 📋 Pré-requisitos

- Node.js 18+ e pnpm (para desenvolvimento local)
- Docker e Docker Compose (para containerização)
- Conta no Supabase
- Repositório do backend (BioDashBack)

## 🏗️ Arquitetura

Este projeto faz parte de uma arquitetura de microsserviços:

```
BioDash Ecosystem:
├── BioDashFront (este repositório) - Frontend Next.js
├── BioDashBack (repositório separado) - Backend/API
└── Database (Supabase PostgreSQL)
```

## 🚀 Configuração Inicial

### 1. Clone os repositórios

```bash
# Clone o frontend
git clone <url-do-biodashfront>
cd BioDashFront

# Clone o backend (em pasta paralela)
cd ..
git clone <url-do-biodashback>
```

### 2. Configuração das variáveis de ambiente

```bash
# No diretório do frontend
cp .env.example .env.local
```

⚠️ **IMPORTANTE**: Edite o `.env.local` e configure suas chaves:

```env
# Supabase (use suas credenciais reais)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_real

# Stripe (substitua pelas suas chaves reais)
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_STRIPE_SECRETA
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_STRIPE_PUBLICA

# URLs (geralmente não precisam mudar)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### 3. Escolha o modo de execução

#### 🐳 **Opção 1: Docker (Recomendado)**

```bash
# Rodar com Docker (mais fácil)
docker-compose up --build

# Resultado:
# Frontend: http://localhost:3001
# Backend: http://localhost:3003
```

#### 💻 **Opção 2: Desenvolvimento Local**

```bash
# 1. Instalar dependências
pnpm install --force

# 2. Rodar em modo desenvolvimento  
pnpm dev

# 3. Rodar backend separadamente
# (vá para pasta do backend e execute npm run dev)
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

## 🔧 Desenvolvimento Local (sem Docker)

### Frontend apenas:

```bash
cd BioDashFront
pnpm install --force
pnpm dev
```

O frontend estará disponível em: http://localhost:3001

**Nota:** Para funcionalidade completa, você precisa ter o backend rodando em http://localhost:8000

## 🐳 Desenvolvimento com Docker

### Scripts de gerenciamento automatizado

Para facilitar o uso, criamos scripts de gerenciamento:

#### Windows (PowerShell):
```powershell
# Iniciar desenvolvimento completo (frontend + backend)
.\docker-manager.ps1 -Command dev

# Iniciar apenas frontend
.\docker-manager.ps1 -Command start

# Parar todos os serviços
.\docker-manager.ps1 -Command stop

# Ver ajuda completa
.\docker-manager.ps1 -Command help
```

#### Linux/Mac (Bash):
```bash
# Tornar o script executável
chmod +x docker-manager.sh

# Iniciar desenvolvimento completo
./docker-manager.sh dev

# Iniciar apenas frontend
./docker-manager.sh start

# Parar todos os serviços
./docker-manager.sh stop

# Ver ajuda completa
./docker-manager.sh help
```

### Comandos Docker manuais

#### 1. Apenas Frontend:
```bash
# Build e start do frontend
docker-compose up --build biodash-front

# Em modo detached
docker-compose up -d biodash-front
```

#### 2. Desenvolvimento Completo (Frontend + Backend):
```bash
# Usando o arquivo de desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Com reconstrução das imagens
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

#### 3. Produção:
```bash
# Iniciar todos os serviços
docker-compose up --build -d

# Verificar status
docker-compose ps
```

### Estrutura dos Docker Compose

- **`docker-compose.yml`**: Configuração para produção
- **`docker-compose.dev.yml`**: Configuração para desenvolvimento com hot-reload

## 🌐 Portas e Serviços

| Serviço | Porta Local | Porta Container | URL |
|---------|-------------|-----------------|-----|
| Frontend | 3001 | 3001 | http://localhost:3001 |
| Backend | 8000 | 8000 | http://localhost:8000 |
| PostgreSQL* | 5432 | 5432 | localhost:5432 |

*Apenas se usar banco local ao invés do Supabase

## 🔧 Configuração de Rede Docker

Os containers se comunicam através de uma rede Docker customizada chamada `biodash-network`. Isso permite:

- **Frontend → Backend**: Via `http://biodash-backend:8000`
- **Backend → Database**: Via variáveis de ambiente
- **Acesso externo**: Via ports mapeados (3001, 8000)

## 📂 Estrutura do Projeto

```
BioDashFront/
├── app/                    # App Router (Next.js 15)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── [routes]/          # Páginas da aplicação
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── [features]/       # Componentes específicos
├── lib/                  # Utilitários e configurações
│   ├── utils.ts
│   ├── api.ts
│   └── supabase/        # Cliente Supabase
├── hooks/               # Custom hooks
├── styles/             # Estilos globais
├── public/             # Assets estáticos
├── scripts/            # Scripts SQL e utilitários
├── docker-compose.yml     # Docker para produção
├── docker-compose.dev.yml # Docker para desenvolvimento
├── Dockerfile            # Build para produção
├── Dockerfile.dev        # Build para desenvolvimento
├── docker-manager.sh     # Script de gerenciamento (Linux/Mac)
├── docker-manager.ps1    # Script de gerenciamento (Windows)
└── .env.example          # Exemplo de variáveis de ambiente
```

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Instalar dependências
pnpm install --force

# Rodar em desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Iniciar produção local
pnpm start
```

### Docker

```bash
# Ver logs dos containers
docker-compose logs -f

# Acessar shell do container
docker exec -it biodash-frontend bash

# Verificar status dos containers
docker-compose ps

# Limpar containers e imagens
docker-compose down --rmi all -v
```

### Troubleshooting

```bash
# Limpar cache do pnpm
pnpm store prune

# Reinstalar dependências
rm -rf node_modules pnpm-lock.yaml
pnpm install --force

# Rebuild Docker sem cache
docker-compose build --no-cache
```

## 🔒 Variáveis de Ambiente

### Frontend (.env.local)

```env
# API Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
```

### Docker Environment

```env
# Para docker-compose
DATABASE_URL=postgresql://user:pass@localhost:5432/biodash_db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 Deploy

### Preparação para produção

1. **Configure variáveis de ambiente de produção**
2. **Ajuste URLs do backend para ambiente de produção**
3. **Build das imagens:**

```bash
# Frontend
docker build -t biodash-frontend:latest .

# Deploy com docker-compose
docker-compose up -d --build
```

### Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] URLs de API atualizadas para produção
- [ ] SSL/HTTPS configurado
- [ ] Backup do banco de dados
- [ ] Monitoramento de logs configurado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões e suporte:

1. Verifique a [documentação](#)
2. Consulte os [logs dos containers](#comandos-úteis)
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

**Desenvolvido com ❤️ para monitoramento sustentável de biodigestores**