"""Admin pedidos router — list + status management.

Endpoints:
  GET    /api/admin/pedidos                    — paginated list with filters
  GET    /api/admin/pedidos/{id}               — single order detail
  PATCH  /api/admin/pedidos/{id}/status        — order status transition
  PATCH  /api/admin/pedidos/{id}/payment-status — payment status update
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel, field_serializer
from sqlalchemy import func, or_
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.enums import DeliveryMethod, OrderStatus, PaymentMethod, PaymentStatus
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderItemResponse
from app.schemas.pagination import Page, PageMeta

router = APIRouter()


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class AdminOrderResponse(BaseModel):
    id: UUID
    public_id: str
    status: OrderStatus
    payment_status: PaymentStatus
    delivery_method: DeliveryMethod
    delivery_address: str | None
    delivery_neighborhood: str | None
    payment_method: PaymentMethod
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    delivery_date: datetime
    notes: str | None
    items: list[OrderItemResponse]
    created_at: datetime
    # admin-only fields
    customer_id: UUID
    customer_name: str
    customer_email: str

    model_config = {"from_attributes": True}

    @field_serializer("subtotal", "delivery_fee", "total_amount")
    def _serialize_money(self, v: Decimal) -> str:
        return f"{v:.2f}"

    @field_serializer("status", "delivery_method", "payment_method", "payment_status")
    def _serialize_enum(self, v: OrderStatus | DeliveryMethod | PaymentMethod | PaymentStatus) -> str:
        return v.value


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class UpdateStatusRequest(BaseModel):
    status: OrderStatus


class UpdatePaymentStatusRequest(BaseModel):
    payment_status: PaymentStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_response(order: Order, items: list[OrderItem], customer: User) -> AdminOrderResponse:
    return AdminOrderResponse(
        id=order.id,
        public_id=order.public_id,
        status=OrderStatus(order.status),
        payment_status=PaymentStatus(order.payment_status),
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
        customer_id=customer.id,
        customer_name=customer.name,
        customer_email=customer.email,
    )


async def _get_order_or_404(db: DbSession, order_id: UUID) -> tuple[Order, list[OrderItem], User]:
    order = await db.get(Order, order_id)
    if order is None:
        raise NotFound(f"Pedido {order_id} não encontrado")

    customer = await db.get(User, order.customer_id)
    if customer is None:
        raise NotFound("Cliente do pedido não encontrado")  # pragma: no cover

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = list(items_result.scalars().all())

    return order, items, customer


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=Page[AdminOrderResponse],
    summary="Lista todos os pedidos (admin)",
)
async def list_orders(
    db: DbSession,
    status: OrderStatus | None = Query(None, description="Filtrar por status do pedido"),
    payment_status: PaymentStatus | None = Query(None, description="Filtrar por status de pagamento"),
    search: str | None = Query(None, description="Busca por ID público, nome ou e-mail do cliente"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> Page[AdminOrderResponse]:
    offset = (page - 1) * limit

    # Build base query with JOIN to users
    base_conditions = []
    if status is not None:
        base_conditions.append(Order.status == status.value)
    if payment_status is not None:
        base_conditions.append(Order.payment_status == payment_status.value)

    # Sub-query to get customer ids matching search term
    search_condition = None
    if search:
        term = f"%{search.strip()}%"
        # We need to join with User to search name/email
        user_ids_q = select(User.id).where(
            or_(
                User.name.ilike(term),
                User.email.ilike(term),
            )
        )
        search_condition = or_(
            Order.public_id.ilike(term),
            Order.customer_id.in_(user_ids_q),
        )

    # Count query
    count_q = select(func.count(Order.id))
    for cond in base_conditions:
        count_q = count_q.where(cond)
    if search_condition is not None:
        count_q = count_q.where(search_condition)
    total: int = (await db.execute(count_q)).scalar_one()

    # Fetch orders
    orders_q = select(Order).order_by(Order.created_at.desc()).limit(limit).offset(offset)
    for cond in base_conditions:
        orders_q = orders_q.where(cond)
    if search_condition is not None:
        orders_q = orders_q.where(search_condition)

    orders = list((await db.execute(orders_q)).scalars().all())

    if not orders:
        return Page[AdminOrderResponse](
            data=[],
            pagination=PageMeta(page=page, limit=limit, total=total, has_next=False),
        )

    order_ids = [o.id for o in orders]
    customer_ids = list({o.customer_id for o in orders})

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id.in_(order_ids))
    )
    all_items = list(items_result.scalars().all())
    items_by_order: dict[UUID, list[OrderItem]] = {o.id: [] for o in orders}
    for item in all_items:
        items_by_order[item.order_id].append(item)

    customers_result = await db.execute(
        select(User).where(User.id.in_(customer_ids))
    )
    customers_by_id: dict[UUID, User] = {u.id: u for u in customers_result.scalars().all()}

    return Page[AdminOrderResponse](
        data=[
            _build_response(o, items_by_order[o.id], customers_by_id[o.customer_id])
            for o in orders
            if o.customer_id in customers_by_id
        ],
        pagination=PageMeta(
            page=page,
            limit=limit,
            total=total,
            has_next=(offset + limit) < total,
        ),
    )


@router.get(
    "/{order_id}",
    response_model=AdminOrderResponse,
    summary="Detalhe de um pedido (admin)",
)
async def get_order(order_id: UUID, db: DbSession) -> AdminOrderResponse:
    order, items, customer = await _get_order_or_404(db, order_id)
    return _build_response(order, items, customer)


@router.patch(
    "/{order_id}/status",
    response_model=AdminOrderResponse,
    summary="Atualiza o status de um pedido",
)
async def update_order_status(
    order_id: UUID,
    payload: UpdateStatusRequest,
    db: DbSession,
) -> AdminOrderResponse:
    order, items, customer = await _get_order_or_404(db, order_id)
    order.status = payload.status.value
    from app.utils import utcnow_naive
    order.updated_at = utcnow_naive()
    await db.commit()
    await db.refresh(order)
    return _build_response(order, items, customer)


@router.patch(
    "/{order_id}/payment-status",
    response_model=AdminOrderResponse,
    summary="Atualiza o status de pagamento de um pedido",
)
async def update_payment_status(
    order_id: UUID,
    payload: UpdatePaymentStatusRequest,
    db: DbSession,
) -> AdminOrderResponse:
    order, items, customer = await _get_order_or_404(db, order_id)
    order.payment_status = payload.payment_status.value
    from app.utils import utcnow_naive
    order.updated_at = utcnow_naive()
    await db.commit()
    await db.refresh(order)
    return _build_response(order, items, customer)
