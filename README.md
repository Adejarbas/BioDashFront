# 🌿 BioDashFront – Frontend (Next.js)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Utility-blue?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?style=flat-square&logo=stripe)](https://stripe.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-3aa635?style=flat-square&logo=leaflet)](https://leafletjs.com/)

## 📋 Índice
- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração de Ambiente](#-configuração-de-ambiente)
- [Scripts](#-scripts)
- [Autenticação](#-autenticação)
- [Pagamentos (Stripe)](#-pagamentos-stripe)
- [Mapas e Geocodificação](#-mapas-e-geocodificação)
- [Integração com Backend](#-integração-com-backend)
- [Troubleshooting](#-troubleshooting)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Visão Geral
BioDashFront é o frontend da plataforma BioDash para gestão e monitoramento de biodigestores. Ele consome a API do backend (porta 3003) e oferece interface responsiva com autenticação, dashboard, formulários, mapas e fluxo de assinatura.

## ✨ Funcionalidades Principais
- Cadastro e login de usuários (Supabase Auth)
- Persistência de sessão (localStorage + cookies sb-*)
- Dashboard e indicadores
- Gestão de biodigestores (formulários, CEP, endereço)
- Checkout de planos (Stripe)
- Mapas e marcadores (Leaflet + Nominatim)
- Busca automática de CEP (ViaCEP)
- Interface responsiva (Tailwind + shadcn/ui)

## 🛠 Tecnologias
### Core
- Next.js (App Router, client/server components)
- React + TypeScript
- Tailwind CSS + tailwind-merge + clsx
- shadcn/ui (Buttons, Inputs, Cards)
- Geist Sans / Mono (tipografia)

### Autenticação
- Supabase (@supabase/supabase-js) – getSession, onAuthStateChange, signOut

### Pagamentos
- Stripe (checkout-session via backend)

### Mapas
- Leaflet (renderização)
- Nominatim (geocodificação pública)
- ViaCEP (busca de CEP)

### Utilidades
- LocalStorage / SessionStorage
- Fetch API (integração com backend)

## 📁 Estrutura de Pastas (simplificada)
```
BioDashFront/
├── app/                  # Páginas (App Router)
│   ├── page.tsx          # Landing
│   ├── login/            # Login
│   ├── register/         # Registro
│   ├── dashboard/        # Dashboard
│   ├── settings/         # Configurações
│   └── indicators/       # Indicadores
├── components/           # Componentes reutilizáveis
│   ├── leaflet-map.tsx   # Componente de mapa
│   └── ui/               # shadcn/ui wrappers
├── lib/
│   ├── supabase/         # Configuração Supabase
│   │   └── client.ts
│   ├── actions.ts        # Server actions (auth)
│   └── api.ts            # Helpers base URL
├── public/               # Imagens e assets
├── styles/               # CSS/Tailwind (globals)
├── .env.local.example    # Exemplo de variáveis
└── README.md
```

## ✅ Pré-requisitos
- Node.js >= 18
- pnpm (recomendado) ou npm/yarn
- Projeto Supabase criado
- Backend rodando (porta padrão 3003)

## 📦 Instalação
```bash
pnpm install
# ou
npm install
```

## ⚙️ Configuração de Ambiente
Copiar exemplo:
```bash
cp .env.local.example .env.local
```
Preencher:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
```
Não usar SERVICE_ROLE_KEY aqui.

## 🔧 Scripts
```bash
pnpm dev        # desenvolvimento
pnpm build      # build produção
pnpm start      # servir build
```

## 🔐 Autenticação
- Persistência via localStorage (storageKey sb-biodash-auth)
- Verificação com supabase.auth.getSession()
- Listener supabase.auth.onAuthStateChange
- Logout limpa local/session storage e redireciona para /login

## 💳 Pagamentos (Stripe)
Fluxo:
1. Usuário escolhe plano na landing.
2. Front envia POST para backend: /api/stripe/checkout-session
3. Backend cria session e devolve URL
4. Redireciona para Stripe Checkout
Requer backend configurado com STRIPE_SECRET_KEY.

Exemplo:
```ts
await fetch(`${API_BASE}/api/stripe/checkout-session`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'pro', amount: 1000 }),
})
```

## 🗺 Mapas e Geocodificação
- Leaflet renderiza mapa e marcadores
- Endereços persistidos em tabela (ex.: biodigestor_maps)
- Geocodificação: fetch para Nominatim (uso público)
- CEP: ViaCEP preenche endereço (logradouro, bairro, cidade, UF)

## 🔌 Integração com Backend
Base URL:
```ts
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003').replace(/\/+$/,'')
```
Sempre usar credentials: 'include' quando precisar enviar cookies de sessão.

## 🐛 Troubleshooting
| Problema | Causa | Solução |
|----------|-------|---------|
| Sessão parece sempre ativa | storage antigo | Limpar localStorage (sb-biodash-auth) |
| 401 ao buscar dados | Sem cookie | Usar fetch com credentials: 'include' |
| Checkout não redireciona | URL ausente | Verificar resposta do backend |
| Mapas sem marcadores | Não logado | Garantir sessão antes de buscar |
| CEP não preenche | Formato inválido | Usar 8 dígitos (ex.: 18055-870) |

## 🤝 Contribuição
1. Fork
2. Branch: `feature/minha-feature`
3. Commit claro
4. Pull Request

Padrões:
- TypeScript
- Componentes reutilizáveis
- Evitar lógica pesada em páginas
- Sem chaves sensíveis

## 📄 Licença
ISC (seguir padrão do projeto).

## 📞 Suporte
Abrir issue no repositório. Verificar variáveis de ambiente primeiro.

---
Feito para operar com o backend BioDashBD (porta 3003). Ajustar NEXT_PUBLIC_API_BASE_URL conforme ambiente (produção/homologação).