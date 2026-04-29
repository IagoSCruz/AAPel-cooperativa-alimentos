"""GET /pontos-coleta — list active collection points."""

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DbSession
from app.models.logistics import CollectionPoint
from app.schemas.delivery import CollectionPointResponse

router = APIRouter()


@router.get(
    "",
    response_model=list[CollectionPointResponse],
    summary="Lista pontos de coleta ativos",
)
async def list_collection_points(db: DbSession) -> list[CollectionPoint]:
    result = await db.execute(
        select(CollectionPoint)
        .where(CollectionPoint.active.is_(True))
        .where(CollectionPoint.deleted_at.is_(None))
        .order_by(CollectionPoint.name)
    )
    return list(result.scalars().all())
