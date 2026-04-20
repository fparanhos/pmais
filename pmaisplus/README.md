# Pmais+

App web para controle financeiro de eventos da Pmais Eventos — substitui a
planilha `.xlsm` + board Trello por uma única plataforma com dashboard BI,
fluxo de aprovação e kanban de tarefas.

- **Stack**: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · Recharts · Prisma 6 · SQLite · NextAuth v5 · bcryptjs.
- **Credenciais demo**: `admin@pmaiseventos.com` / `pmais123`.

## Rodar local

```bash
npm install
cp .env.example .env            # ajuste DATABASE_URL com caminho ABSOLUTO
npm run db:migrate              # aplica schema
npm run db:seed                 # cria admin
npm run db:seed:demo            # popula Radar 2026 com mock realista
npm run db:import:trello        # popula kanban a partir do JSON Trello
npm run dev
```

Dados brutos (xlsm e JSON do Trello) ficam em `data/sources/` e não são
commitados. Para importar um board Trello diferente, substitua o JSON
em `data/sources/` e rode `npm run db:import:trello`.

## Deploy no Easypanel (Docker)

O repositório traz um `Dockerfile` multi-stage, `docker/entrypoint.sh` e
`scripts/seed-admin.ts` prontos para serem consumidos pelo Easypanel
(ou qualquer plataforma que rode imagens Docker).

1. **Service** → **Create** → **App (from GitHub)**.
2. Repositório: `fparanhos/pmais` · branch `main` · **Build path:** `pmaisplus`.
3. **Build type**: Dockerfile (caminho: `Dockerfile`, dentro do build path).
4. **Port**: `3000`.
5. **Volume persistente**: monte em `/app/data` (qualquer tamanho ≥ 200 MB).
   É onde o SQLite vive (`/app/data/dev.db`).
6. **Variáveis de ambiente** mínimas:

   | variável | valor sugerido |
   | --- | --- |
   | `DATABASE_URL` | `file:/app/data/dev.db` |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_TRUST_HOST` | `true` |
   | `AUTH_URL` | `https://<seu-dominio>` |
   | `SEED_ON_BOOT` | `true` (apenas no 1º boot, depois pode remover) |
   | `SEED_ADMIN_EMAIL` | `admin@pmaiseventos.com` |
   | `SEED_ADMIN_PASSWORD` | uma senha forte — **troque a demo** |
   | `SEED_ADMIN_NAME` | `Admin Pmais` |

7. **Domain**: aponte um subdomínio (ex: `pmais-plus.seu-dominio.com.br`)
   com proxy + TLS (Easypanel faz com Let's Encrypt).
8. Clique **Deploy**.

### O que acontece no boot

O `entrypoint.sh`:

1. aplica migrations pendentes (`prisma migrate deploy`);
2. se `SEED_ON_BOOT=true`, cria/atualiza o admin a partir das `SEED_*`;
3. inicia `node server.js` (build standalone do Next).

Para popular o evento demo (Radar 2026) no servidor de produção, use o
terminal do Easypanel:

```bash
npm run db:seed:demo
npm run db:import:trello    # só se você tiver copiado o JSON em data/sources/
```

## Estrutura

```
src/
├─ app/
│  ├─ (auth)/login/        Login split-screen com gradient Pmais
│  ├─ (app)/               Shell com sidebar dark, rotas protegidas
│  │  ├─ dashboard/        KPIs, gráficos e pipelines com drilldown
│  │  ├─ despesas/         CRUD de ExpenseItem + Supplier inline
│  │  ├─ receitas/         CRUD de RevenueItem por tipo
│  │  └─ tarefas/          Kanban Trello com drag-drop + checklists
│  └─ api/auth/            NextAuth route handlers
├─ components/             UI compartilhada (KpiCard, EventHeader,
│                          FinancialBar, StatusBadge, charts, shadcn/ui)
├─ lib/                    prisma, auth, queries, format, palette
└─ generated/prisma/       Cliente Prisma (não versionado)
prisma/
├─ schema.prisma           Event, ExpenseCategory, ExpenseItem, Supplier,
│                          RevenueItem, Task, Checklist + enums
└─ migrations/             Histórico de schema
scripts/
├─ seed-demo.ts            Popula Radar 2026 com mock realista
├─ seed-admin.ts           Cria/atualiza o admin via env vars
├─ import-trello.ts        Espelha o JSON Trello em Task/Checklist
└─ check-db.ts             Smoke test rápido
docker/entrypoint.sh       Migração + seed + exec "$@"
```

## Scripts úteis

| script | o que faz |
| --- | --- |
| `npm run dev` | Turbopack dev server em http://localhost:3000 |
| `npm run build` | Build de produção standalone |
| `npm run start` | Inicia o build standalone |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Cria/atualiza admin |
| `npm run db:seed:demo` | Popula Radar 2026 mock |
| `npm run db:import:trello` | Espelha o JSON do Trello |
| `npm run db:studio` | Prisma Studio |
