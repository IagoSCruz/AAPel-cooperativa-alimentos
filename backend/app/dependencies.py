"""FastAPI dependencies — DB session, current user, role guards."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.exceptions import Forbidden, Unauthorized
from app.models.enums import UserRole
from app.models.user import User
from app.security import TokenType, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    db: DbSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    if not token:
        raise Unauthorized()

    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise Unauthorized(str(exc)) from exc

    if payload.type != TokenType.ACCESS:
        raise Unauthorized("Wrong token type")

    user = await db.get(User, UUID(payload.sub))
    if user is None or not user.is_active:
        raise Unauthorized("User not found or deactivated")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN.value:
        raise Forbidden("Admin role required")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def get_optional_user(
    db: DbSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User | None:
    """Returns user if a valid Bearer is present, else None. Never raises."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.type != TokenType.ACCESS:
            return None
        user = await db.get(User, UUID(payload.sub))
        if user is None or not user.is_active:
            return None
        return user
    except (ValueError, Exception):
        return None


OptionalUser = Annotated[User | None, Depends(get_optional_user)]
