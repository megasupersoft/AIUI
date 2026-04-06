from typing import Optional, Dict
import httpx

WORKERS_URL  = "http://skeletor/workers.json"
COMFYUI_BASE = "http://comfyui.skeletor"

# name → proxy path, e.g. "work0020" → "/worker/work0020"
_worker_cache: Dict[str, str] = {}

async def refresh_workers():
    """Fetch workers.json and cache proxy endpoint paths."""
    global _worker_cache
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(WORKERS_URL)
            if res.status_code == 200:
                data = res.json()
                _worker_cache = {}
                for w in data.get("workers", []):
                    if w.get("status") == "online" and w.get("endpoint"):
                        _worker_cache[w["name"]] = w["endpoint"]
    except Exception:
        pass

def get_worker_urls(device_id: Optional[str] = None) -> Dict[str, str]:
    """
    Return HTTP and WS URLs routed through comfyui.skeletor.
    If device_id is given, uses the specific worker's proxy path.
    Otherwise falls back to the load-balanced base URL.
    """
    if device_id and device_id in _worker_cache:
        path = _worker_cache[device_id]          # e.g. "/worker/work0020"
        http = f"{COMFYUI_BASE}{path}/"
        ws   = f"ws://comfyui.skeletor{path}/"
        return {"http": http, "ws": ws}

    # Auto: let comfyui.skeletor load-balance
    if _worker_cache:
        # Pick first online worker for a stable default (avoids mid-run switches)
        path = next(iter(_worker_cache.values()))
        http = f"{COMFYUI_BASE}{path}/"
        ws   = f"ws://comfyui.skeletor{path}/"
        return {"http": http, "ws": ws}

    return {
        "http": COMFYUI_BASE + "/",
        "ws":   "ws://comfyui.skeletor/",
    }

def get_cached_workers() -> Dict[str, str]:
    """Return name → proxy URL map (for display/testing)."""
    return {name: f"{COMFYUI_BASE}{path}" for name, path in _worker_cache.items()}
