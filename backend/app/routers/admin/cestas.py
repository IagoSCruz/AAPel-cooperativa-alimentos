"""Admin CRUD: basket templates + slots.

Templates change rarely. Slots define the structural rules (e.g. "3 frutas") —
they are referenced by curation options, so deleting a slot is only allowed
when no curation option references it.

Curation operations are in `routers/admin/curadorias.py`.
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlmodel import select

from app.dependencies import DbSession
from app.exceptions import BadRequest, Conflict, NotFound
from app.models.basket import (
    BasketCurationSlotOption,
    BasketSlot,
    BasketTemplate,
)
from app.schemas.basket import (
    BasketSlotInput,
    BasketSlotResponse,
    BasketSlotUpdate,
    BasketTemplateCreate,
    BasketTemplateResponse,
    BasketTemplateUpdate,
)
from app.schemas.pagination import Page, PageMeta, PageQuery

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _slots_for(db, template_id: UUID) -> list[BasketSlot]:
    return list(
        (
            await db.execute(
                select(BasketSlot)
                .where(BasketSlot.basket_template_id == template_id)
                .order_by(BasketSlot.position)
            )
        ).scalars().all()
    )


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


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=Page[BasketTemplateResponse],
    summary="Lista templates de cesta",
)
async def list_templates(
    db: DbSession,
    pagination: PageQuery = Depends(),
    incluir_inativos: bool = Query(default=False),
    incluir_deletados: bool = Query(default=False),
) -> Page[BasketTemplateResponse]:
    base = select(BasketTemplate)
    count_q = select(func.count(BasketTemplate.id))
    if not incluir_deletados:
        base = base.where(BasketTemplate.deleted_at.is_(None))
        count_q = count_q.where(BasketTemplate.deleted_at.is_(None))
    if not incluir_inativos:
        base = base.where(BasketTemplate.active.is_(True))
        count_q = count_q.where(BasketTemplate.active.is_(True))

    total = (await db.execute(count_q)).scalar_one()
    templates = (
        await db.execute(
            base.order_by(BasketTemplate.base_price)
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).scalars().all()

    data: list[BasketTemplateResponse] = []
    for tpl in templates:
        data.append(_template_response(tpl, await _slots_for(db, tpl.id)))

    return Page[BasketTemplateResponse](
        data=data,
        pagination=PageMeta(
            page=pagination.page,
            limit=pagination.limit,
            total=total,
            has_next=(pagination.offset + pagination.limit) < total,
        ),
    )


@router.get(
    "/{template_id}",
    response_model=BasketTemplateResponse,
    summary="Detalha um template",
)
async def get_template(template_id: UUID, db: DbSession) -> BasketTemplateResponse:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None:
        raise NotFound("Template não encontrado")
    slots = await _slots_for(db, template_id)
    return _template_response(tpl, slots)


@router.post(
    "",
    response_model=BasketTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um template de cesta com seus slots",
)
async def create_template(
    payload: BasketTemplateCreate,
    db: DbSession,
) -> BasketTemplateResponse:
    # Validate unique slot positions
    positions = [s.position for s in payload.slots]
    if len(positions) != len(set(positions)):
        raise BadRequest("Posições de slots duplicadas")

    tpl = BasketTemplate(
        name=payload.name,
        description=payload.description,
        base_price=payload.base_price,
        image_url=payload.image_url,
        serves=payload.serves,
        customization_window_hours=payload.customization_window_hours,
        active=payload.active,
    )
    db.add(tpl)
    await db.flush()

    for s in payload.slots:
        db.add(
            BasketSlot(
                basket_template_id=tpl.id,
                slot_label=s.slot_label,
                position=s.position,
                item_count=s.item_count,
            )
        )

    await db.commit()
    await db.refresh(tpl)
    return _template_response(tpl, await _slots_for(db, tpl.id))


@router.patch(
    "/{template_id}",
    response_model=BasketTemplateResponse,
    summary="Atualiza campos do template (não inclui slots)",
)
async def update_template(
    template_id: UUID,
    payload: BasketTemplateUpdate,
    db: DbSession,
) -> BasketTemplateResponse:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or tpl.deleted_at is not None:
        raise NotFound("Template não encontrado")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(tpl, field, value)
    tpl.updated_at = _utcnow()

    await db.commit()
    await db.refresh(tpl)
    return _template_response(tpl, await _slots_for(db, template_id))


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete de um template",
)
async def delete_template(template_id: UUID, db: DbSession) -> None:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or tpl.deleted_at is not None:
        raise NotFound("Template não encontrado")

    tpl.deleted_at = _utcnow()
    tpl.active = False
    tpl.updated_at = _utcnow()
    await db.commit()
    return None


# ---------------------------------------------------------------------------
# Slots
# ---------------------------------------------------------------------------


@router.post(
    "/{template_id}/slots",
    response_model=BasketSlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adiciona um slot a um template existente",
)
async def add_slot(
    template_id: UUID,
    payload: BasketSlotInput,
    db: DbSession,
) -> BasketSlot:
    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or tpl.deleted_at is not None:
        raise NotFound("Template não encontrado")

    # Position must be unique within the template
    existing_pos = (
        await db.execute(
            select(BasketSlot)
            .where(BasketSlot.basket_template_id == template_id)
            .where(BasketSlot.position == payload.position)
        )
    ).scalar_one_or_none()
    if existing_pos is not None:
        raise Conflict("Já existe slot com essa position no template")

    slot = BasketSlot(
        basket_template_id=template_id,
        slot_label=payload.slot_label,
        position=payload.position,
        item_count=payload.item_count,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return slot


@router.patch(
    "/{template_id}/slots/{slot_id}",
    response_model=BasketSlotResponse,
    summary="Atualiza um slot (parcial)",
)
async def update_slot(
    template_id: UUID,
    slot_id: UUID,
    payload: BasketSlotUpdate,
    db: DbSession,
) -> BasketSlot:
    slot = await db.get(BasketSlot, slot_id)
    if slot is None or slot.basket_template_id != template_id:
        raise NotFound("Slot não encontrado neste template")

    updates = payload.model_dump(exclude_unset=True)

    if "position" in updates:
        clash = (
            await db.execute(
                select(BasketSlot)
                .where(BasketSlot.basket_template_id == template_id)
                .where(BasketSlot.position == updates["position"])
                .where(BasketSlot.id != slot_id)
            )
        ).scalar_one_or_none()
        if clash is not None:
            raise Conflict("Já existe slot com essa position no template")

    for field, value in updates.items():
        setattr(slot, field, value)

    await db.commit()
    await db.refresh(slot)
    return slot


@router.delete(
    "/{template_id}/slots/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove um slot. Bloqueia se houver curadoria com opções referenciando o slot.",
)
async def delete_slot(template_id: UUID, slot_id: UUID, db: DbSession) -> None:
    slot = await db.get(BasketSlot, slot_id)
    if slot is None or slot.basket_template_id != template_id:
        raise NotFound("Slot não encontrado neste template")

    refs = (
        await db.execute(
            select(func.count(BasketCurationSlotOption.id)).where(
                BasketCurationSlotOption.basket_slot_id == slot_id
            )
        )
    ).scalar_one()
    if refs > 0:
        raise Conflict(
            "Slot referenciado por opções de curadoria. "
            "Feche/exclua as curadorias relacionadas antes de remover o slot."
        )

    await db.delete(slot)
    await db.commit()
    return None
