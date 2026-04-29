# syntax=docker/dockerfile:1.7
# ============================================================================
# FastAPI image — multi-stage build with uv
# ============================================================================
# Stage 1 (builder): installs Python deps with uv, freezing from uv.lock.
# Stage 2 (runtime): copies the venv into a slim image, runs as non-root.
# ============================================================================

ARG PYTHON_VERSION=3.11

# ---------- builder ----------------------------------------------------------
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install dependencies first (cache layer separate from app code)
COPY backend/pyproject.toml backend/uv.lock* ./backend/
WORKDIR /app/backend
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev || \
    uv sync --no-install-project --no-dev

# Copy app code and finalize install
COPY backend/app ./app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev || uv sync --no-dev

# ---------- runtime ----------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Non-root user
RUN groupadd --system --gid 1000 app \
    && useradd --system --uid 1000 --gid app --create-home --shell /sbin/nologin app

WORKDIR /app

# Bring the prepared venv + app code from the builder
COPY --from=builder --chown=app:app /app/backend/.venv /app/.venv
COPY --from=builder --chown=app:app /app/backend/app    /app/app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://localhost:8000/health',timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
