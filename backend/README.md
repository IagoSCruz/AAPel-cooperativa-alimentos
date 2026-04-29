# Backend — FastAPI

API da cooperativa AAPel. Stack: Python 3.11+, FastAPI, SQLModel, asyncpg, PostgreSQL.

Schema é gerenciado via **Drizzle Kit** (TypeScript) na raiz do repositório (`/database/`). Este backend apenas consome a base.

## Setup

```bash
# 1. Recomendado: uv (https://github.com/astral-sh/uv)
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Alternativa: pip + venv
python -m venv .venv
source .venv/bin/activate          # ou: .venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Então abra:

- API: http://localhost:8000/api
- OpenAPI docs: http://localhost:8000/api/docs
- Healthcheck: http://localhost:8000/health

## Variáveis de ambiente

São lidas do `.env` da raiz do repositório (não do `backend/.env`). Exemplo em `/.env.example`.

## Estrutura

```
backend/app/
├── main.py             # FastAPI app, CORS, lifespan, routers
├── config.py           # Pydantic Settings
├── database.py         # async engine + session factory
├── security.py         # JWT, bcrypt
├── dependencies.py     # get_session, get_current_user, require_admin
├── exceptions.py       # custom exceptions + handlers
├── models/             # SQLModel (mapped to Drizzle-managed tables)
├── schemas/            # Pydantic v2 (API contracts)
└── routers/            # FastAPI endpoint groups
```

## Convenções

- **Modelos** são read-only do ponto de vista de schema — o schema é definido em
  `database/schema.ts` (Drizzle). Modificar uma tabela requer atualizar o
  Drizzle schema, gerar migration, aplicar, e atualizar o SQLModel correspondente.
- **Decimais** são serializados como string em JSON (precisão financeira).
- **Datas** são UTC ISO 8601.
- **Erros** seguem RFC 7807 (Problem Details).
- **Auth** usa JWT HS256 (access 15min, refresh 7d) emitido por este backend e
  consumido pelo NextAuth.js no BFF.
