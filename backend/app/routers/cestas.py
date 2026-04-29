"""Basket endpoints: list templates, detail with slots, current curation."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import NotFound
from app.models.basket import (
    BasketCuration,
    BasketCurationSlotOption,
    BasketSlot,
    BasketTemplate,
)
from app.models.catalog import Category, Producer, Product
from app.models.enums import CurationStatus
from app.schemas.basket import (
    BasketCurationResponse,
    BasketSlotOption,
    BasketSlotResponse,
    BasketTemplateResponse,
    CuratedSlot,
)
from app.schemas.catalog import CategoryResponse, ProducerSummary, ProductResponse

router = APIRouter()


async def _slots_for_template(db, template_id: UUID) -> list[BasketSlot]:
    result = await db.execute(
        select(BasketSlot)
        .where(BasketSlot.basket_template_id == template_id)
        .order_by(BasketSlot.position)
    )
    return list(result.scalars().all())


def _template_response(tpl: BasketTemplate, slots: list[BasketSlot]) -> BasketTemplateResponse:
    return BasketTemplateResponse(
        id=tpl.id,
        name=tpl.name,
        description=tpl.description,
        base_price=tpl.base_price,
        image_url=tpl.image_url,
        serves=tpl.serves,
        customization_window_hours=tpl.customization_window_hours,
        active=tpl.active,
        slots=[
            BasketSlotResponse(
                id=s.id,
                slot_label=s.slot_label,
                position=s.position,
                item_count=s.item_count,
            )
            for s in slots
        ],
    )


@router.get(
    "",
    response_model=list[BasketTemplateResponse],
    summary="Lista templates de cesta ativos",
)
async def list_baskets(db: DbSession) -> list[BasketTemplateResponse]:
    result = await db.execute(
        select(BasketTemplate)
        .where(BasketTemplate.active.is_(True))
        .where(BasketTemplate.deleted_at.is_(None))
        .order_by(BasketTemplate.base_price)
    )
    templates = list(result.scalars().all())
    return [_template_response(t, await _slots_for_template(db, t.id)) for t in templates]


@router.get(
    "/{template_id}",
    response_model=BasketTemplateResponse,
    summary="Detalha um template de cesta com seus slots",
)
async def get_basket(template_id: UUID, db: DbSession) -> BasketTemplateResponse:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or tpl.deleted_at is not None or not tpl.active:
        raise NotFound("Cesta não encontrada")
    return _template_response(tpl, await _slots_for_template(db, tpl.id))


@router.get(
    "/{template_id}/curadoria-atual",
    response_model=BasketCurationResponse,
    summary="Curadoria semanal aberta para um template (com produtos elegíveis por slot)",
)
async def current_curation(template_id: UUID, db: DbSession) -> BasketCurationResponse:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or tpl.deleted_at is not None or not tpl.active:
        raise NotFound("Cesta não encontrada")

    now = datetime.now(timezone.utc)

    curation_q = (
        select(BasketCuration)
        .where(BasketCuration.basket_template_id == template_id)
        .where(BasketCuration.status == CurationStatus.OPEN.value)
        .where(BasketCuration.customization_deadline > now)
        .order_by(BasketCuration.delivery_week.desc())
        .limit(1)
    )
    curation = (await db.execute(curation_q)).scalar_one_or_none()
    if curation is None:
        raise NotFound("Nenhuma curadoria aberta para esta cesta")

    slots = await _slots_for_template(db, template_id)

    options_q = (
        select(BasketCurationSlotOption, Product, Category, Producer)
        .join(Product, BasketCurationSlotOption.product_id == Product.id)
        .join(Category, Product.category_id == Category.id)
        .join(Producer, Product.producer_id == Producer.id)
        .where(BasketCurationSlotOption.basket_curation_id == curation.id)
        .where(Product.deleted_at.is_(None))
    )
    options_rows = (await db.execute(options_q)).all()

    by_slot: dict[UUID, list[BasketSlotOption]] = {s.id: [] for s in slots}
    for opt, product, category, producer in options_rows:
        product_resp = ProductResponse(
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
        by_slot.setdefault(opt.basket_slot_id, []).append(
            BasketSlotOption(product=product_resp, upgrade_fee=opt.upgrade_fee)
        )

    return BasketCurationResponse(
        id=curation.id,
        template_id=tpl.id,
        template_name=tpl.name,
        base_price=tpl.base_price,
        delivery_week=curation.delivery_week,
        customization_deadline=curation.customization_deadline,
        status=CurationStatus(curation.status),
        slots=[
            CuratedSlot(
                slot=BasketSlotResponse(
                    id=s.id,
                    slot_label=s.slot_label,
                    position=s.position,
                    item_count=s.item_count,
                ),
                options=by_slot.get(s.id, []),
            )
            for s in slots
        ],
    )
