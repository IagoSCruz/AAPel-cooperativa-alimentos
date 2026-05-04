"""POST /pedidos — create order; GET /pedidos/meus — list customer orders."""

import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import select, update

from app.dependencies import CurrentUser, DbSession
from app.exceptions import BadRequest, NotFound
from app.models.catalog import Product
from app.models.enums import (
    DeliveryMethod,
    LineType,
    OrderStatus,
    PaymentMethod,
)
from app.models.logistics import CollectionPoint, DeliveryZone
from app.models.order import Order, OrderItem
from app.schemas.order import OrderItemResponse, OrderRequest, OrderResponse
from app.schemas.pagination import Page, PageMeta, PageQuery
from app.utils import utcnow_naive

router = APIRouter()

# Collision retries — `orders.public_id` is VARCHAR(20), so we max out the
# suffix at hex(3) = 6 chars: `PED-YYYYMMDD-XXXXXX` = 19 chars, fits with
# 1 char to spare. 24-bit space (~16M/day) + 5 retries makes a collision
# astronomically unlikely at our volume.
_PUBLIC_ID_MAX_RETRIES = 5


def _generate_public_id() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = secrets.token_hex(3).upper()
    return f"PED-{today}-{suffix}"


def _next_delivery_date() -> datetime:
    """Returns next Tuesday at noon UTC (naive — see app.utils.utcnow_naive)."""
    now = utcnow_naive()
    days_until_tuesday = (1 - now.weekday()) % 7 or 7  # 1 = Tuesday
    return now.replace(hour=12, minute=0, second=0, microsecond=0) + timedelta(
        days=days_until_tuesday
    )


def _order_to_response(order: Order, items: list[OrderItem]) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        public_id=order.public_id,
        status=OrderStatus(order.status),
        delivery_method=DeliveryMethod(order.delivery_method),
        delivery_address=order.delivery_address,
        delivery_neighborhood=order.delivery_neighborhood,
        payment_method=PaymentMethod(order.payment_method),
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        total_amount=order.total_amount,
        delivery_date=order.delivery_date,
        notes=order.notes,
        items=[
            OrderItemResponse(
                id=i.id,
                product_id=i.product_id,
                product_name_snapshot=i.product_name_snapshot,
                quantity=i.quantity,
                unit_price_snapshot=i.unit_price_snapshot,
                line_total=i.line_total,
            )
            for i in items
        ],
        created_at=order.created_at,
    )


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um novo pedido (requer autenticação)",
)
async def create_order(
    payload: OrderRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> OrderResponse:
    # ── 1. Fetch all requested products in one query ──────────────────────────
    product_ids = [item.product_id for item in payload.items]
    result = await db.execute(
        select(Product).where(
            Product.id.in_(product_ids),
            Product.deleted_at.is_(None),
        )
    )
    products_by_id: dict[UUID, Product] = {p.id: p for p in result.scalars().all()}

    # ── 2. Pre-validate: all exist + flagged available (cheap checks) ─────────
    # Stock is re-checked atomically below; this pass surfaces friendly errors
    # for the common cases without taking row locks.
    for req_item in payload.items:
        product = products_by_id.get(req_item.product_id)
        if product is None:
            raise NotFound(f"Produto {req_item.product_id} não encontrado")
        if not product.available:
            raise BadRequest(f'Produto "{product.name}" não está disponível')

    # ── 3. Calculate subtotal ─────────────────────────────────────────────────
    subtotal = Decimal("0")
    for req_item in payload.items:
        product = products_by_id[req_item.product_id]
        subtotal += product.price * req_item.quantity

    # ── 4. Resolve delivery fee & validate logistics ──────────────────────────
    delivery_fee = Decimal("0")

    if payload.delivery_method == DeliveryMethod.HOME_DELIVERY:
        if not payload.delivery_zone_id:
            raise BadRequest("delivery_zone_id é obrigatório para entrega em domicílio")

        zone = await db.get(DeliveryZone, payload.delivery_zone_id)
        if zone is None or not zone.active or zone.deleted_at is not None:
            raise NotFound("Zona de entrega não encontrada")

        if subtotal < zone.minimum_order_value:
            raise BadRequest(
                f"Valor mínimo para entrega nessa zona é R${zone.minimum_order_value:.2f}"
            )

        delivery_fee = zone.delivery_fee

    elif payload.delivery_method == DeliveryMethod.PICKUP:
        if not payload.collection_point_id:
            raise BadRequest("collection_point_id é obrigatório para retirada em ponto")

        point = await db.get(CollectionPoint, payload.collection_point_id)
        if point is None or not point.active or point.deleted_at is not None:
            raise NotFound("Ponto de coleta não encontrado")

    # ── 5. Atomic stock decrement (fixes TOCTOU race) ─────────────────────────
    # For each line, issue a conditional UPDATE: decrement only if stock is
    # still sufficient at write time. If 0 rows match, another concurrent order
    # has consumed the inventory and we abort cleanly.
    for req_item in payload.items:
        product = products_by_id[req_item.product_id]
        decrement_result = await db.execute(
            update(Product)
            .where(
                Product.id == product.id,
                Product.stock >= req_item.quantity,
            )
            .values(stock=Product.stock - req_item.quantity)
        )
        if decrement_result.rowcount == 0:
            await db.rollback()
            raise BadRequest(
                f'Estoque insuficiente para "{product.name}" — '
                "outro pedido pode ter esgotado o item enquanto você finalizava."
            )

    # ── 6. Create Order with collision-tolerant public_id ─────────────────────
    order: Order | None = None
    last_error: IntegrityError | None = None
    for _ in range(_PUBLIC_ID_MAX_RETRIES):
        candidate_id = _generate_public_id()
        try:
            order = Order(
                public_id=candidate_id,
                customer_id=current_user.id,
                status=OrderStatus.PENDING.value,
                delivery_method=payload.delivery_method.value,
                delivery_date=_next_delivery_date(),
                delivery_zone_id=payload.delivery_zone_id,
                delivery_address=payload.delivery_address,
                delivery_neighborhood=payload.delivery_neighborhood,
                collection_point_id=payload.collection_point_id,
                payment_method=payload.payment_method.value,
                payment_status="PENDING",
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total_amount=subtotal + delivery_fee,
                notes=payload.notes,
            )
            db.add(order)
            await db.flush()  # forces UNIQUE constraint check
            break
        except IntegrityError as exc:
            last_error = exc
            await db.rollback()
            order = None
    if order is None:
        # Extremely unlikely with token_hex(4) + 5 retries, but fail loud.
        raise BadRequest("Não foi possível gerar um identificador de pedido")  # pragma: no cover

    # ── 7. Create OrderItems ──────────────────────────────────────────────────
    order_items: list[OrderItem] = []
    for req_item in payload.items:
        product = products_by_id[req_item.product_id]
        line_total = product.price * req_item.quantity

        item = OrderItem(
            order_id=order.id,
            line_type=LineType.PRODUCT.value,
            product_id=product.id,
            producer_id=product.producer_id,
            product_name_snapshot=product.name,
            quantity=req_item.quantity,
            unit_price_snapshot=product.price,
            line_total=line_total,
        )
        db.add(item)
        order_items.append(item)

    await db.commit()
    await db.refresh(order)
    for item in order_items:
        await db.refresh(item)

    return _order_to_response(order, order_items)


@router.get(
    "/meus",
    response_model=Page[OrderResponse],
    summary="Lista pedidos do usuário autenticado",
)
async def list_my_orders(
    db: DbSession,
    current_user: CurrentUser,
    pagination: PageQuery = Depends(),
) -> Page[OrderResponse]:
    count_q = select(func.count(Order.id)).where(Order.customer_id == current_user.id)
    total = (await db.execute(count_q)).scalar_one()

    orders_q = (
        select(Order)
        .where(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(pagination.limit)
        .offset(pagination.offset)
    )
    orders = list((await db.execute(orders_q)).scalars().all())

    if not orders:
        return Page[OrderResponse](
            data=[],
            pagination=PageMeta(
                page=pagination.page,
                limit=pagination.limit,
                total=total,
                has_next=False,
            ),
        )

    order_ids = [o.id for o in orders]
    items_q = select(OrderItem).where(OrderItem.order_id.in_(order_ids))
    all_items = list((await db.execute(items_q)).scalars().all())

    items_by_order: dict[UUID, list[OrderItem]] = {o.id: [] for o in orders}
    for item in all_items:
        items_by_order[item.order_id].append(item)

    return Page[OrderResponse](
        data=[_order_to_response(o, items_by_order[o.id]) for o in orders],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )
