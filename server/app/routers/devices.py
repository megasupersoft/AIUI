import httpx
from fastapi import APIRouter
from .._device_registry import refresh_workers, get_cached_workers

router = APIRouter()

WORKERS_URL = "http://skeletor/workers.json"

@router.get("/devices")
async def list_devices():
    """Fetch available GPU workers and return them."""
    await refresh_workers()

    devices = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(WORKERS_URL)
            if res.status_code == 200:
                data = res.json()
                for w in data.get("workers", []):
                    if w.get("status") != "online":
                        continue
                    gpu = w.get("gpu", "unknown")
                    label = gpu
                    if "NVIDIA" in label:
                        label = label.split("NVIDIA")[-1].strip()
                        label = label.replace("GeForce ", "")
                        if ":" in label:
                            label = label.split(":")[0].strip()
                    vram_free = w.get("vram_free_gb", 0)

                    devices.append({
                        "id": w["name"],
                        "name": w["name"],
                        "gpu": label,
                        "vramTotal": w.get("vram_total_gb", 0),
                        "vramFree": vram_free,
                        "label": f"{label} @ {w['name']} ({vram_free:.0f}GB free)",
                        "direct": w.get("direct", ""),
                    })
    except Exception:
        pass

    return {"devices": devices}
