"""Basket endpoints: list templates, detail with slots, current curation."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, status as http_status
from sqlalchemy.exc import IntegrityError
from sqlmodel import select, update as sql_update

from app.dependencies import CurrentUser, DbSession
from app.exceptions import BadRequest, NotFound
from app.models.basket import (
    BasketCuration,
    BasketCurationSlotOption,
    BasketSlot,
    BasketTemplate,
)
from app.models.catalog import Category, Producer, Product
from app.models.enums import ChosenBy, CurationStatus, DeliveryMethod, LineType, OrderStatus
from app.models.logistics import CollectionPoint, DeliveryZone
from app.models.order import BasketFulfillment, Order, OrderItem
from app.routers.pedidos import _generate_public_id, _next_delivery_date
from app.schemas.basket import (
    BasketCurationResponse,
    BasketFulfillmentResponse,
    BasketOrderRequest,
    BasketOrderResponse,
    BasketSlotOption,
    BasketSlotResponse,
    BasketTemplateResponse,
    CuratedSlot,
)
from app.schemas.catalog import CategoryResponse, ProducerSummary, ProductResponse

router = APIRouter()

_BASKET_PUBLIC_ID_RETRIES = 5


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

    now = datetime.now(timezone.utc).replace(tzinfo=None)

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


@router.post(
    "/{template_id}/personalizar",
    response_model=BasketOrderResponse,
    status_code=http_status.HTTP_201_CREATED,
    summary="Personaliza e ordena uma cesta (requer autenticação)",
)
async def personalizar_cesta(
    template_id: UUID,
    payload: BasketOrderRequest,
    db: DbSession,
    current_user: CurrentUser,
) -> BasketOrderResponse:
    from decimal import Decimal as D

    # 1. Find open curation
    now = datetime.now(timezone.utc).replace(tzinfo=None)
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

    tpl = await db.get(BasketTemplate, template_id)
    if tpl is None or not tpl.active or tpl.deleted_at is not None:
        raise NotFound("Cesta não encontrada")

    # 2. Load slots
    slots = await _slots_for_template(db, template_id)
    slot_by_id: dict[UUID, BasketSlot] = {s.id: s for s in slots}

    # 3. Validate slot choices — one per slot, no duplicates, no unknown slots
    choice_by_slot: dict[UUID, UUID] = {}
    for ch in payload.slot_choices:
        if ch.slot_id not in slot_by_id:
            raise BadRequest(f"Slot {ch.slot_id} não pertence a esta cesta")
        if ch.slot_id in choice_by_slot:
            raise BadRequest(
                f"Slot '{slot_by_id[ch.slot_id].slot_label}' escolhido mais de uma vez"
            )
        choice_by_slot[ch.slot_id] = ch.product_id

    missing = [s.slot_label for s in slots if s.id not in choice_by_slot]
    if missing:
        raise BadRequest("Selecione um produto para: " + ", ".join(missing))

    # 4. Load eligible options for this curation
    opts_q = select(BasketCurationSlotOption).where(
        BasketCurationSlotOption.basket_curation_id == curation.id
    )
    all_opts = list((await db.execute(opts_q)).scalars().all())
    # (slot_id, product_id) -> upgrade_fee
    opt_lookup: dict[tuple[UUID, UUID], D] = {
        (o.basket_slot_id, o.product_id): o.upgrade_fee for o in all_opts
    }

    # 5. Validate each choice is an eligible option + fetch products
    product_ids = list(choice_by_slot.values())
    prods_q = select(Product).where(
        Product.id.in_(product_ids), Product.deleted_at.is_(None)
    )
    products_by_id: dict[UUID, Product] = {
        p.id: p for p in (await db.execute(prods_q)).scalars().all()
    }

    upgrade_total = D("0")
    for slot_id, product_id in choice_by_slot.items():
        key = (slot_id, product_id)
        if key not in opt_lookup:
            raise BadRequest(
                f"Produto não é opção válida para '{slot_by_id[slot_id].slot_label}'"
            )
        prod = products_by_id.get(product_id)
        if prod is None or not prod.available:
            raise BadRequest("Produto não disponível")
        upgrade_total += opt_lookup[key]

    # 6. Resolve delivery logistics (mirrors regular order logic)
    delivery_fee = D("0")
    dm = payload.delivery_method  # DeliveryMethod enum (validated by Pydantic)
    if dm == DeliveryMethod.HOME_DELIVERY:
        if not payload.delivery_zone_id:
            raise BadRequest("delivery_zone_id é obrigatório para entrega em domicílio")
        # C3: address fields are required for home delivery
        if not payload.delivery_address or not payload.delivery_address.strip():
            raise BadRequest("delivery_address é obrigatório para entrega em domicílio")
        if not payload.delivery_neighborhood or not payload.delivery_neighborhood.strip():
            raise BadRequest("delivery_neighborhood é obrigatório para entrega em domicílio")
        zone = await db.get(DeliveryZone, payload.delivery_zone_id)
        if zone is None or not zone.active or zone.deleted_at is not None:
            raise NotFound("Zona de entrega não encontrada")
        basket_sub = tpl.base_price + upgrade_total
        if basket_sub < zone.minimum_order_value:
            raise BadRequest(
                f"Valor mínimo para entrega nessa zona é R${zone.minimum_order_value:.2f}"
            )
        delivery_fee = zone.delivery_fee
    elif dm == DeliveryMethod.PICKUP:
        if not payload.collection_point_id:
            raise BadRequest("collection_point_id é obrigatório para retirada em ponto")
        point = await db.get(CollectionPoint, payload.collection_point_id)
        if point is None or not point.active or point.deleted_at is not None:
            raise NotFound("Ponto de coleta não encontrado")
    # No else needed — Pydantic already rejects invalid delivery_method values

    # 7. Atomic stock decrement (1 unit per chosen product)
    for slot_id, product_id in choice_by_slot.items():
        result = await db.execute(
            sql_update(Product)
            .where(Product.id == product_id, Product.stock >= 1)
            .values(stock=Product.stock - 1)
        )
        if result.rowcount == 0:
            prod = products_by_id[product_id]
            await db.rollback()
            raise BadRequest(f'Estoque insuficiente para "{prod.name}"')

    # 8. Create Order (collision-safe public_id)
    subtotal = tpl.base_price + upgrade_total
    total = subtotal + delivery_fee

    order: Order | None = None
    for _ in range(_BASKET_PUBLIC_ID_RETRIES):
        candidate = _generate_public_id()
        try:
            order = Order(
                public_id=candidate,
                customer_id=current_user.id,
                status=OrderStatus.PENDING.value,
                delivery_method=dm.value,
                delivery_date=_next_delivery_date(),
                delivery_zone_id=payload.delivery_zone_id,
                delivery_address=payload.delivery_address,
                delivery_neighborhood=payload.delivery_neighborhood,
                collection_point_id=payload.collection_point_id,
                payment_method=payload.payment_method.value,
                payment_status="PENDING",
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total_amount=total,
                notes=payload.notes,
            )
            db.add(order)
            await db.flush()
            break
        except IntegrityError:
            await db.rollback()
            order = None
    if order is None:
        raise BadRequest("Não foi possível gerar identificador de pedido")

    # 9. OrderItem — BASKET line type
    order_item = OrderItem(
        order_id=order.id,
        line_type=LineType.BASKET.value,
        basket_curation_id=curation.id,
        basket_template_name_snapshot=tpl.name,
        quantity=1,
        unit_price_snapshot=subtotal,
        upgrade_total=upgrade_total,
        line_total=subtotal,
    )
    db.add(order_item)
    await db.flush()

    # 10. BasketFulfillment per slot
    fulfillments: list[BasketFulfillment] = []
    for slot_id, product_id in choice_by_slot.items():
        prod = products_by_id[product_id]
        ff = BasketFulfillment(
            order_item_id=order_item.id,
            basket_slot_id=slot_id,
            product_id=product_id,
            producer_id=prod.producer_id,
            upgrade_fee_paid=opt_lookup[(slot_id, product_id)],
            chosen_by=ChosenBy.CUSTOMER.value,
        )
        db.add(ff)
        fulfillments.append(ff)

    await db.commit()
    await db.refresh(order)

    return BasketOrderResponse(
        order_id=order.id,
        public_id=order.public_id,
        status=order.status,
        delivery_week=curation.delivery_week,
        base_price=tpl.base_price,
        upgrade_total=upgrade_total,
        delivery_fee=delivery_fee,
        total_amount=total,
        fulfillments=[
            BasketFulfillmentResponse(
                slot_id=ff.basket_slot_id,
                slot_label=slot_by_id[ff.basket_slot_id].slot_label,
                product_id=ff.product_id,
                product_name=products_by_id[ff.product_id].name,
                upgrade_fee_paid=ff.upgrade_fee_paid,
            )
            for ff in fulfillments
        ],
    )
