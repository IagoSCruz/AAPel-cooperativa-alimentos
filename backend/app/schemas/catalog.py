"""Catalog API schemas: Producer, Category, Product."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer

from app.models.enums import ProductType


def _serialize_decimal(v: Decimal) -> str:
    return f"{v:.2f}"


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    image_url: str | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Producer
# ---------------------------------------------------------------------------


class ProducerSummary(BaseModel):
    """Lightweight producer for embedding in product responses."""

    id: UUID
    name: str
    location: str | None

    model_config = {"from_attributes": True}


class ProducerResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    story: str | None
    location: str | None
    image_url: str | None
    cover_image_url: str | None
    specialties: list[str] | None
    since: int | None
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------


class ProductFilters(BaseModel):
    categoria: str | None = None  # category name OR id
    busca: str | None = None
    organico: bool | None = None
    tipo: ProductType | None = None
    produtor_id: UUID | None = None
    disponiveis: bool | None = None  # only with stock and available


class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    price: Decimal
    unit: str
    image_url: str | None
    stock: int
    product_type: ProductType
    organic: bool
    premium: bool
    available: bool
    seasonal: bool
    category: CategoryResponse
    producer: ProducerSummary
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("price")
    def _serialize_price(self, v: Decimal) -> str:
        return _serialize_decimal(v)


# ---------------------------------------------------------------------------
# Admin write DTOs
# ---------------------------------------------------------------------------


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class ProducerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    story: str | None = None
    location: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)
    specialties: list[str] | None = None
    since: int | None = Field(default=None, ge=1900, le=2100)
    active: bool = True


class ProducerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    story: str | None = None
    location: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)
    specialties: list[str] | None = None
    since: int | None = Field(default=None, ge=1900, le=2100)
    active: bool | None = None


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    unit: str = Field(min_length=1, max_length=50)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int = Field(default=0, ge=0)
    product_type: ProductType = ProductType.FOOD
    organic: bool = False
    premium: bool = False
    available: bool = True
    seasonal: bool = False
    category_id: UUID
    producer_id: UUID


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int | None = Field(default=None, ge=0)
    product_type: ProductType | None = None
    organic: bool | None = None
    premium: bool | None = None
    available: bool | None = None
    seasonal: bool | None = None
    category_id: UUID | None = None
    producer_id: UUID | None = None
