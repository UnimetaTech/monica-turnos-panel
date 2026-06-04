# Etapa 1: build con Node
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: produccion con Node + serve
FROM node:20-alpine
WORKDIR /app

# Instalar "serve" globalmente
RUN npm install -g serve

# Copiar solo el build
COPY --from=builder /app/dist ./dist

EXPOSE 4273
CMD ["serve", "-s", "dist", "-l", "4173"]
