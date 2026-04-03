"""Quick smoke tests for each workflow."""
import json
import time
import asyncio
from fastapi import APIRouter
from ..executors.comfyui_workflows import WORKFLOW_BUILDERS, build_txt2img, detect_arch
from .._device_registry import get_worker_urls, get_cached_workers, refresh_workers

router = APIRouter()

@router.get("/test/workflows")
async def test_workflows():
    """Test that each workflow builder produces valid ComfyUI prompts."""
    results = []

    # Test txt2img with different models
    test_models = [
        ("SD 1.5", {"model": "v1-5-pruned-emaonly.safetensors", "width": 512, "height": 512, "steps": 1, "guidance": 7.0, "seed": 42}),
        ("Flux 1", {"model": "flux1-dev-fp8.safetensors", "width": 512, "height": 512, "steps": 1, "guidance": 1.0, "seed": 42}),
        ("CyberRealistic", {"model": "cyberrealistic_v90.safetensors", "width": 512, "height": 512, "steps": 1, "guidance": 7.0, "seed": 42}),
    ]

    for name, params in test_models:
        try:
            prompt = build_txt2img(params, {"prompt": "test cat"})
            arch = detect_arch(params["model"])
            # Verify prompt has key nodes
            has_text = any(
                n.get("class_type") == "CLIPTextEncode" and n.get("inputs", {}).get("text") == "test cat"
                for n in prompt.values() if isinstance(n, dict)
            )
            has_model = any(
                n.get("class_type") in ("CheckpointLoaderSimple", "DiffusionModelLoaderKJ")
                for n in prompt.values() if isinstance(n, dict)
            )
            results.append({
                "name": name,
                "arch": arch,
                "model": params["model"],
                "status": "ok" if has_text and has_model else "MISSING_NODES",
                "has_prompt_text": has_text,
                "has_model_loader": has_model,
                "node_count": len(prompt),
            })
        except Exception as e:
            results.append({"name": name, "status": "error", "error": str(e)})

    # Test other workflow builders
    for node_type, builder in WORKFLOW_BUILDERS.items():
        if node_type == "txt2img":
            continue
        try:
            if node_type in ("img2img", "inpaint"):
                prompt = builder({"model": "v1-5-pruned-emaonly.safetensors", "steps": 1, "seed": 42}, {"prompt": "test", "image": "test.png"})
            elif node_type in ("txt2vid", "vid-audio"):
                prompt = builder({"model": "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors", "steps": 1, "seed": 42}, {"prompt": "test"})
            elif node_type == "img2vid":
                prompt = builder({"model": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "steps": 1, "seed": 42}, {"prompt": "test", "image": "test.png"})
            elif node_type == "music":
                prompt = builder({"steps": 1, "seed": 42, "duration": 5}, {"prompt": "test"})
            else:
                prompt = builder({"steps": 1, "seed": 42}, {"prompt": "test"})
            results.append({"name": node_type, "status": "ok", "node_count": len(prompt)})
        except Exception as e:
            results.append({"name": node_type, "status": "error", "error": str(e)})

    return {"tests": results}


@router.get("/test/workers")
async def test_workers():
    """Check which workers are available and responsive."""
    await refresh_workers()
    workers = get_cached_workers()
    results = []
    for name, url in workers.items():
        import httpx
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{url}/system_stats")
                if res.status_code == 200:
                    data = res.json()
                    dev = data["devices"][0] if data.get("devices") else {}
                    results.append({
                        "name": name,
                        "url": url,
                        "status": "online",
                        "device": dev.get("name", "?"),
                        "vram_free_gb": round(dev.get("vram_free", 0) / (1024**3), 1),
                    })
                else:
                    results.append({"name": name, "url": url, "status": f"http_{res.status_code}"})
        except Exception as e:
            results.append({"name": name, "url": url, "status": "error", "error": str(e)})
    return {"workers": results}
