# AGENTS.md

## Cursor Cloud specific instructions

### Overview

AAPel is a food cooperative web platform (Next.js 15 frontend + FastAPI backend + PostgreSQL 16). See `README.md`, `ARCHITECTURE.md`, and `backend/README.md` for full details.

### Services

| Service | How to start | Port |
|---------|-------------|------|
| PostgreSQL + FastAPI API | `make dev` (Docker Compose) | 5432 / 8000 |
| Next.js frontend | `pnpm dev` (runs on host, not Docker) | 3000 |

### Running the dev environment

1. Ensure Docker daemon is running (`sudo dockerd &>/tmp/dockerd.log &` if not).
2. Copy `.env.example` to `.env` if `.env` doesn't exist.
3. **Important**: In `.env`, comment out or remove `INTERNAL_API_URL=http://api:8000`. This env var is for Docker-to-Docker communication (production). When running Next.js on the host with `pnpm dev`, it must reach the API at `http://localhost:8000` instead. The frontend code falls back to `NEXT_PUBLIC_API_URL` (localhost) when `INTERNAL_API_URL` is unset.
4. `make dev` — starts db + api containers.
5. `pnpm db:push` — pushes Drizzle schema (interactive prompt — select "Yes, I want to execute all statements").
6. `pnpm db:seed` — seeds dev data. Admin login: `admin@aapel.local` / `changeme` (note: the `.local` email domain fails the backend email validator — use `test@example.com` or similar for API auth testing).
7. `pnpm dev` — starts Next.js dev server with Turbopack on port 3000.

### Gotchas

- **`drizzle-kit push` is interactive** because `strict: true` is set in `drizzle.config.ts`. In tmux, send arrow-down + Enter to confirm, or pipe input if possible.
- **`pnpm lint` (i.e. `next lint`)** has no ESLint config set up — it prompts for interactive setup on first run. Backend linting uses `ruff` (`cd backend && uv run ruff check .`).
- **TypeScript type-checking**: `npx tsc --noEmit` from the repo root.
- **No automated test suites exist yet** (`backend/tests/` directory is empty; no frontend test framework is configured).
- **`pnpm.onlyBuiltDependencies`** must include `esbuild` and `sharp` in `package.json` for Next.js to work. This is already configured.
- The **admin seed email** `admin@aapel.local` cannot be used with the backend login endpoint due to email-validator rejecting `.local` TLD. Register users with standard email domains (e.g. `test@example.com`) for API auth testing.
