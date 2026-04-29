"""Consent history — LGPD audit of user consent changes."""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ConsentHistory(SQLModel, table=True):
    __tablename__ = "consent_history"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    consent_type: str = Field(max_length=20)
    granted: bool
    source: str = Field(max_length=20)
    ip: str | None = Field(default=None, max_length=45)
    user_agent: str | None = Field(default=None)
    timestamp: datetime = Field(default_factory=_utcnow)
