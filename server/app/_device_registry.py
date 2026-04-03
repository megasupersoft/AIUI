from typing import Optional, Dict
import httpx

WORKERS_URL = "http://skeletor/workers.json"

# Cache of worker direct URLs
_worker_cache: Dict[str, str] = {}

async def refresh_workers():
    """Fetch workers.json and cache direct URLs."""
    global _worker_cache
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(WORKERS_URL)
            if res.status_code == 200:
                data = res.json()
                _worker_cache = {}
                for w in data.get("workers", []):
                    if w.get("status") == "online" and w.get("direct"):
                        _worker_cache[w["name"]] = w["direct"]
    except Exception:
        pass

def get_worker_urls(device_id: Optional[str] = None) -> Dict[str, str]:
    """Return HTTP and WS URLs for a specific worker using direct IPs."""
    if device_id and device_id in _worker_cache:
        direct = _worker_cache[device_id]
        ws = direct.replace("http://", "ws://").replace("https://", "wss://")
        return {"http": direct, "ws": ws}
    # Fallback: use first available worker, or skeletor
    if _worker_cache:
        first = list(_worker_cache.values())[0]
        ws = first.replace("http://", "ws://").replace("https://", "wss://")
        return {"http": first, "ws": ws}
    # Last resort
    return {
        "http": "http://skeletor:8188",
        "ws": "ws://skeletor:8188",
    }

def get_cached_workers() -> Dict[str, str]:
    return dict(_worker_cache)
