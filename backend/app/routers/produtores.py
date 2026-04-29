"""GET /produtores — list & detail. /produtores/{id}/produtos — products by producer."""

from uuid import UUID

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.catalog import Category, Producer, Product
from app.schemas.catalog import ProducerResponse, ProductResponse

router = APIRouter()


@router.get("", response_model=list[ProducerResponse], summary="Lista produtores ativos")
async def list_producers(db: DbSession) -> list[Producer]:
    result = await db.execute(
        select(Producer)
        .where(Producer.active.is_(True))
        .where(Producer.deleted_at.is_(None))
        .order_by(Producer.name)
    )
    return list(result.scalars().all())


@router.get(
    "/{producer_id}",
    response_model=ProducerResponse,
    summary="Detalha um produtor",
)
async def get_producer(producer_id: UUID, db: DbSession) -> Producer:
    producer = await db.get(Producer, producer_id)
    if producer is None or producer.deleted_at is not None:
        raise NotFound("Produtor não encontrado")
    return producer


@router.get(
    "/{producer_id}/produtos",
    response_model=list[ProductResponse],
    summary="Lista produtos de um produtor",
)
async def list_producer_products(producer_id: UUID, db: DbSession):
    producer = await db.get(Producer, producer_id)
    if producer is None or producer.deleted_at is not None:
        raise NotFound("Produtor não encontrado")

    result = await db.execute(
        select(Product, Category, Producer)
        .join(Category, Product.category_id == Category.id)
        .join(Producer, Product.producer_id == Producer.id)
        .where(Product.producer_id == producer_id)
        .where(Product.deleted_at.is_(None))
        .where(Product.available.is_(True))
        .order_by(Product.name)
    )

    rows = []
    for product, category, prod in result.all():
        rows.append(
            ProductResponse(
                id=product.id,
                name=product.name,
                description=product.description,
                price=product.price,
                unit=product.unit,
                image_url=product.image_url,
                stock=product.stock,
                product_type=product.product_type,  # type: ignore[arg-type]
                organic=product.organic,
                premium=product.premium,
                available=product.available,
                seasonal=product.seasonal,
                category={
                    "id": category.id,
                    "name": category.name,
                    "description": category.description,
                    "image_url": category.image_url,
                },
                producer={
                    "id": prod.id,
                    "name": prod.name,
                    "location": prod.location,
                },
                created_at=product.created_at,
            )
        )
    return rows
