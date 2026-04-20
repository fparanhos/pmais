#!/usr/bin/env sh
# Pmais+ · entrypoint
#   1) aplica migrations pendentes
#   2) garante que o admin demo existe (idempotente)
#   3) delega ao CMD (node server.js)
set -e

: "${DATABASE_URL:=file:/app/data/dev.db}"
export DATABASE_URL

echo "[pmaisplus] DATABASE_URL=${DATABASE_URL}"
echo "[pmaisplus] applying migrations…"
# Invocar prisma pelo path direto — sem depender de node_modules/.bin (não
# copiado no multi-stage build).
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma

if [ "${SEED_ON_BOOT:-false}" = "true" ]; then
  echo "[pmaisplus] seeding admin (SEED_ON_BOOT=true)…"
  node ./node_modules/tsx/dist/cli.mjs ./scripts/seed-admin.ts || true
fi

echo "[pmaisplus] starting Next server"
exec "$@"
