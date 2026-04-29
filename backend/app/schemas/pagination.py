"""Pagination envelopes."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PageMeta(BaseModel):
    page: int
    limit: int
    total: int
    has_next: bool


class Page(BaseModel, Generic[T]):
    data: list[T]
    pagination: PageMeta


class PageQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit
