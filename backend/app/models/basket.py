"""Basket models: Template, Slot, Curation, CurationSlotOption."""

from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive
from app.models._enums_sql import CURATION_STATUS



class BasketTemplate(SQLModel, table=True):
    __tablename__ = "basket_templates"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    description: str | None = None
    base_price: Decimal = Field(max_digits=10, decimal_places=2)
    image_url: str | None = Field(default=None, max_length=500)
    serves: str | None = Field(default=None, max_length=50)
    customization_window_hours: int = Field(default=24)
    active: bool = Field(default=True)
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)


class BasketSlot(SQLModel, table=True):
    __tablename__ = "basket_slots"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    basket_template_id: UUID = Field(foreign_key="basket_templates.id")
    slot_label: str = Field(max_length=100)
    position: int
    item_count: int


class BasketCuration(SQLModel, table=True):
    __tablename__ = "basket_curations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    basket_template_id: UUID = Field(foreign_key="basket_templates.id")
    delivery_week: date
    customization_deadline: datetime
    status: str = Field(default="DRAFT", sa_type=CURATION_STATUS)
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)


class BasketCurationSlotOption(SQLModel, table=True):
    __tablename__ = "basket_curation_slot_options"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    basket_curation_id: UUID = Field(foreign_key="basket_curations.id")
    basket_slot_id: UUID = Field(foreign_key="basket_slots.id")
    product_id: UUID = Field(foreign_key="products.id")
    upgrade_fee: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=2)

