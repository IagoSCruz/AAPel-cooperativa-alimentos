"""GET /categorias — list product categories."""

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DbSession
from app.models.catalog import Category
from app.schemas.catalog import CategoryResponse

router = APIRouter()


@router.get("", response_model=list[CategoryResponse], summary="Lista categorias")
async def list_categories(db: DbSession) -> list[Category]:
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())
