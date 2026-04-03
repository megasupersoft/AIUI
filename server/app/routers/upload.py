import os
import uuid
import httpx
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from .._device_registry import get_worker_urls

router = APIRouter()

# Local upload dir for files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image to ComfyUI's input folder and return the filename."""
    urls = get_worker_urls(None)
    content = await file.read()

    # Upload to ComfyUI
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"image": (file.filename, content, file.content_type or "image/png")}
            res = await client.post(f"{urls['http']}/upload/image", files=files)
            if res.status_code == 200:
                data = res.json()
                return {"filename": data.get("name", file.filename), "subfolder": data.get("subfolder", "")}
    except Exception:
        pass

    # Fallback: save locally
    ext = os.path.splitext(file.filename or "image.png")[1]
    local_name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, local_name)
    with open(path, "wb") as f:
        f.write(content)
    return {"filename": local_name, "local": True}


@router.post("/upload/file")
async def upload_file(file: UploadFile = File(...)):
    """Upload any file and return its text content (for text/markdown files)."""
    content = await file.read()
    filename = file.filename or "file"

    # For text files, return the content directly
    ext = os.path.splitext(filename)[1].lower()
    if ext in [".txt", ".md", ".markdown", ".text", ".csv", ".json", ".yaml", ".yml", ".toml"]:
        try:
            text = content.decode("utf-8")
            return {"type": "text", "content": text, "filename": filename}
        except UnicodeDecodeError:
            return {"type": "binary", "filename": filename, "error": "Cannot decode as text"}

    # For images
    if ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"]:
        # Upload to ComfyUI
        urls = get_worker_urls(None)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {"image": (filename, content, file.content_type or "image/png")}
                res = await client.post(f"{urls['http']}/upload/image", files=files)
                if res.status_code == 200:
                    data = res.json()
                    return {"type": "image", "filename": data.get("name", filename)}
        except Exception:
            pass
        return {"type": "image", "filename": filename, "error": "Failed to upload to ComfyUI"}

    # For video
    if ext in [".mp4", ".webm", ".mov", ".avi", ".mkv"]:
        local_name = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, local_name)
        with open(path, "wb") as f:
            f.write(content)
        return {"type": "video", "filename": local_name, "local": True}

    return {"type": "unknown", "filename": filename}
