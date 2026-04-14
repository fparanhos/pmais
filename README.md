# Pmais Eventos

Substitui a planilha `.xlsm` + Trello + n8n por uma aplicação web única.

## Stack
- **Backend**: FastAPI + SQLAlchemy + Postgres
- **Worker**: APScheduler (lembretes pré-evento)
- **Frontend**: Next.js 14 (App Router) + @dnd-kit
- **E-mail**: Resend
- **Auth**: JWT com roles (admin, produtor, financeiro, cliente)

## Rodar local

```bash
cp .env.example .env
# edite .env com suas credenciais
docker compose up --build
```

- Backend: http://localhost:8000 (docs em `/docs`)
- Frontend: http://localhost:3000
- Login inicial: `admin@pmaiseventos.com` / `changeme` (troque depois em `/docs` → POST `/api/auth/users`)

## Importar evento da planilha antiga

Coloque o arquivo em `./files/Pmais.xlsm` e rode:

```bash
docker compose exec backend python -m app.importer /files/Pmais.xlsm --name "Radar 2026"
```

Isso cria o evento, categorias e itens com valores planejado/orçado/contratado já preenchidos.

## Automações (substituem o VBA)
- Item muda status produtor para **Aprovado** → e-mail para financeiro
- Item muda status financeiro para **Pago** → e-mail para produtor
- 7 dias / 1 dia antes do evento → lembretes automáticos (worker diário às 08:00 BRT)

Templates editáveis em `/admin/templates`. Log em `/admin/logs`.

## Deploy no EasyPanel
O `docker-compose.yml` está pronto pro painel. Exponha `frontend:3000` e `backend:8000` pelos domínios próprios (ex.: `app.pmaiseventos.com.br` e `api.pmaiseventos.com.br`) e ajuste `FRONTEND_ORIGIN` + `NEXT_PUBLIC_API_URL` no `.env` pros domínios públicos.
