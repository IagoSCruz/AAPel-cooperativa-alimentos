"""Admin CRUD: products.

Soft delete preserves products that already participated in orders. Validates
that referenced category and producer exist (and are not soft-deleted) before
creating or updating.

The `product_type = FOOD` constraint relevant to baskets is enforced at DB
level via CHECK on `basket_curation_slot_options`.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlmodel import select

from app.utils import utcnow_naive

from app.dependencies import DbSession
from app.exceptions import BadRequest, NotFound
from app.models.catalog import Category, Producer, Product
from app.schemas.catalog import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ProducerSummary,
    CategoryResponse,
)
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()



def _to_response(product: Product, category: Category, producer: Producer) -> ProductResponse:
    return ProductResponse(
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
        category=CategoryResponse.model_validate(category),
        producer=ProducerSummary.model_validate(producer),
        created_at=product.created_at,
    )


async def _ensure_category(db, category_id: UUID) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise BadRequest(f"Categoria {category_id} não encontrada")
    return category


async def _ensure_producer(db, producer_id: UUID) -> Producer:
    producer = await db.get(Producer, producer_id)
    if producer is None or producer.deleted_at is not None:
        raise BadRequest(f"Produtor {producer_id} não encontrado ou removido")
    return producer


@router.get(
    "",
    response_model=Page[ProductResponse],
    summary="Lista produtos (admin vê inclusive indisponíveis e soft-deleted)",
)
async def list_products(
    db: DbSession,
    pagination: PageQuery = Depends(),
    incluir_indisponiveis: bool = Query(default=True),
    incluir_deletados: bool = Query(default=False),
) -> Page[ProductResponse]:
    where = []
    if not incluir_deletados:
        where.append(Product.deleted_at.is_(None))
    if not incluir_indisponiveis:
        where.append(Product.available.is_(True))

    count_q = select(func.count(Product.id))
    page_q = (
        select(Product, Category, Producer)
        .join(Category, Product.category_id == Category.id)
        .join(Producer, Product.producer_id == Producer.id)
    )
    for w in where:
        count_q = count_q.where(w)
        page_q = page_q.where(w)

    total = (await db.execute(count_q)).scalar_one()
    rows = (
        await db.execute(
            page_q.order_by(Product.name).limit(pagination.limit).offset(pagination.offset)
        )
    ).all()

    return Page[ProductResponse](
        data=[_to_response(p, c, pr) for p, c, pr in rows],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Detalha um produto",
)
async def get_product(product_id: UUID, db: DbSession) -> ProductResponse:
    row = (
        await db.execute(
            select(Product, Category, Producer)
            .join(Category, Product.category_id == Category.id)
            .join(Producer, Product.producer_id == Producer.id)
            .where(Product.id == product_id)
        )
    ).one_or_none()
    if row is None:
        raise NotFound("Produto não encontrado")
    return _to_response(*row)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um produto",
)
async def create_product(payload: ProductCreate, db: DbSession) -> ProductResponse:
    category = await _ensure_category(db, payload.category_id)
    producer = await _ensure_producer(db, payload.producer_id)

    data = payload.model_dump()
    # Pydantic enum -> str for the DB column (which stores str)
    data["product_type"] = data["product_type"].value

    product = Product(**data)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return _to_response(product, category, producer)


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Atualiza um produto (parcial)",
)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    db: DbSession,
) -> ProductResponse:
    product = await db.get(Product, product_id)
    if product is None or product.deleted_at is not None:
        raise NotFound("Produto não encontrado")

    updates = payload.model_dump(exclude_unset=True)

    if "category_id" in updates:
        await _ensure_category(db, updates["category_id"])
    if "producer_id" in updates:
        await _ensure_producer(db, updates["producer_id"])
    if "product_type" in updates and updates["product_type"] is not None:
        updates["product_type"] = updates["product_type"].value

    for field, value in updates.items():
        setattr(product, field, value)
    product.updated_at = utcnow_naive()

    await db.commit()
    await db.refresh(product)

    category = await db.get(Category, product.category_id)
    producer = await db.get(Producer, product.producer_id)
    return _to_response(product, category, producer)  # type: ignore[arg-type]


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete de um produto (preserva histórico de pedidos)",
)
async def delete_product(product_id: UUID, db: DbSession) -> None:
    product = await db.get(Product, product_id)
    if product is None or product.deleted_at is not None:
        raise NotFound("Produto não encontrado")

    product.deleted_at = utcnow_naive()
    product.available = False
    product.updated_at = utcnow_naive()

    await db.commit()
    return None
