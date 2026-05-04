"""Admin: basket curations (weekly fulfillment windows).

A curation is the operational, week-specific instance of a basket template.
The admin opens one per template per week, defines the eligible products per
slot, sets a customization deadline, then transitions DRAFT -> OPEN -> CLOSED.

The list of options is mutated via PATCH /opcoes with full replacement
semantics (you POST the complete desired set; what's there is overwritten).

DB-level CHECK constraint on `basket_curation_slot_options` already enforces
`product_type = 'FOOD'`. We also validate at the app layer for nicer errors.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import select

from app.utils import utcnow_naive

from app.dependencies import DbSession
from app.exceptions import BadRequest, Conflict, NotFound
from app.models.basket import (
    BasketCuration,
    BasketCurationSlotOption,
    BasketSlot,
    BasketTemplate,
)
from app.models.catalog import Category, Producer, Product
from app.models.enums import CurationStatus, ProductType
from app.schemas.basket import (
    BasketCurationCreate,
    BasketCurationResponse,
    BasketCurationUpdate,
    BasketSlotOption,
    BasketSlotResponse,
    CuratedSlot,
    SetCurationOptionsRequest,
)
from app.schemas.catalog import CategoryResponse, ProducerSummary, ProductResponse
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()



# Allowed FSM transitions
_ALLOWED_TRANSITIONS: dict[CurationStatus, set[CurationStatus]] = {
    CurationStatus.DRAFT: {CurationStatus.OPEN, CurationStatus.CLOSED},
    CurationStatus.OPEN: {CurationStatus.CLOSED},
    CurationStatus.CLOSED: set(),
}


async def _build_response(db, curation: BasketCuration) -> BasketCurationResponse:
    tpl = await db.get(BasketTemplate, curation.basket_template_id)
    if tpl is None:
        raise NotFound("Template referenciado não encontrado")

    slots = list(
        (
            await db.execute(
                select(BasketSlot)
                .where(BasketSlot.basket_template_id == tpl.id)
                .order_by(BasketSlot.position)
            )
        ).scalars().all()
    )

    options_rows = (
        await db.execute(
            select(BasketCurationSlotOption, Product, Category, Producer)
            .join(Product, BasketCurationSlotOption.product_id == Product.id)
            .join(Category, Product.category_id == Category.id)
            .join(Producer, Product.producer_id == Producer.id)
            .where(BasketCurationSlotOption.basket_curation_id == curation.id)
        )
    ).all()

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


# ---------------------------------------------------------------------------
# Curations
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=Page[BasketCurationResponse],
    summary="Lista curadorias com filtros",
)
async def list_curations(
    db: DbSession,
    pagination: PageQuery = Depends(),
    template_id: UUID | None = Query(default=None),
    status_filter: CurationStatus | None = Query(default=None, alias="status"),
) -> Page[BasketCurationResponse]:
    base = select(BasketCuration)
    count_q = select(func.count(BasketCuration.id))
    if template_id is not None:
        base = base.where(BasketCuration.basket_template_id == template_id)
        count_q = count_q.where(BasketCuration.basket_template_id == template_id)
    if status_filter is not None:
        base = base.where(BasketCuration.status == status_filter.value)
        count_q = count_q.where(BasketCuration.status == status_filter.value)

    total = (await db.execute(count_q)).scalar_one()
    curations = (
        await db.execute(
            base.order_by(BasketCuration.delivery_week.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).scalars().all()

    data = [await _build_response(db, c) for c in curations]
    return Page[BasketCurationResponse](
        data=data,
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{curation_id}",
    response_model=BasketCurationResponse,
    summary="Detalha uma curadoria com seus slots e opções",
)
async def get_curation(curation_id: UUID, db: DbSession) -> BasketCurationResponse:
    curation = await db.get(BasketCuration, curation_id)
    if curation is None:
        raise NotFound("Curadoria não encontrada")
    return await _build_response(db, curation)


@router.post(
    "",
    response_model=BasketCurationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma curadoria semanal (DRAFT por padrão)",
)
async def create_curation(
    payload: BasketCurationCreate,
    db: DbSession,
) -> BasketCurationResponse:
    tpl = await db.get(BasketTemplate, payload.basket_template_id)
    if tpl is None or tpl.deleted_at is not None or not tpl.active:
        raise BadRequest("Template inválido ou inativo")

    if payload.customization_deadline.tzinfo is None:
        raise BadRequest("customization_deadline deve incluir timezone")

    # UNIQUE(template_id, delivery_week) at DB level — fail fast
    existing = (
        await db.execute(
            select(BasketCuration)
            .where(BasketCuration.basket_template_id == payload.basket_template_id)
            .where(BasketCuration.delivery_week == payload.delivery_week)
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise Conflict("Já existe curadoria para este template nessa semana")

    curation = BasketCuration(
        basket_template_id=payload.basket_template_id,
        delivery_week=payload.delivery_week,
        customization_deadline=payload.customization_deadline,
        status=payload.status.value,
    )
    db.add(curation)
    await db.commit()
    await db.refresh(curation)
    return await _build_response(db, curation)


@router.patch(
    "/{curation_id}",
    response_model=BasketCurationResponse,
    summary="Atualiza campos da curadoria (parcial). Status segue FSM.",
)
async def update_curation(
    curation_id: UUID,
    payload: BasketCurationUpdate,
    db: DbSession,
) -> BasketCurationResponse:
    curation = await db.get(BasketCuration, curation_id)
    if curation is None:
        raise NotFound("Curadoria não encontrada")

    updates = payload.model_dump(exclude_unset=True)

    if "status" in updates and updates["status"] is not None:
        new_status = CurationStatus(updates["status"])
        current = CurationStatus(curation.status)
        if new_status != current and new_status not in _ALLOWED_TRANSITIONS[current]:
            raise BadRequest(
                f"Transição de status inválida: {current.value} → {new_status.value}"
            )
        updates["status"] = new_status.value

    for field, value in updates.items():
        setattr(curation, field, value)
    curation.updated_at = utcnow_naive()

    await db.commit()
    await db.refresh(curation)
    return await _build_response(db, curation)


@router.delete(
    "/{curation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove uma curadoria. Permitido apenas para status DRAFT.",
)
async def delete_curation(curation_id: UUID, db: DbSession) -> None:
    curation = await db.get(BasketCuration, curation_id)
    if curation is None:
        raise NotFound("Curadoria não encontrada")

    if curation.status != CurationStatus.DRAFT.value:
        raise Conflict("Apenas curadorias DRAFT podem ser removidas")

    # Cascade-delete options first
    options = (
        await db.execute(
            select(BasketCurationSlotOption).where(
                BasketCurationSlotOption.basket_curation_id == curation_id
            )
        )
    ).scalars().all()
    for opt in options:
        await db.delete(opt)

    await db.delete(curation)
    await db.commit()
    return None


# ---------------------------------------------------------------------------
# Options (bulk replacement)
# ---------------------------------------------------------------------------


@router.patch(
    "/{curation_id}/opcoes",
    response_model=BasketCurationResponse,
    summary="Substitui completamente as opções da curadoria.",
)
async def set_options(
    curation_id: UUID,
    payload: SetCurationOptionsRequest,
    db: DbSession,
) -> BasketCurationResponse:
    curation = await db.get(BasketCuration, curation_id)
    if curation is None:
        raise NotFound("Curadoria não encontrada")

    if curation.status == CurationStatus.CLOSED.value:
        raise Conflict("Curadoria CLOSED não pode ser alterada")

    # Validate slots belong to the template
    template_slot_ids = {
        s_id
        for (s_id,) in (
            await db.execute(
                select(BasketSlot.id).where(
                    BasketSlot.basket_template_id == curation.basket_template_id
                )
            )
        ).all()
    }

    # Validate referenced products exist, are FOOD, and not deleted
    product_ids = {opt.product_id for opt in payload.options}
    if product_ids:
        products = (
            await db.execute(
                select(Product.id, Product.product_type, Product.deleted_at).where(
                    Product.id.in_(product_ids)
                )
            )
        ).all()
        product_map = {pid: (ptype, deleted) for (pid, ptype, deleted) in products}
        for pid in product_ids:
            if pid not in product_map:
                raise BadRequest(f"Produto {pid} não encontrado")
            ptype, deleted_at = product_map[pid]
            if deleted_at is not None:
                raise BadRequest(f"Produto {pid} foi removido")
            if ptype != ProductType.FOOD.value:
                raise BadRequest(
                    f"Produto {pid} é do tipo {ptype} — apenas FOOD pode entrar em cestas"
                )

    # Validate slot_id belongs to this template + dedupe (slot_id, product_id)
    seen: set[tuple[UUID, UUID]] = set()
    for opt in payload.options:
        if opt.basket_slot_id not in template_slot_ids:
            raise BadRequest(
                f"Slot {opt.basket_slot_id} não pertence ao template desta curadoria"
            )
        key = (opt.basket_slot_id, opt.product_id)
        if key in seen:
            raise BadRequest(
                f"Opção duplicada: slot={opt.basket_slot_id} produto={opt.product_id}"
            )
        seen.add(key)

    # Wipe existing options
    existing = (
        await db.execute(
            select(BasketCurationSlotOption).where(
                BasketCurationSlotOption.basket_curation_id == curation_id
            )
        )
    ).scalars().all()
    for row in existing:
        await db.delete(row)
    await db.flush()

    # Insert new
    for opt in payload.options:
        db.add(
            BasketCurationSlotOption(
                basket_curation_id=curation_id,
                basket_slot_id=opt.basket_slot_id,
                product_id=opt.product_id,
                upgrade_fee=opt.upgrade_fee,
            )
        )

    curation.updated_at = utcnow_naive()
    await db.commit()
    await db.refresh(curation)
    return await _build_response(db, curation)


class StatusChangeRequest(BaseModel):
    status: CurationStatus


@router.patch(
    "/{curation_id}/status",
    response_model=BasketCurationResponse,
    summary="Transição explícita de status (atalho conveniente para o admin)",
)
async def change_status(
    curation_id: UUID,
    payload: StatusChangeRequest,
    db: DbSession,
) -> BasketCurationResponse:
    curation = await db.get(BasketCuration, curation_id)
    if curation is None:
        raise NotFound("Curadoria não encontrada")

    current = CurationStatus(curation.status)
    new_status = payload.status
    if new_status != current and new_status not in _ALLOWED_TRANSITIONS[current]:
        raise BadRequest(
            f"Transição de status inválida: {current.value} → {new_status.value}"
        )

    # Extra guard: opening a curation requires at least one option per slot
    if new_status == CurationStatus.OPEN and current == CurationStatus.DRAFT:
        slot_ids = list(
            (
                await db.execute(
                    select(BasketSlot.id).where(
                        BasketSlot.basket_template_id == curation.basket_template_id
                    )
                )
            ).scalars().all()
        )
        for slot_id in slot_ids:
            count = (
                await db.execute(
                    select(func.count(BasketCurationSlotOption.id))
                    .where(BasketCurationSlotOption.basket_curation_id == curation_id)
                    .where(BasketCurationSlotOption.basket_slot_id == slot_id)
                )
            ).scalar_one()
            if count == 0:
                raise BadRequest(
                    f"Slot {slot_id} sem opções — abra a curadoria apenas após "
                    "definir produtos elegíveis para todos os slots"
                )

    curation.status = new_status.value
    curation.updated_at = utcnow_naive()
    await db.commit()
    await db.refresh(curation)
    return await _build_response(db, curation)
