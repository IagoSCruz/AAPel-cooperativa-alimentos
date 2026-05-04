"""Logistics models: DeliveryZone, DeliveryZoneNeighborhood, CollectionPoint."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive



class DeliveryZone(SQLModel, table=True):
    __tablename__ = "delivery_zones"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100)
    description: str | None = None
    delivery_fee: Decimal = Field(max_digits=10, decimal_places=2)
    minimum_order_value: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)
    estimated_minutes: int | None = None
    active: bool = Field(default=True)
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)


class DeliveryZoneNeighborhood(SQLModel, table=True):
    __tablename__ = "delivery_zone_neighborhoods"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    delivery_zone_id: UUID = Field(foreign_key="delivery_zones.id")
    neighborhood: str = Field(max_length=100, unique=True)


class CollectionPoint(SQLModel, table=True):
    __tablename__ = "collection_points"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    address: str = Field(max_length=500)
    city: str = Field(max_length=100)
    state: str = Field(max_length=2)
    description: str | None = None
    schedule: str | None = Field(default=None, max_length=255)
    active: bool = Field(default=True)
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)
