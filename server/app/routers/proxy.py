from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, RedirectResponse, HTMLResponse, JSONResponse
from urllib.parse import quote
import json
import httpx
from .._device_registry import get_worker_urls
from ..executors.comfyui_workflows import WORKFLOW_BUILDERS

router = APIRouter()

@router.get("/comfyui/ui")
async def open_comfyui_ui(instance: str = "", workflow: str = ""):
    """Open ComfyUI web UI on the selected worker.

    If `workflow` is given, serves a small HTML page that navigates
    to ComfyUI with a hash fragment. This avoids the redirect-hash
    browser inconsistency.
    """
    urls = get_worker_urls(instance if instance else None)
    target = urls["http"].rstrip("/") + "/"
    if workflow:
        target += f"#{quote(workflow)}"
        # Return an HTML page that navigates to the target with hash intact
        return HTMLResponse(
            f'<!DOCTYPE html><html><head><meta charset="utf-8">'
            f'<script>window.location.replace("{target}");</script>'
            f'</head><body></body></html>'
        )
    return RedirectResponse(url=target)


@router.post("/comfyui/graph")
async def preview_comfyui_graph(request: Request):
    """Compile a node's params into a ComfyUI prompt graph and return it as JSON."""
    body = await request.json()
    node_type = body.get("node_type", "")
    params = body.get("params", {})
    inputs = body.get("inputs", {})

    builder = WORKFLOW_BUILDERS.get(node_type)
    if builder is None:
        return JSONResponse({"error": f"No ComfyUI workflow for: {node_type}"}, status_code=404)

    try:
        prompt = builder({**params, "_node_type": node_type}, inputs)
        return JSONResponse({"prompt": prompt, "node_type": node_type})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


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
