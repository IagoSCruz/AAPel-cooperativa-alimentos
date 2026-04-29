"""Admin sub-router.

Aggregates all /api/admin/* endpoints. The `require_admin` dependency is applied
at the router level — every nested route inherits the admin guard.

Public routes live in `app.routers.<context>`; admin write/manage routes live in
`app.routers.admin.<context>`.
"""

from fastapi import APIRouter, Depends

from app.dependencies import require_admin
from app.routers.admin import (
    categorias,
    cestas,
    curadorias,
    pontos_coleta,
    produtores,
    produtos,
    zonas_entrega,
)

router = APIRouter(dependencies=[Depends(require_admin)])

router.include_router(produtores.router, prefix="/produtores", tags=["admin-produtores"])
router.include_router(produtos.router, prefix="/produtos", tags=["admin-produtos"])
router.include_router(categorias.router, prefix="/categorias", tags=["admin-categorias"])
router.include_router(cestas.router, prefix="/cestas", tags=["admin-cestas"])
router.include_router(curadorias.router, prefix="/curadorias", tags=["admin-curadorias"])
router.include_router(zonas_entrega.router, prefix="/zonas-entrega", tags=["admin-zonas-entrega"])
router.include_router(pontos_coleta.router, prefix="/pontos-coleta", tags=["admin-pontos-coleta"])
