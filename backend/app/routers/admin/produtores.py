"""Admin CRUD: producers.

Producers are catalog entities only — they don't authenticate (decision: admin
manages everything). Soft-delete preserves order history when a producer leaves
the cooperative.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlmodel import select

from app.utils import utcnow_naive

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.catalog import Producer
from app.schemas.catalog import ProducerCreate, ProducerResponse, ProducerUpdate
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()



@router.get(
    "",
    response_model=Page[ProducerResponse],
    summary="Lista produtores (admin vê inclusive inativos e soft-deleted)",
)
async def list_producers(
    db: DbSession,
    pagination: PageQuery = Depends(),
    incluir_inativos: bool = Query(default=False),
    incluir_deletados: bool = Query(default=False),
) -> Page[ProducerResponse]:
    base = select(Producer)
    count_q = select(func.count(Producer.id))

    if not incluir_deletados:
        base = base.where(Producer.deleted_at.is_(None))
        count_q = count_q.where(Producer.deleted_at.is_(None))
    if not incluir_inativos:
        base = base.where(Producer.active.is_(True))
        count_q = count_q.where(Producer.active.is_(True))

    total = (await db.execute(count_q)).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Producer.name).limit(pagination.limit).offset(pagination.offset)
        )
    ).scalars().all()

    return Page[ProducerResponse](
        data=[ProducerResponse.model_validate(p) for p in rows],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{producer_id}",
    response_model=ProducerResponse,
    summary="Detalha um produtor",
)
async def get_producer(producer_id: UUID, db: DbSession) -> Producer:
    producer = await db.get(Producer, producer_id)
    if producer is None:
        raise NotFound("Produtor não encontrado")
    return producer


@router.post(
    "",
    response_model=ProducerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um produtor",
)
async def create_producer(payload: ProducerCreate, db: DbSession) -> Producer:
    producer = Producer(**payload.model_dump())
    db.add(producer)
    await db.commit()
    await db.refresh(producer)
    return producer


@router.patch(
    "/{producer_id}",
    response_model=ProducerResponse,
    summary="Atualiza um produtor (parcial)",
)
async def update_producer(
    producer_id: UUID,
    payload: ProducerUpdate,
    db: DbSession,
) -> Producer:
    producer = await db.get(Producer, producer_id)
    if producer is None or producer.deleted_at is not None:
        raise NotFound("Produtor não encontrado")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(producer, field, value)
    producer.updated_at = utcnow_naive()

    await db.commit()
    await db.refresh(producer)
    return producer


@router.delete(
    "/{producer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete de um produtor (preserva histórico de pedidos)",
)
async def delete_producer(producer_id: UUID, db: DbSession) -> None:
    producer = await db.get(Producer, producer_id)
    if producer is None or producer.deleted_at is not None:
        raise NotFound("Produtor não encontrado")

    producer.deleted_at = utcnow_naive()
    producer.active = False
    producer.updated_at = utcnow_naive()

    await db.commit()
    return None
