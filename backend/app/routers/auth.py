"""Auth endpoints: register, login, refresh, logout, /me."""

from uuid import UUID

from fastapi import APIRouter, Request, status
from sqlmodel import select

from app.config import get_settings
from app.rate_limit import limiter
from app.dependencies import CurrentUser, DbSession
from app.exceptions import Conflict, Unauthorized
from app.models.consent import ConsentHistory
from app.models.enums import ConsentSource, ConsentType, UserRole
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserResponse,
)
from app.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter()
_settings = get_settings()


def _record_consents(user_id: UUID, payload: RegisterRequest, request: Request) -> list[ConsentHistory]:
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    rows: list[ConsentHistory] = []
    consents = [
        (ConsentType.TERMS, payload.consent_terms),
        (ConsentType.PRIVACY, payload.consent_privacy),
        (ConsentType.MARKETING, payload.consent_marketing),
        (ConsentType.ANALYTICS, payload.consent_analytics),
    ]
    for ctype, granted in consents:
        rows.append(
            ConsentHistory(
                user_id=user_id,
                consent_type=ctype.value,
                granted=granted,
                source=ConsentSource.REGISTRATION.value,
                ip=ip,
                user_agent=user_agent,
            )
        )
    return rows


def _token_pair(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user.id, user.role),
        refresh_token=create_refresh_token(user.id, user.role),
        expires_in=_settings.jwt_access_expire_minutes * 60,
    )


@router.post(
    "/register",
    response_model=TokenPair,
    status_code=status.HTTP_201_CREATED,
    summary="Cria uma nova conta CUSTOMER e retorna tokens",
)
@limiter.limit("5/minute;20/hour")  # H1: blocks account flooding
async def register(
    request: Request,
    payload: RegisterRequest,
    db: DbSession,
) -> TokenPair:
    if not (payload.consent_terms and payload.consent_privacy):
        raise Conflict("Aceite dos termos e da política de privacidade é obrigatório")

    existing = await db.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none() is not None:
        raise Conflict("Email já cadastrado")

    user = User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER.value,
        consent_marketing=payload.consent_marketing,
        consent_analytics=payload.consent_analytics,
    )
    db.add(user)
    await db.flush()  # populate user.id

    for entry in _record_consents(user.id, payload, request):
        db.add(entry)

    await db.commit()
    await db.refresh(user)
    return _token_pair(user)


@router.post(
    "/login",
    response_model=TokenPair,
    summary="Autentica e retorna access + refresh tokens",
)
@limiter.limit("10/minute;100/hour")  # H1: blocks credential brute-force
async def login(request: Request, payload: LoginRequest, db: DbSession) -> TokenPair:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise Unauthorized("Credenciais inválidas")

    if not verify_password(payload.password, user.password_hash):
        raise Unauthorized("Credenciais inválidas")

    return _token_pair(user)


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Rotaciona o access token usando refresh token",
)
@limiter.limit("20/minute")  # H1: limits refresh-token grinding
async def refresh(request: Request, payload: RefreshRequest, db: DbSession) -> TokenPair:
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise Unauthorized(str(exc)) from exc

    if token_payload.type != TokenType.REFRESH:
        raise Unauthorized("Wrong token type")

    user = await db.get(User, UUID(token_payload.sub))
    if user is None or not user.is_active:
        raise Unauthorized("User not found or deactivated")

    return _token_pair(user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout (stateless — cliente descarta o cookie/token)",
)
async def logout() -> None:
    # Stateless logout: client discards the tokens.
    # Future: add a denylist (Redis) for forced revocation.
    return None


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retorna o usuário autenticado",
)
async def me(user: CurrentUser) -> User:
    return user
