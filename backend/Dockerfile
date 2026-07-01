# ── STAGE 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ── STAGE 2: Production ──────────────────────────────────────────────────────
FROM node:20-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

# Copy the startup script INTO the image
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Create prisma dir with correct ownership so node can write the SQLite file
RUN mkdir -p /app/prisma && chown -R node:node /app/prisma && chown node:node /app/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

USER node

CMD ["sh", "docker-entrypoint.sh"]
