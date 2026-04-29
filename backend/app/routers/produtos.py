"""GET /produtos — list with filters; GET /produtos/{id} — detail."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlmodel import and_, select

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.catalog import Category, Producer, Product
from app.models.enums import ProductType
from app.schemas.catalog import ProductFilters, ProductResponse
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()


def _row_to_response(product: Product, category: Category, producer: Producer) -> ProductResponse:
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
        category={
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "image_url": category.image_url,
        },
        producer={
            "id": producer.id,
            "name": producer.name,
            "location": producer.location,
        },
        created_at=product.created_at,
    )


@router.get(
    "",
    response_model=Page[ProductResponse],
    summary="Lista produtos com filtros e paginação",
)
async def list_products(
    db: DbSession,
    pagination: PageQuery = Depends(),
    filters: ProductFilters = Depends(),
    categoria: str | None = Query(default=None, description="Nome ou UUID da categoria"),
    busca: str | None = Query(default=None, description="Busca por nome (ILIKE)"),
    organico: bool | None = Query(default=None),
    tipo: ProductType | None = Query(default=None),
    produtor_id: UUID | None = Query(default=None),
    disponiveis: bool | None = Query(default=None),
) -> Page[ProductResponse]:
    # Reconstruct filters from query params (FastAPI Depends() with BaseModel
    # doesn't pull individual query params on its own, so we accept both).
    f = filters.model_copy(
        update={
            "categoria": categoria or filters.categoria,
            "busca": busca or filters.busca,
            "organico": organico if organico is not None else filters.organico,
            "tipo": tipo or filters.tipo,
            "produtor_id": produtor_id or filters.produtor_id,
            "disponiveis": disponiveis if disponiveis is not None else filters.disponiveis,
        }
    )

    base_filters = [Product.deleted_at.is_(None)]

    if f.disponiveis:
        base_filters.append(Product.available.is_(True))
        base_filters.append(Product.stock > 0)

    if f.organico is not None:
        base_filters.append(Product.organic.is_(f.organico))

    if f.tipo is not None:
        base_filters.append(Product.product_type == f.tipo.value)

    if f.produtor_id is not None:
        base_filters.append(Product.producer_id == f.produtor_id)

    if f.busca:
        base_filters.append(Product.name.ilike(f"%{f.busca}%"))

    if f.categoria:
        # Try as UUID, fall back to name lookup
        try:
            cat_id = UUID(f.categoria)
            base_filters.append(Product.category_id == cat_id)
        except ValueError:
            base_filters.append(Category.name == f.categoria)

    where_clause = and_(*base_filters)

    # Total count
    count_q = (
        select(func.count(Product.id))
        .select_from(Product)
        .join(Category, Product.category_id == Category.id)
        .where(where_clause)
    )
    total = (await db.execute(count_q)).scalar_one()

    # Page
    page_q = (
        select(Product, Category, Producer)
        .join(Category, Product.category_id == Category.id)
        .join(Producer, Product.producer_id == Producer.id)
        .where(where_clause)
        .order_by(Product.name)
        .limit(pagination.limit)
        .offset(pagination.offset)
    )
    rows = (await db.execute(page_q)).all()

    return Page[ProductResponse](
        data=[_row_to_response(p, c, pr) for p, c, pr in rows],
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
    result = await db.execute(
        select(Product, Category, Producer)
        .join(Category, Product.category_id == Category.id)
        .join(Producer, Product.producer_id == Producer.id)
        .where(Product.id == product_id)
        .where(Product.deleted_at.is_(None))
    )
    row = result.one_or_none()
    if row is None:
        raise NotFound("Produto não encontrado")
    return _row_to_response(*row)
