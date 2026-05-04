"""Consent history — LGPD audit of user consent changes."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.utils import utcnow_naive
from app.models._enums_sql import CONSENT_SOURCE, CONSENT_TYPE



class ConsentHistory(SQLModel, table=True):
    __tablename__ = "consent_history"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    consent_type: str = Field(sa_type=CONSENT_TYPE)
    granted: bool
    source: str = Field(sa_type=CONSENT_SOURCE)
    ip: str | None = Field(default=None, max_length=45)
    user_agent: str | None = Field(default=None)
    timestamp: datetime = Field(default_factory=utcnow_naive)
