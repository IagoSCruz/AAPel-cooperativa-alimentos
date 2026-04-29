"""User + Consent History models."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=255)
    password_hash: str
    role: str = Field(default="CUSTOMER", max_length=20)
    phone: str | None = Field(default=None, max_length=20)

    # LGPD
    consent_marketing: bool = Field(default=False)
    consent_analytics: bool = Field(default=True)
    data_retention_until: datetime | None = Field(default=None)
    deleted_at: datetime | None = Field(default=None)
    anonymized_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    @property
    def is_active(self) -> bool:
        return self.deleted_at is None and self.anonymized_at is None
