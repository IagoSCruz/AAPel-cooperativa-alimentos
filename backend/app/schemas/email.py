"""Pragmatic email validation for auth endpoints.

Pydantic's EmailStr (via email-validator) rejects special-use TLDs such as
`.local`, which breaks the default dev seed admin. We accept any reasonable
`local@domain.tld` shape instead.
"""

from typing import Annotated

from pydantic import BeforeValidator


def normalize_auth_email(value: object) -> str:
    if not isinstance(value, str):
        raise TypeError("email must be a string")
    email = value.strip().lower()
    if "@" not in email or len(email) < 5:
        raise ValueError("E-mail inválido")
    local, _, domain = email.partition("@")
    if not local or not domain or "." not in domain:
        raise ValueError("E-mail inválido")
    return email


AuthEmail = Annotated[str, BeforeValidator(normalize_auth_email)]
