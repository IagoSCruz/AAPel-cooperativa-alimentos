"""Custom exceptions + RFC 7807 (Problem Details) error responses.

Every error returned to the client follows the shape:
    {
        "type": "https://aapel.local/errors/<slug>",
        "title": "Human-readable title",
        "status": 4xx | 5xx,
        "detail": "Specific message",
        "instance": "<request path>"
    }
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class APIError(HTTPException):
    """Base for application errors that map to RFC 7807."""

    slug: str = "internal-error"
    title: str = "Internal Server Error"

    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str | None = None,
        slug: str | None = None,
        title: str | None = None,
        headers: dict[str, str] | None = None,
    ):
        super().__init__(status_code=status_code, detail=detail or self.title, headers=headers)
        if slug:
            self.slug = slug
        if title:
            self.title = title


class NotFound(APIError):
    slug = "not-found"
    title = "Resource Not Found"

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail=detail)


class Unauthorized(APIError):
    slug = "unauthorized"
    title = "Unauthorized"

    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class Forbidden(APIError):
    slug = "forbidden"
    title = "Forbidden"

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail=detail)


class Conflict(APIError):
    slug = "conflict"
    title = "Conflict"

    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status.HTTP_409_CONFLICT, detail=detail)


class BadRequest(APIError):
    slug = "bad-request"
    title = "Bad Request"

    def __init__(self, detail: str = "Invalid request"):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail=detail)


def _problem_response(
    request: Request,
    status_code: int,
    title: str,
    detail: str,
    slug: str,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "type": f"https://aapel.local/errors/{slug}",
            "title": title,
            "status": status_code,
            "detail": detail,
            "instance": str(request.url.path),
        },
        media_type="application/problem+json",
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError):
        return _problem_response(
            request,
            status_code=exc.status_code,
            title=exc.title,
            detail=str(exc.detail),
            slug=exc.slug,
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return _problem_response(
            request,
            status_code=exc.status_code,
            title="HTTP Error",
            detail=str(exc.detail),
            slug="http-error",
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "type": "https://aapel.local/errors/validation",
                "title": "Validation Error",
                "status": 422,
                "detail": "Request payload did not pass validation",
                "instance": str(request.url.path),
                "errors": exc.errors(),
            },
            media_type="application/problem+json",
        )
