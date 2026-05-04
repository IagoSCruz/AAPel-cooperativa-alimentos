"""FastAPI application entry point.

Exposes the API under /api with OpenAPI docs at /api/docs.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app import __version__
from app.config import get_settings
from app.exceptions import register_exception_handlers
from app.rate_limit import limiter
from app.routers import auth, categorias, cestas, pedidos, pontos_coleta, produtores, produtos, zonas_entrega
from app.routers.admin import router as admin_router

# Importing models triggers SQLModel registration even though we don't use them
# directly here — required so SQLAlchemy knows the metadata at runtime.
from app import models  # noqa: F401

_settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown


# H4: hide OpenAPI/Swagger/ReDoc in production — DEBUG=true gates dev only.
_docs_enabled = _settings.debug
app = FastAPI(
    title="AAPel API",
    version=__version__,
    description="API da Cooperativa de Alimentos AAPel — backend FastAPI.",
    docs_url="/api/docs" if _docs_enabled else None,
    redoc_url="/api/redoc" if _docs_enabled else None,
    openapi_url="/api/openapi.json" if _docs_enabled else None,
    lifespan=lifespan,
)

# H1: rate limiter wiring — limiter is shared via app.rate_limit.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers (RFC 7807)
register_exception_handlers(app)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(categorias.router, prefix="/api/categorias", tags=["categorias"])
app.include_router(produtores.router, prefix="/api/produtores", tags=["produtores"])
app.include_router(produtos.router, prefix="/api/produtos", tags=["produtos"])
app.include_router(cestas.router, prefix="/api/cestas", tags=["cestas"])
app.include_router(zonas_entrega.router, prefix="/api/zonas-entrega", tags=["zonas-entrega"])
app.include_router(pontos_coleta.router, prefix="/api/pontos-coleta", tags=["pontos-coleta"])
app.include_router(pedidos.router, prefix="/api/pedidos", tags=["pedidos"])

# Admin sub-router (all nested routes require ADMIN role — guard applied at the
# sub-router level in app.routers.admin.__init__).
app.include_router(admin_router, prefix="/api/admin")


@app.get("/health", tags=["meta"], summary="Healthcheck")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "aapel-api", "version": __version__}
