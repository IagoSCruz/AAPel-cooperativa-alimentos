"""Delivery API schemas: Zone, Neighborhood, CollectionPoint."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_serializer


class NeighborhoodResponse(BaseModel):
    id: UUID
    neighborhood: str

    model_config = {"from_attributes": True}


class DeliveryZoneResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    delivery_fee: Decimal
    minimum_order_value: Decimal
    estimated_minutes: int | None
    active: bool
    neighborhoods: list[str]

    model_config = {"from_attributes": True}

    @field_serializer("delivery_fee", "minimum_order_value")
    def _serialize_money(self, v: Decimal) -> str:
        return f"{v:.2f}"


class CollectionPointResponse(BaseModel):
    id: UUID
    name: str
    address: str
    city: str
    state: str
    description: str | None
    schedule: str | None
    active: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Admin write DTOs
# ---------------------------------------------------------------------------


from pydantic import Field as _Field  # noqa: E402


class DeliveryZoneCreate(BaseModel):
    name: str = _Field(min_length=1, max_length=100)
    description: str | None = None
    delivery_fee: Decimal = _Field(ge=0, max_digits=10, decimal_places=2)
    minimum_order_value: Decimal = _Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)
    estimated_minutes: int | None = _Field(default=None, ge=0)
    active: bool = True
    neighborhoods: list[str] = _Field(
        default_factory=list,
        description="List of neighborhood names this zone covers (must be unique system-wide).",
    )


class DeliveryZoneUpdate(BaseModel):
    name: str | None = _Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    delivery_fee: Decimal | None = _Field(default=None, ge=0, max_digits=10, decimal_places=2)
    minimum_order_value: Decimal | None = _Field(default=None, ge=0, max_digits=10, decimal_places=2)
    estimated_minutes: int | None = _Field(default=None, ge=0)
    active: bool | None = None
    neighborhoods: list[str] | None = _Field(
        default=None,
        description="If provided, FULLY replaces the zone's neighborhood list.",
    )


class CollectionPointCreate(BaseModel):
    name: str = _Field(min_length=1, max_length=255)
    address: str = _Field(min_length=1, max_length=500)
    city: str = _Field(min_length=1, max_length=100)
    state: str = _Field(min_length=2, max_length=2)
    description: str | None = None
    schedule: str | None = _Field(default=None, max_length=255)
    active: bool = True


class CollectionPointUpdate(BaseModel):
    name: str | None = _Field(default=None, min_length=1, max_length=255)
    address: str | None = _Field(default=None, min_length=1, max_length=500)
    city: str | None = _Field(default=None, min_length=1, max_length=100)
    state: str | None = _Field(default=None, min_length=2, max_length=2)
    description: str | None = None
    schedule: str | None = _Field(default=None, max_length=255)
    active: bool | None = None
