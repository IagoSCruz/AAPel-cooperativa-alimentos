"""Cross-cutting utilities."""

from datetime import datetime, timezone


def utcnow_naive() -> datetime:
    """Current UTC time as a *naive* datetime.

    Drizzle's migrations declare timestamp columns as `TIMESTAMP WITHOUT TIME
    ZONE`, so any tz-aware value passed via asyncpg raises:

        invalid input ... can't subtract offset-naive and offset-aware datetimes

    All write paths in the API should call this helper instead of
    `datetime.now(timezone.utc)` directly.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
