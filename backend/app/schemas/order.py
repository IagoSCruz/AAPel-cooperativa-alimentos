"""Order API schemas: request/response DTOs for the /api/pedidos endpoint."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer

from app.models.enums import DeliveryMethod, OrderStatus, PaymentMethod


# ---------------------------------------------------------------------------
# Request DTOs (customer → API)
# ---------------------------------------------------------------------------


class OrderItemRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=100)


class OrderRequest(BaseModel):
    items: list[OrderItemRequest] = Field(min_length=1)
    delivery_method: DeliveryMethod
    # HOME_DELIVERY path
    delivery_zone_id: UUID | None = None
    delivery_address: str | None = Field(default=None, max_length=500)
    delivery_neighborhood: str | None = Field(default=None, max_length=100)
    # PICKUP path
    collection_point_id: UUID | None = None
    payment_method: PaymentMethod
    notes: str | None = Field(default=None, max_length=1000)


# ---------------------------------------------------------------------------
# Response DTOs (API → customer)
# ---------------------------------------------------------------------------


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID | None
    product_name_snapshot: str | None
    quantity: int
    unit_price_snapshot: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}

    @field_serializer("unit_price_snapshot", "line_total")
    def _serialize_money(self, v: Decimal) -> str:
        return f"{v:.2f}"


class OrderResponse(BaseModel):
    id: UUID
    public_id: str
    status: OrderStatus
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

    model_config = {"from_attributes": True}

    @field_serializer("subtotal", "delivery_fee", "total_amount")
    def _serialize_money(self, v: Decimal) -> str:
        return f"{v:.2f}"

    # Emit enums as their plain string values for JSON consistency.
    @field_serializer("status", "delivery_method", "payment_method")
    def _serialize_enum(
        self,
        v: OrderStatus | DeliveryMethod | PaymentMethod,
    ) -> str:
        return v.value
