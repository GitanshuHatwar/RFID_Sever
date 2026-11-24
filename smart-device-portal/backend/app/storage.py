import uuid
from fastapi import HTTPException, UploadFile
from supabase import create_client

from .core.config import settings


def signed_or_public_url(path: str) -> str | None:
    if not path:
        return None
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        try:
            return supabase.storage.from_(settings.supabase_bucket).create_signed_url(path, 3600)["signedURL"]
        except Exception:
            return f"{settings.supabase_url}/storage/v1/object/public/{settings.supabase_bucket}/{path}"
    except Exception:
        return None


async def upload_device_photo(device_id: str, file: UploadFile) -> str:
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Photo must be jpeg, png, or webp")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Photo must be 5MB or less")
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Supabase Storage is not configured")
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    path = f"{device_id}/{uuid.uuid4().hex}.{allowed[file.content_type]}"
    result = supabase.storage.from_(settings.supabase_bucket).upload(
        path, content, file_options={"content-type": file.content_type, "upsert": "true"}
    )
    if getattr(result, "error", None):
        raise HTTPException(status_code=502, detail="Photo upload failed")
    return path
