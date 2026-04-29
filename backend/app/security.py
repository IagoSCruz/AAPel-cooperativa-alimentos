"""Password hashing + JWT issuance/verification."""

from datetime import datetime, timedelta, timezone
from enum import Enum
from uuid import UUID

import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import get_settings

_settings = get_settings()


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenPayload(BaseModel):
    sub: str  # user id
    role: str
    type: TokenType
    iat: int
    exp: int


# ---------------------------------------------------------------------------
# Password hashing (bcrypt)
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=_settings.bcrypt_rounds)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def _encode(user_id: UUID, role: str, token_type: TokenType, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": token_type.value,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    return jwt.encode(payload, _settings.jwt_secret, algorithm=_settings.jwt_algorithm)


def create_access_token(user_id: UUID, role: str) -> str:
    return _encode(
        user_id,
        role,
        TokenType.ACCESS,
        timedelta(minutes=_settings.jwt_access_expire_minutes),
    )


def create_refresh_token(user_id: UUID, role: str) -> str:
    return _encode(
        user_id,
        role,
        TokenType.REFRESH,
        timedelta(days=_settings.jwt_refresh_expire_days),
    )


def decode_token(token: str) -> TokenPayload:
    try:
        raw = jwt.decode(token, _settings.jwt_secret, algorithms=[_settings.jwt_algorithm])
        return TokenPayload(**raw)
    except JWTError as exc:
        raise ValueError(f"Invalid token: {exc}") from exc
