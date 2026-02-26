# ── Stage 1 : build du frontend Vite ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # → dist/

# ── Stage 2 : image de production ────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Dépendances de production uniquement (express + tsx)
COPY package*.json ./
RUN npm ci --omit=dev

# Frontend compilé
COPY --from=builder /app/dist ./dist

# Serveur Express (TypeScript, lancé par tsx)
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:${PORT}/api/presets || exit 1

CMD ["node_modules/.bin/tsx", "server/index.ts"]
