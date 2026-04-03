from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import httpx
from .._device_registry import get_worker_urls

router = APIRouter()

@router.get("/comfyui/view")
async def proxy_comfyui_image(filename: str, subfolder: str = "", type: str = "output", instance: str = ""):
    """Proxy ComfyUI image requests using direct worker IPs."""
    urls = get_worker_urls(instance if instance else None)
    url = f"{urls['http']}/view?filename={filename}&subfolder={subfolder}&type={type}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(url)
        res.raise_for_status()
        return StreamingResponse(
            iter([res.content]),
            media_type=res.headers.get("content-type", "image/png"),
        )
