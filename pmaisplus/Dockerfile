## syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Pmais+ · imagem multi-stage
#   1) deps   — npm ci com devDeps pra build
#   2) build  — gera Prisma client + next build (standalone)
#   3) runner — Node 22 slim + libssl3 + só o necessário pra rodar
# ─────────────────────────────────────────────────────────────

FROM node:22-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# libssl3 é requisito do Prisma engine em Debian slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URL só é necessária em migrate/runtime. Para `prisma generate`
# + `next build` não precisamos conectar — passamos um placeholder.
ENV DATABASE_URL="file:/app/prisma/build-placeholder.db"

RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# libssl3 pra runtime do Prisma; tini opcional como init mais enxuto
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

# usuário não-root
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

# Artefatos do standalone (inclui server.js e node_modules mínimo)
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Prisma: schema + migrations + cliente gerado (sql + engines)
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/src/generated/prisma ./src/generated/prisma
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts
# node_modules completo do build — evita "module not found" em transitive
# deps do prisma/@prisma/config (e.g. `effect`). Imagem fica maior (~400MB)
# mas o entrypoint (prisma migrate deploy + tsx seed-admin) funciona sem
# montar o quebra-cabeça de dependências à mão.
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Diretório de dados (volume persistente em Easypanel)
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000

# tini repassa sinais (SIGTERM) corretamente pro Node
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
