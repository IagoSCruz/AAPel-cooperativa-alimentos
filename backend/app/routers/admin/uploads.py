"""Admin image upload — stores files on disk, returns a public /uploads/* URL."""

import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import get_settings

router = APIRouter()

_ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Upload de imagem (admin)",
)
async def upload_image(file: UploadFile = File(...)) -> dict[str, str]:
    settings = get_settings()
    content_type = (file.content_type or "").lower()
    ext = _ALLOWED_CONTENT_TYPES.get(content_type)
    if not ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.",
        )

    data = await file.read()
    if len(data) > settings.upload_max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande (máx. {settings.upload_max_bytes // (1024 * 1024)} MB).",
        )
    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio.",
        )

    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    dest = upload_root / filename
    dest.write_bytes(data)

    return {"url": f"/uploads/{filename}"}
