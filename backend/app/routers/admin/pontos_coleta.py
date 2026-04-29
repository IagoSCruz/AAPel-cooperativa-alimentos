"""Admin CRUD: collection points (pickup locations)."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.logistics import CollectionPoint
from app.schemas.delivery import (
    CollectionPointCreate,
    CollectionPointResponse,
    CollectionPointUpdate,
)
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@router.get(
    "",
    response_model=Page[CollectionPointResponse],
    summary="Lista pontos de coleta",
)
async def list_collection_points(
    db: DbSession,
    pagination: PageQuery = Depends(),
    incluir_inativos: bool = Query(default=False),
    incluir_deletados: bool = Query(default=False),
) -> Page[CollectionPointResponse]:
    base = select(CollectionPoint)
    count_q = select(func.count(CollectionPoint.id))

    if not incluir_deletados:
        base = base.where(CollectionPoint.deleted_at.is_(None))
        count_q = count_q.where(CollectionPoint.deleted_at.is_(None))
    if not incluir_inativos:
        base = base.where(CollectionPoint.active.is_(True))
        count_q = count_q.where(CollectionPoint.active.is_(True))

    total = (await db.execute(count_q)).scalar_one()
    rows = (
        await db.execute(
            base.order_by(CollectionPoint.name).limit(pagination.limit).offset(pagination.offset)
        )
    ).scalars().all()

    return Page[CollectionPointResponse](
        data=[CollectionPointResponse.model_validate(p) for p in rows],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{point_id}",
    response_model=CollectionPointResponse,
    summary="Detalha um ponto de coleta",
)
async def get_collection_point(point_id: UUID, db: DbSession) -> CollectionPoint:
    point = await db.get(CollectionPoint, point_id)
    if point is None:
        raise NotFound("Ponto de coleta não encontrado")
    return point


@router.post(
    "",
    response_model=CollectionPointResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um ponto de coleta",
)
async def create_collection_point(
    payload: CollectionPointCreate,
    db: DbSession,
) -> CollectionPoint:
    point = CollectionPoint(**payload.model_dump())
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point


@router.patch(
    "/{point_id}",
    response_model=CollectionPointResponse,
    summary="Atualiza um ponto de coleta (parcial)",
)
async def update_collection_point(
    point_id: UUID,
    payload: CollectionPointUpdate,
    db: DbSession,
) -> CollectionPoint:
    point = await db.get(CollectionPoint, point_id)
    if point is None or point.deleted_at is not None:
        raise NotFound("Ponto de coleta não encontrado")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(point, field, value)
    point.updated_at = _utcnow()

    await db.commit()
    await db.refresh(point)
    return point


@router.delete(
    "/{point_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete de um ponto de coleta",
)
async def delete_collection_point(point_id: UUID, db: DbSession) -> None:
    point = await db.get(CollectionPoint, point_id)
    if point is None or point.deleted_at is not None:
        raise NotFound("Ponto de coleta não encontrado")

    point.deleted_at = _utcnow()
    point.active = False
    point.updated_at = _utcnow()

    await db.commit()
    return None
