"""User + Consent History models."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive
from app.models._enums_sql import USER_ROLE



class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    name: str = Field(max_length=255)
    password_hash: str
    # pgEnum: see _enums_sql.py — without sa_type, asyncpg sends $N::VARCHAR
    # which Postgres can't compare/insert into a `user_role` column.
    role: str = Field(default="CUSTOMER", sa_type=USER_ROLE)
    phone: str | None = Field(default=None, max_length=20)

    # LGPD
    consent_marketing: bool = Field(default=False)
    consent_analytics: bool = Field(default=True)
    data_retention_until: datetime | None = Field(default=None)
    deleted_at: datetime | None = Field(default=None)
    anonymized_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=utcnow_naive)
    updated_at: datetime = Field(default_factory=utcnow_naive)

    @property
    def is_active(self) -> bool:
        return self.deleted_at is None and self.anonymized_at is None
