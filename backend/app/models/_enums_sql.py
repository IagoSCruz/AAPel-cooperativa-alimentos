"""Postgres pgEnum descriptors for SQLAlchemy column declarations.

The Drizzle migrations already create these enum types in the database, so
each `PgEnum(..., create_type=False)` here is *only* the SQLAlchemy-side
descriptor that tells the dialect to bind values as `$N::<enum_name>` instead
of `$N::VARCHAR`. Without this, asyncpg raises:

    column "role" is of type user_role but expression is of type character varying

Models import these and pass them via `Field(sa_type=...)`.
"""

from sqlalchemy.dialects.postgresql import ENUM as PgEnum

from app.models.enums import (
    ChosenBy,
    ConsentSource,
    ConsentType,
    CurationStatus,
    DeliveryMethod,
    LineType,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    ProductType,
    UserRole,
)


def _pg(enum_cls, name: str) -> PgEnum:
    return PgEnum(*(e.value for e in enum_cls), name=name, create_type=False)


USER_ROLE = _pg(UserRole, "user_role")
ORDER_STATUS = _pg(OrderStatus, "order_status")
DELIVERY_METHOD = _pg(DeliveryMethod, "delivery_method")
PAYMENT_METHOD = _pg(PaymentMethod, "payment_method")
PAYMENT_STATUS = _pg(PaymentStatus, "payment_status")
PRODUCT_TYPE = _pg(ProductType, "product_type")
LINE_TYPE = _pg(LineType, "line_type")
CURATION_STATUS = _pg(CurationStatus, "curation_status")
CONSENT_TYPE = _pg(ConsentType, "consent_type")
CONSENT_SOURCE = _pg(ConsentSource, "consent_source")
CHOSEN_BY = _pg(ChosenBy, "chosen_by")
