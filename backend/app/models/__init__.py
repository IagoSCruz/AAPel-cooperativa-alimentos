"""SQLModel ORM models — mapped to Drizzle-managed tables.

Schema source of truth: /database/schema.ts (Drizzle).
These models must mirror that schema. Modifying a column requires updating
both the Drizzle schema (and migration) and the corresponding SQLModel.

Importing any model triggers SQLModel registration via metaclass.
"""

from app.models.basket import (
    BasketCuration,
    BasketCurationSlotOption,
    BasketSlot,
    BasketTemplate,
)
from app.models.catalog import Category, Producer, Product
from app.models.consent import ConsentHistory
from app.models.logistics import CollectionPoint, DeliveryZone, DeliveryZoneNeighborhood
from app.models.order import BasketFulfillment, Order, OrderItem
from app.models.user import User

__all__ = [
    "BasketCuration",
    "BasketCurationSlotOption",
    "BasketFulfillment",
    "BasketSlot",
    "BasketTemplate",
    "Category",
    "CollectionPoint",
    "ConsentHistory",
    "DeliveryZone",
    "DeliveryZoneNeighborhood",
    "Order",
    "OrderItem",
    "Producer",
    "Product",
    "User",
]
