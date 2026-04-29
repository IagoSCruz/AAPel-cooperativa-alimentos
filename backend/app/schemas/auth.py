"""Auth contract schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt 72-byte limit
    name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    consent_marketing: bool = False
    consent_analytics: bool = True
    consent_terms: bool = Field(..., description="Must accept terms")
    consent_privacy: bool = Field(..., description="Must accept privacy policy")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    role: UserRole
    phone: str | None
    consent_marketing: bool
    consent_analytics: bool
    created_at: datetime

    model_config = {"from_attributes": True}
