# syntax=docker/dockerfile:1.7
# ============================================================================
# Next.js + Drizzle migrations image — multi-stage
# ============================================================================
# Stages:
#   deps      — installs all node_modules (with dev deps, used by builder)
#   builder   — runs `next build` (output: standalone)
#   runtime   — minimal Next.js standalone server (production)
#   migrate   — drizzle-kit + tsx for one-off migrations and seed
# ============================================================================

ARG NODE_VERSION=20

# ---------- deps -------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# libc6-compat helps with binary deps on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && \
    (pnpm install --frozen-lockfile 2>/dev/null || pnpm install)

# ---------- builder ----------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm build

# ---------- runtime (production web) -----------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy ONLY the standalone output + static assets + public dir
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --spider --quiet http://localhost:3000/ || exit 1

CMD ["node", "server.js"]

# ---------- migrate (Drizzle Kit one-off runner) -----------------------------
FROM node:${NODE_VERSION}-alpine AS migrate
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Reuse deps from the deps stage (includes drizzle-kit, drizzle-orm, postgres,
# tsx, dotenv — all needed by the migration / seed scripts).
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml* ./
COPY drizzle.config.ts ./
COPY database ./database

RUN corepack enable pnpm

CMD ["pnpm", "db:migrate"]
