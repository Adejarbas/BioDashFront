# --- Estágio 1: "Builder" ---
# Aqui é onde instalamos tudo e "buildamos" o projeto
FROM node:18-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de definição de pacotes
# Usamos "package*.json" para copiar package.json e package-lock.json
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies)
RUN npm install

# Copia o resto do código-fonte
COPY . .

# Roda o script de build do Next.js
RUN npm run build

# --- Estágio 2: "Produção" ---
# Aqui criamos a imagem final, que é limpa e enxuta
FROM node:18-alpine

WORKDIR /app

# Copia os arquivos de pacotes do estágio "builder"
COPY --from=builder /app/package*.json ./

# Instala APENAS as dependências de produção
RUN npm install --production

# Copia os arquivos "buildados" do estágio "builder"
COPY --from=builder /app/.next ./.next

# Copia a pasta "public" (imagens, fontes, etc.)
COPY --from=builder /app/public ./public

# Expõe a porta que o Next.js usa por padrão
EXPOSE 3000

# O comando para iniciar o servidor Next.js em produção
CMD ["npm", "start"]