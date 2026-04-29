"""Basket API schemas: Template, Slot, Curation."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_serializer

from app.models.enums import CurationStatus
from app.schemas.catalog import ProductResponse


class BasketSlotResponse(BaseModel):
    id: UUID
    slot_label: str
    position: int
    item_count: int

    model_config = {"from_attributes": True}


class BasketTemplateResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    base_price: Decimal
    image_url: str | None
    serves: str | None
    customization_window_hours: int
    active: bool
    slots: list[BasketSlotResponse]

    model_config = {"from_attributes": True}

    @field_serializer("base_price")
    def _serialize_base_price(self, v: Decimal) -> str:
        return f"{v:.2f}"


class BasketSlotOption(BaseModel):
    """A product eligible for a specific slot in a curation, with its upgrade fee."""

    product: ProductResponse
    upgrade_fee: Decimal

    @field_serializer("upgrade_fee")
    def _serialize_fee(self, v: Decimal) -> str:
        return f"{v:.2f}"


class CuratedSlot(BaseModel):
    """A slot enriched with the eligible products for the current week."""

    slot: BasketSlotResponse
    options: list[BasketSlotOption]


class BasketCurationResponse(BaseModel):
    id: UUID
    template_id: UUID
    template_name: str
    base_price: Decimal
    delivery_week: date
    customization_deadline: datetime
    status: CurationStatus
    slots: list[CuratedSlot]

    @field_serializer("base_price")
    def _serialize_price(self, v: Decimal) -> str:
        return f"{v:.2f}"


# ---------------------------------------------------------------------------
# Admin write DTOs
# ---------------------------------------------------------------------------


from pydantic import Field as _Field  # noqa: E402  (avoid clash if Field already imported)


class BasketSlotInput(BaseModel):
    """Slot input — used both at template creation and standalone slot updates."""

    slot_label: str = _Field(min_length=1, max_length=100)
    position: int = _Field(ge=0)
    item_count: int = _Field(ge=1, le=20)


class BasketSlotUpdate(BaseModel):
    slot_label: str | None = _Field(default=None, min_length=1, max_length=100)
    position: int | None = _Field(default=None, ge=0)
    item_count: int | None = _Field(default=None, ge=1, le=20)


class BasketTemplateCreate(BaseModel):
    name: str = _Field(min_length=1, max_length=255)
    description: str | None = None
    base_price: Decimal = _Field(ge=0, max_digits=10, decimal_places=2)
    image_url: str | None = _Field(default=None, max_length=500)
    serves: str | None = _Field(default=None, max_length=50)
    customization_window_hours: int = _Field(default=24, ge=1, le=720)
    active: bool = True
    slots: list[BasketSlotInput] = _Field(min_length=1)


class BasketTemplateUpdate(BaseModel):
    name: str | None = _Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    base_price: Decimal | None = _Field(default=None, ge=0, max_digits=10, decimal_places=2)
    image_url: str | None = _Field(default=None, max_length=500)
    serves: str | None = _Field(default=None, max_length=50)
    customization_window_hours: int | None = _Field(default=None, ge=1, le=720)
    active: bool | None = None


class BasketCurationCreate(BaseModel):
    basket_template_id: UUID
    delivery_week: date
    customization_deadline: datetime
    status: CurationStatus = CurationStatus.DRAFT


class BasketCurationUpdate(BaseModel):
    delivery_week: date | None = None
    customization_deadline: datetime | None = None
    status: CurationStatus | None = None


class BasketCurationOptionInput(BaseModel):
    """One eligible product for a slot, with its upgrade fee."""

    basket_slot_id: UUID
    product_id: UUID
    upgrade_fee: Decimal = _Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)


class SetCurationOptionsRequest(BaseModel):
    """Bulk replace of all options for a curation."""

    options: list[BasketCurationOptionInput]
