"""Admin CRUD: delivery zones (with neighborhoods).

A zone groups neighborhoods that share the same delivery fee. Each neighborhood
is unique system-wide (UNIQUE constraint at DB level) — a neighborhood can only
belong to one zone.

When a zone is created/updated with `neighborhoods=[...]`, the list FULLY
REPLACES the existing associations. Conflicts (a neighborhood already used by
another zone) raise 409.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlmodel import select

from app.utils import utcnow_naive

from app.dependencies import DbSession
from app.exceptions import Conflict, NotFound
from app.models.logistics import DeliveryZone, DeliveryZoneNeighborhood
from app.schemas.delivery import (
    DeliveryZoneCreate,
    DeliveryZoneResponse,
    DeliveryZoneUpdate,
)
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()



async def _zone_neighborhoods(db, zone_id: UUID) -> list[str]:
    rows = (
        await db.execute(
            select(DeliveryZoneNeighborhood.neighborhood)
            .where(DeliveryZoneNeighborhood.delivery_zone_id == zone_id)
            .order_by(DeliveryZoneNeighborhood.neighborhood)
        )
    ).all()
    return [r[0] for r in rows]


async def _to_response(db, zone: DeliveryZone) -> DeliveryZoneResponse:
    return DeliveryZoneResponse(
        id=zone.id,
        name=zone.name,
        description=zone.description,
        delivery_fee=zone.delivery_fee,
        minimum_order_value=zone.minimum_order_value,
        estimated_minutes=zone.estimated_minutes,
        active=zone.active,
        neighborhoods=await _zone_neighborhoods(db, zone.id),
    )


async def _set_neighborhoods(
    db,
    zone_id: UUID,
    names: list[str],
) -> None:
    """Bulk-replace neighborhoods of a zone. Raises Conflict on cross-zone dupes."""
    # Normalize: strip + dedupe (preserve case sensitivity of input for now)
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in names:
        n = raw.strip()
        if not n:
            continue
        key = n.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(n)

    # Detect conflicts with OTHER zones
    if cleaned:
        conflict_q = (
            select(DeliveryZoneNeighborhood)
            .where(DeliveryZoneNeighborhood.neighborhood.in_(cleaned))
            .where(DeliveryZoneNeighborhood.delivery_zone_id != zone_id)
        )
        conflicts = (await db.execute(conflict_q)).scalars().all()
        if conflicts:
            names_in_use = sorted({c.neighborhood for c in conflicts})
            raise Conflict(
                "Bairros já vinculados a outra zona: " + ", ".join(names_in_use)
            )

    # Delete current and re-insert
    current = (
        await db.execute(
            select(DeliveryZoneNeighborhood).where(
                DeliveryZoneNeighborhood.delivery_zone_id == zone_id
            )
        )
    ).scalars().all()
    for row in current:
        await db.delete(row)
    await db.flush()

    for n in cleaned:
        db.add(DeliveryZoneNeighborhood(delivery_zone_id=zone_id, neighborhood=n))


@router.get(
    "",
    response_model=Page[DeliveryZoneResponse],
    summary="Lista zonas de entrega",
)
async def list_zones(
    db: DbSession,
    pagination: PageQuery = Depends(),
    incluir_inativos: bool = Query(default=False),
    incluir_deletados: bool = Query(default=False),
) -> Page[DeliveryZoneResponse]:
    base = select(DeliveryZone)
    count_q = select(func.count(DeliveryZone.id))
    if not incluir_deletados:
        base = base.where(DeliveryZone.deleted_at.is_(None))
        count_q = count_q.where(DeliveryZone.deleted_at.is_(None))
    if not incluir_inativos:
        base = base.where(DeliveryZone.active.is_(True))
        count_q = count_q.where(DeliveryZone.active.is_(True))

    total = (await db.execute(count_q)).scalar_one()
    zones = (
        await db.execute(
            base.order_by(DeliveryZone.name).limit(pagination.limit).offset(pagination.offset)
        )
    ).scalars().all()

    return Page[DeliveryZoneResponse](
        data=[await _to_response(db, z) for z in zones],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{zone_id}",
    response_model=DeliveryZoneResponse,
    summary="Detalha uma zona de entrega",
)
async def get_zone(zone_id: UUID, db: DbSession) -> DeliveryZoneResponse:
    zone = await db.get(DeliveryZone, zone_id)
    if zone is None:
        raise NotFound("Zona não encontrada")
    return await _to_response(db, zone)


@router.post(
    "",
    response_model=DeliveryZoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma zona de entrega com seus bairros",
)
async def create_zone(payload: DeliveryZoneCreate, db: DbSession) -> DeliveryZoneResponse:
    zone = DeliveryZone(
        name=payload.name,
        description=payload.description,
        delivery_fee=payload.delivery_fee,
        minimum_order_value=payload.minimum_order_value,
        estimated_minutes=payload.estimated_minutes,
        active=payload.active,
    )
    db.add(zone)
    await db.flush()  # populate zone.id

    await _set_neighborhoods(db, zone.id, payload.neighborhoods)

    await db.commit()
    await db.refresh(zone)
    return await _to_response(db, zone)


@router.patch(
    "/{zone_id}",
    response_model=DeliveryZoneResponse,
    summary="Atualiza uma zona (parcial). Se `neighborhoods` for enviado, substitui a lista.",
)
async def update_zone(
    zone_id: UUID,
    payload: DeliveryZoneUpdate,
    db: DbSession,
) -> DeliveryZoneResponse:
    zone = await db.get(DeliveryZone, zone_id)
    if zone is None or zone.deleted_at is not None:
        raise NotFound("Zona não encontrada")

    updates = payload.model_dump(exclude_unset=True)
    neighborhoods = updates.pop("neighborhoods", None)

    for field, value in updates.items():
        setattr(zone, field, value)
    zone.updated_at = utcnow_naive()

    if neighborhoods is not None:
        await _set_neighborhoods(db, zone.id, neighborhoods)

    await db.commit()
    await db.refresh(zone)
    return await _to_response(db, zone)


@router.delete(
    "/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete de uma zona (libera bairros para outras zonas)",
)
async def delete_zone(zone_id: UUID, db: DbSession) -> None:
    zone = await db.get(DeliveryZone, zone_id)
    if zone is None or zone.deleted_at is not None:
        raise NotFound("Zona não encontrada")

    # Free up the neighborhoods so they can be reassigned to another zone
    await _set_neighborhoods(db, zone.id, [])

    zone.deleted_at = utcnow_naive()
    zone.active = False
    zone.updated_at = utcnow_naive()

    await db.commit()
    return None
