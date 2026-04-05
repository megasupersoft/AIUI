from fastapi import APIRouter
import os, httpx
from .._device_registry import get_worker_urls, get_cached_workers

router = APIRouter()

@router.get("/models")
async def get_models():
    urls = get_worker_urls(None)
    comfyui_available = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{urls['http']}/system_stats")
            comfyui_available = res.status_code == 200
    except Exception:
        pass
    return {
        "comfyui": {"available": comfyui_available, "workers": len(get_cached_workers())},
        "fal": {"available": bool(os.getenv("FAL_KEY"))},
        "openai": {"available": bool(os.getenv("OPENAI_API_KEY"))},
        "replicate": {"available": bool(os.getenv("REPLICATE_API_TOKEN"))},
    }


FRIENDLY_NAMES = {
    "v1-5-pruned-emaonly.safetensors": "[SD] Stable Diffusion 1.5",
    "flux1-dev-fp8.safetensors": "[Flux] Flux Dev (fp8)",
    "cyberrealistic_v90.safetensors": "[SD] CyberRealistic v9",
    "analogMadness_v70.safetensors": "[SD] Analog Madness v7",
    "epicphotogasm_ultimateFidelity.safetensors": "[SD] Epic Photogasm",
    "realisticVisionV60B1_v51HyperVAE.safetensors": "[SD] Realistic Vision v6",
    "photon_v1.safetensors": "[SD] Photon v1",
    "lazymixRealAmateur_v40.ckpt": "[SD] Lazy Mix v4",
    "model.fp16.safetensors": "[SD] SD 1.5 (fp16)",
    "ltx-2.3-22b-distilled_fp8_v2.safetensors": "[LTX] LTX Video 2.3",
    "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors": "[Wan] T2V (high noise)",
    "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors": "[Wan] T2V (low noise)",
    "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors": "[Wan] I2V (high noise, fp8)",
    "wan2.2_i2v_high_noise_14B_fp16.safetensors": "[Wan] I2V (high noise, fp16)",
    "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors": "[Wan] I2V (low noise, fp8)",
    "wan2.2_i2v_low_noise_14B_fp16.safetensors": "[Wan] I2V (low noise, fp16)",
    "wan2.2_ti2v_5B_fp16.safetensors": "[Wan] First/Last Frame 5B",
    "Wan2.1/wan2.1_i2v_720p_14B_fp16.safetensors": "[Wan] 2.1 I2V 720p",
}

BROKEN_MODELS = {
    "flux2_dev_fp8mixed.safetensors",
    "hidream_i1_fast_fp8.safetensors",
    # Wan 2.2 I2V — incompatible channels with current WanVideoWrapper
    "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
    "wan2.2_i2v_high_noise_14B_fp16.safetensors",
    "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors",
    "wan2.2_i2v_low_noise_14B_fp16.safetensors",
}

# Which node types each model is compatible with
# "image" = txt2img, img2img, inpaint
# "t2v" = txt2vid
# "i2v" = img2vid, vid2vid
# "ltx" = vid-audio (video+audio)
MODEL_CATEGORIES = {
    # SD 1.5 checkpoints — image gen only
    "v1-5-pruned-emaonly.safetensors": ["image"],
    "flux1-dev-fp8.safetensors": ["image"],
    "cyberrealistic_v90.safetensors": ["image"],
    "analogMadness_v70.safetensors": ["image"],
    "epicphotogasm_ultimateFidelity.safetensors": ["image"],
    "realisticVisionV60B1_v51HyperVAE.safetensors": ["image"],
    "photon_v1.safetensors": ["image"],
    "lazymixRealAmateur_v40.ckpt": ["image"],
    "model.fp16.safetensors": ["image"],
    # Wan T2V
    "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors": ["t2v"],
    "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors": ["t2v"],
    # I2V uses LTX
    "ltx-2.3-22b-distilled_fp8_v2.safetensors": ["t2v", "ltx", "i2v"],
    # Wan TI2V (first/last frame)
    "wan2.2_ti2v_5B_fp16.safetensors": ["ti2v"],
    # LTX (video + audio + i2v)
    # Already defined above with i2v category
}

# Node type → model category mapping
NODE_MODEL_FILTER = {
    "txt2img": "image",
    "img2img": "image",
    "inpaint": "image",
    "txt2vid": "t2v",
    "img2vid": "i2v",
    "vid2vid": "ti2v",
    "vid-audio": "ltx",
}


def _clean_model_label(filename):
    if filename in FRIENDLY_NAMES:
        return FRIENDLY_NAMES[filename]
    label = filename
    for ext in [".safetensors", ".ckpt", ".bin", ".pt"]:
        label = label.replace(ext, "")
    label = label.replace("_", " ").replace("-", " ")
    return label


def _get_categories(filename):
    return MODEL_CATEGORIES.get(filename, ["image"])


@router.get("/models/checkpoints")
async def get_checkpoints(node_type: str = ""):
    """Fetch available models, optionally filtered by node type."""
    urls = get_worker_urls(None)
    models = []
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{urls['http']}/object_info/CheckpointLoaderSimple")
            if res.status_code == 200:
                info = res.json()
                ckpts = info.get("CheckpointLoaderSimple", {}).get("input", {}).get("required", {}).get("ckpt_name", [])
                if ckpts and isinstance(ckpts[0], list):
                    for m in sorted(ckpts[0]):
                        models.append({"value": m, "label": _clean_model_label(m), "categories": _get_categories(m)})

            res2 = await client.get(f"{urls['http']}/object_info/DiffusionModelLoaderKJ")
            if res2.status_code == 200:
                info2 = res2.json()
                diffusion = info2.get("DiffusionModelLoaderKJ", {}).get("input", {}).get("required", {}).get("model_name", [])
                if diffusion and isinstance(diffusion[0], list):
                    existing_values = {m["value"] for m in models}
                    for m in sorted(diffusion[0]):
                        if m not in existing_values:
                            models.append({"value": m, "label": _clean_model_label(m), "categories": _get_categories(m)})
    except Exception:
        pass

    # Remove broken models
    models = [m for m in models if m["value"] not in BROKEN_MODELS]

    # Filter by node type if specified
    if node_type and node_type in NODE_MODEL_FILTER:
        category = NODE_MODEL_FILTER[node_type]
        models = [m for m in models if category in m["categories"]]

    return {"checkpoints": models}
