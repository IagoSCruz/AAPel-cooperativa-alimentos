"""Order models: Order, OrderItem, BasketFulfillment."""

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    public_id: str = Field(max_length=20, unique=True)
    status: str = Field(default="PENDING", max_length=30)

    customer_id: UUID = Field(foreign_key="users.id")

    delivery_method: str = Field(max_length=20)
    delivery_date: datetime

    delivery_zone_id: UUID | None = Field(default=None, foreign_key="delivery_zones.id")
    delivery_address: str | None = None
    delivery_neighborhood: str | None = Field(default=None, max_length=100)
    delivery_zip_code: str | None = Field(default=None, max_length=10)

    collection_point_id: UUID | None = Field(default=None, foreign_key="collection_points.id")

    payment_method: str = Field(max_length=10)
    payment_status: str = Field(default="PENDING", max_length=20)

    subtotal: Decimal = Field(max_digits=10, decimal_places=2)
    delivery_fee: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    total_amount: Decimal = Field(max_digits=10, decimal_places=2)

    notes: str | None = None
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id")
    line_type: str = Field(max_length=10)

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

    created_at: datetime = Field(default_factory=_utcnow)


class BasketFulfillment(SQLModel, table=True):
    __tablename__ = "basket_fulfillments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    order_item_id: UUID = Field(foreign_key="order_items.id")
    basket_slot_id: UUID = Field(foreign_key="basket_slots.id")
    product_id: UUID = Field(foreign_key="products.id")
    producer_id: UUID = Field(foreign_key="producers.id")

    upgrade_fee_paid: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)

    chosen_by: str = Field(max_length=10)
    substituted_from_id: UUID | None = Field(default=None, foreign_key="products.id")
    substitution_reason: str | None = None

    created_at: datetime = Field(default_factory=_utcnow)
