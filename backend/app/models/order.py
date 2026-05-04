"""Order models: Order, OrderItem, BasketFulfillment."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive
from app.models._enums_sql import (
    DELIVERY_METHOD,
    LINE_TYPE,
    ORDER_STATUS,
    PAYMENT_METHOD,
    PAYMENT_STATUS,
    CHOSEN_BY,
)



class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    public_id: str = Field(max_length=20, unique=True)
    # pgEnum columns — see app.models._enums_sql for the rationale.
    status: str = Field(default="PENDING", sa_type=ORDER_STATUS)

    customer_id: UUID = Field(foreign_key="users.id")

    delivery_method: str = Field(sa_type=DELIVERY_METHOD)
    delivery_date: datetime

    delivery_zone_id: UUID | None = Field(default=None, foreign_key="delivery_zones.id")
    delivery_address: str | None = None
    delivery_neighborhood: str | None = Field(default=None, max_length=100)
    delivery_zip_code: str | None = Field(default=None, max_length=10)

    collection_point_id: UUID | None = Field(default=None, foreign_key="collection_points.id")

    payment_method: str = Field(sa_type=PAYMENT_METHOD)
    payment_status: str = Field(default="PENDING", sa_type=PAYMENT_STATUS)

    subtotal: Decimal = Field(max_digits=10, decimal_places=2)
    delivery_fee: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    total_amount: Decimal = Field(max_digits=10, decimal_places=2)

    notes: str | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id")
    line_type: str = Field(sa_type=LINE_TYPE)

    # if PRODUCT
    product_id: UUID | None = Field(default=None, foreign_key="products.id")
    producer_id: UUID | None = Field(default=None, foreign_key="producers.id")
    product_name_snapshot: str | None = Field(default=None, max_length=255)

    # if BASKET
    basket_curation_id: UUID | None = Field(default=None, foreign_key="basket_curations.id")
    basket_template_name_snapshot: str | None = Field(default=None, max_length=255)

    quantity: int
    unit_price_snapshot: Decimal = Field(max_digits=10, decimal_places=2)
    upgrade_total: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    line_total: Decimal = Field(max_digits=10, decimal_places=2)

    created_at: datetime = Field(default_factory=utcnow_naive)


class BasketFulfillment(SQLModel, table=True):
    __tablename__ = "basket_fulfillments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_item_id: UUID = Field(foreign_key="order_items.id")
    basket_slot_id: UUID = Field(foreign_key="basket_slots.id")
    product_id: UUID = Field(foreign_key="products.id")
    producer_id: UUID = Field(foreign_key="producers.id")

    upgrade_fee_paid: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)

    chosen_by: str = Field(sa_type=CHOSEN_BY)
    substituted_from_id: UUID | None = Field(default=None, foreign_key="products.id")
    substitution_reason: str | None = None

    created_at: datetime = Field(default_factory=utcnow_naive)
