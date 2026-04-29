"""GET /zonas-entrega — list active delivery zones with their neighborhoods."""

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DbSession
from app.models.logistics import DeliveryZone, DeliveryZoneNeighborhood
from app.schemas.delivery import DeliveryZoneResponse

router = APIRouter()


@router.get(
    "",
    response_model=list[DeliveryZoneResponse],
    summary="Lista zonas de entrega ativas com seus bairros",
)
async def list_delivery_zones(db: DbSession) -> list[DeliveryZoneResponse]:
    zones_result = await db.execute(
        select(DeliveryZone)
        .where(DeliveryZone.active.is_(True))
        .where(DeliveryZone.deleted_at.is_(None))
        .order_by(DeliveryZone.delivery_fee)
    )
    zones = list(zones_result.scalars().all())

    if not zones:
        return []

    zone_ids = [z.id for z in zones]
    nbh_result = await db.execute(
        select(DeliveryZoneNeighborhood)
        .where(DeliveryZoneNeighborhood.delivery_zone_id.in_(zone_ids))
        .order_by(DeliveryZoneNeighborhood.neighborhood)
    )
    neighborhoods = list(nbh_result.scalars().all())

    by_zone: dict = {z.id: [] for z in zones}
    for n in neighborhoods:
        by_zone.setdefault(n.delivery_zone_id, []).append(n.neighborhood)

    return [
        DeliveryZoneResponse(
            id=z.id,
            name=z.name,
            description=z.description,
            delivery_fee=z.delivery_fee,
            minimum_order_value=z.minimum_order_value,
            estimated_minutes=z.estimated_minutes,
            active=z.active,
            neighborhoods=by_zone.get(z.id, []),
        )
        for z in zones
    ]
