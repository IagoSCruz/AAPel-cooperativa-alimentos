"""Admin CRUD: categories.

Categories rarely change and are referenced by products via FK. We expose
list/get/create/update only — there's no delete endpoint to avoid breaking
referential integrity. Renaming a category is allowed.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import Conflict, NotFound
from app.models.catalog import Category
from app.schemas.catalog import CategoryCreate, CategoryResponse, CategoryUpdate
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()


@router.get(
    "",
    response_model=Page[CategoryResponse],
    summary="Lista categorias",
)
async def list_categories(
    db: DbSession,
    pagination: PageQuery = Depends(),
) -> Page[CategoryResponse]:
    total = (await db.execute(select(func.count(Category.id)))).scalar_one()
    rows = (
        await db.execute(
            select(Category)
            .order_by(Category.name)
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).scalars().all()
    return Page[CategoryResponse](
        data=[CategoryResponse.model_validate(c) for c in rows],
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Detalha uma categoria",
)
async def get_category(category_id: UUID, db: DbSession) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise NotFound("Categoria não encontrada")
    return category


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma categoria",
)
async def create_category(payload: CategoryCreate, db: DbSession) -> Category:
    existing = (
        await db.execute(select(Category).where(Category.name == payload.name))
    ).scalar_one_or_none()
    if existing is not None:
        raise Conflict("Já existe uma categoria com esse nome")

    category = Category(**payload.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
    summary="Atualiza uma categoria (parcial)",
)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    db: DbSession,
) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise NotFound("Categoria não encontrada")

    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and updates["name"] != category.name:
        clash = (
            await db.execute(
                select(Category)
                .where(Category.name == updates["name"])
                .where(Category.id != category_id)
            )
        ).scalar_one_or_none()
        if clash is not None:
            raise Conflict("Já existe uma categoria com esse nome")

    for field, value in updates.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)
    return category
