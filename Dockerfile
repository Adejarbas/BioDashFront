# --- Estágio 1: "Builder" ---
# Aqui é onde instalamos tudo e "buildamos" o projeto
FROM node:18-alpine AS builder

# Argumentos de build para variáveis de ambiente
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_BASE_URL

# Define as variáveis de ambiente
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Instala pnpm globalmente
RUN npm install -g pnpm

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package.json pnpm-lock.yaml ./

# Instala TODAS as dependências (incluindo devDependencies) 
RUN pnpm install --force

# Copia o resto do código-fonte
COPY . .

# Roda o script de build do Next.js
RUN pnpm run build

# --- Estágio 2: "Produção" ---
# Aqui criamos a imagem final, que é limpa e enxuta
FROM node:18-alpine

# Instala pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# Copia os arquivos de pacotes do estágio "builder"
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Instala APENAS as dependências de produção
RUN pnpm install --force --prod

# Copia os arquivos "buildados" do estágio "builder"
COPY --from=builder /app/.next ./.next

# Copia a pasta "public" (imagens, fontes, etc.)
COPY --from=builder /app/public ./public

# Expõe a porta que o Next.js usa (configurada no package.json)
EXPOSE 3001

# O comando para iniciar o servidor Next.js em produção
CMD ["pnpm", "start"]