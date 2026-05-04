"""Catalog models: Producer, Category, Product."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive
from app.models._enums_sql import PRODUCT_TYPE



class Producer(SQLModel, table=True):
    __tablename__ = "producers"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    description: str | None = None
    story: str | None = None
    location: str | None = Field(default=None, max_length=255)
    image_url: str | None = Field(default=None, max_length=500)
    cover_image_url: str | None = Field(default=None, max_length=500)
    specialties: list[str] | None = Field(default=None, sa_column=Column(JSONB))
    since: int | None = None
    active: bool = Field(default=True)
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)


class Category(SQLModel, table=True):
    __tablename__ = "categories"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=100, unique=True)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    description: str | None = None
    price: Decimal = Field(max_digits=10, decimal_places=2)
    unit: str = Field(max_length=50)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int = Field(default=0)

    product_type: str = Field(default="FOOD", sa_type=PRODUCT_TYPE)
    premium: bool = Field(default=False)
    organic: bool = Field(default=False)
    available: bool = Field(default=True)
    seasonal: bool = Field(default=False)

    category_id: UUID = Field(foreign_key="categories.id")
    producer_id: UUID = Field(foreign_key="producers.id")

    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)
