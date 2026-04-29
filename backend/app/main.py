"""FastAPI application entry point.

Exposes the API under /api with OpenAPI docs at /api/docs.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.exceptions import register_exception_handlers
from app.routers import auth, categorias, cestas, pontos_coleta, produtores, produtos, zonas_entrega
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


app = FastAPI(
    title="AAPel API",
    version=__version__,
    description="API da Cooperativa de Alimentos AAPel — backend FastAPI.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

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

# Admin sub-router (all nested routes require ADMIN role — guard applied at the
# sub-router level in app.routers.admin.__init__).
app.include_router(admin_router, prefix="/api/admin")


@app.get("/health", tags=["meta"], summary="Healthcheck")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "aapel-api", "version": __version__}
