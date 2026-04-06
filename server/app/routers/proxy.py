from fastapi import APIRouter
from fastapi.responses import StreamingResponse, RedirectResponse
from urllib.parse import quote
import httpx
from .._device_registry import get_worker_urls

router = APIRouter()

@router.get("/comfyui/ui")
async def open_comfyui_ui(instance: str = "", workflow: str = ""):
    """Redirect to the ComfyUI web UI on the selected (or auto) worker.

    If `workflow` is given, appends ?open_workflow=<name> so the AIUI
    frontend extension auto-loads that workflow in the ComfyUI editor.
    """
    urls = get_worker_urls(instance if instance else None)
    target = urls["http"]
    if workflow:
        target += f"#{quote(workflow)}"
    return RedirectResponse(url=target)


@router.get("/comfyui/view")
async def proxy_comfyui_image(filename: str, subfolder: str = "", type: str = "output", instance: str = ""):
    """Proxy ComfyUI image requests using direct worker IPs."""
    urls = get_worker_urls(instance if instance else None)
    url = f"{urls['http'].rstrip('/')}/view?filename={filename}&subfolder={subfolder}&type={type}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(url)
        res.raise_for_status()
        return StreamingResponse(
            iter([res.content]),
            media_type=res.headers.get("content-type", "image/png"),
        )
