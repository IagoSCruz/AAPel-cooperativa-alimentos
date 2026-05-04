"""Shared rate limiter (slowapi) used by sensitive endpoints.

Single instance keyed by client IP (X-Forwarded-For-aware via get_remote_address).
In production behind a reverse proxy, ensure the proxy sets X-Forwarded-For
correctly so legitimate users are not collapsed onto a single bucket.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Default in-memory storage. For multi-instance deployments swap to Redis:
#   Limiter(key_func=get_remote_address, storage_uri='redis://...')
limiter = Limiter(key_func=get_remote_address, default_limits=[])
