import os
import fal_client
from typing import Any
from .base import BaseExecutor, ProgressCallback

FAL_MODELS = {
    "txt2img": None,
    "img2img": "fal-ai/flux/dev/image-to-image",
    "inpaint": "fal-ai/flux/dev/image-to-image",
    "upscale": "fal-ai/esrgan",
    "remove-bg": "fal-ai/birefnet",
}

class FalExecutor(BaseExecutor):
    async def execute(self, node_type: str, params: dict[str, Any], inputs: dict[str, Any], on_progress: ProgressCallback = None) -> dict[str, Any]:
        merged = {**params, **inputs}

        if node_type == "txt2img":
            model_id = merged.get("model", "fal-ai/flux/schnell")
            seed = merged.get("seed", -1)
            fal_params = {
                "prompt": merged.get("prompt", ""),
                "image_size": {"width": merged.get("width", 1024), "height": merged.get("height", 1024)},
                "num_inference_steps": merged.get("steps", 4),
                "guidance_scale": merged.get("guidance", 3.5),
            }
            if seed != -1:
                fal_params["seed"] = seed
            result = await fal_client.run_async(model_id, arguments=fal_params)
            return {"image": result["images"][0]["url"]}

        elif node_type == "upscale":
            result = await fal_client.run_async("fal-ai/esrgan", arguments={"image_url": inputs.get("image"), "scale": int(params.get("scale", 4))})
            return {"image": result["image"]["url"]}

        elif node_type == "remove-bg":
            result = await fal_client.run_async("fal-ai/birefnet", arguments={"image_url": inputs.get("image")})
            return {"image": result["image"]["url"]}

        else:
            raise ValueError(f"Unknown node type for fal executor: {node_type}")
