"""String enums mirroring Postgres pgEnum types.

Models store these as plain strings (max_length-bounded) — Postgres pgEnum
constrains the actual values at the DB level. API schemas (Pydantic) use these
Python enums for validation.
"""

from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"


class OrderStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COLLECTED = "COLLECTED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class DeliveryMethod(str, Enum):
    PICKUP = "PICKUP"
    HOME_DELIVERY = "HOME_DELIVERY"


class PaymentMethod(str, Enum):
    PIX = "PIX"
    CASH = "CASH"
    CARD = "CARD"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"


class ProductType(str, Enum):
    FOOD = "FOOD"
    CRAFT = "CRAFT"


class LineType(str, Enum):
    PRODUCT = "PRODUCT"
    BASKET = "BASKET"


class CurationStatus(str, Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class ConsentType(str, Enum):
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    TERMS = "terms"
    PRIVACY = "privacy"


class ConsentSource(str, Enum):
    REGISTRATION = "registration"
    ACCOUNT_SETTINGS = "account_settings"
    API = "api"


class ChosenBy(str, Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"
