# AGENTS.md

## Cursor Cloud specific instructions

See `Makefile` and `.env.example` for local dev. For **Magalu VPS production**, use the section below.

## Magalu VPS — acesso mínimo (admin + loja)

### Pré-requisitos

1. `sudo bash scripts/setup-secrets.sh` com `AAPEL_DOMAIN` e `ACME_EMAIL` válidos.
2. `sudo bash scripts/deploy.sh` (build, migrate, `up -d`).
3. Se o deploy já existia **antes** de `JWT_SECRET` no `web.env`:
   ```bash
   sudo bash scripts/sync-web-jwt-secret.sh
   bash scripts/deploy.sh
   ```
4. Criar/atualizar admin (não apaga catálogo):
   ```bash
   ADMIN_EMAIL=admin@seu-dominio.com.br ADMIN_PASSWORD='senha-forte' \
     docker compose -f compose.yaml -f compose.prod.yaml --profile migrate run --rm migrate pnpm db:create-admin
   ```
   Ou após seed completo: `make create-admin` em dev.

### URLs

| Área | URL |
|------|-----|
| Loja | `https://<AAPEL_DOMAIN>/` |
| Admin | `https://<AAPEL_DOMAIN>/admin/login` |
| API docs (se `DEBUG=true`) | `https://<AAPEL_DOMAIN>/api/docs` |

### Upload de imagens

- Admin: botão **Enviar imagem** nos formulários de produto, produtor e cesta.
- Arquivos ficam em volume Docker e são servidos em `/uploads/*` (Caddy → API).
- Também é possível colar URL (ex.: Unsplash).

### Login

- **Admin:** `/admin/login` — usuário com `role=ADMIN`.
- **Cliente:** `/conta/login` e `/conta/cadastro`.
- E-mails `.local` são aceitos na API (ex.: legado `admin@aapel.local`).

### Serviços (dev)

| Serviço | Comando | Porta |
|---------|---------|------|
| PostgreSQL + API | `make dev` | 5432 / 8000 |
| Next.js | `pnpm dev` (host) | 3000 |

Em dev no host, **não** defina `INTERNAL_API_URL` no `.env` (use `http://localhost:8000`).

### Gotchas

- `pnpm db:push` é interativo (`strict: true` no Drizzle).
- `JWT_SECRET` no container `web` deve ser **igual** ao da API (`compose.prod.yaml` + `web.env`).
- Sem testes automatizados no repositório ainda.
