from typing import Any
from .base import BaseExecutor, ProgressCallback

class LocalExecutor(BaseExecutor):
    async def execute(self, node_type: str, params: dict[str, Any], inputs: dict[str, Any], on_progress: ProgressCallback = None) -> dict[str, Any]:
        if node_type == "text-input":
            return {"text": params.get("value", "")}
        elif node_type == "number-input":
            return {"number": params.get("value", 0)}
        elif node_type == "image-input":
            return {"image": params.get("image")}
        elif node_type == "video-input":
            return {"video": params.get("video")}
        elif node_type == "audio-input":
            return {"audio": params.get("audio")}
        elif node_type == "image-output":
            return {"image": inputs.get("image")}
        elif node_type == "video-output":
            return {"video": inputs.get("video")}
        elif node_type == "audio-output":
            return {"audio": inputs.get("audio")}
        elif node_type == "prompt-builder":
            # Parse the selections JSON and build a prompt string
            import json
            try:
                selections = json.loads(params.get("selections", "{}"))
            except (json.JSONDecodeError, TypeError):
                selections = {}
            parts = []
            for category, groups in selections.items():
                if isinstance(groups, dict):
                    for group, items in groups.items():
                        if isinstance(items, list):
                            parts.extend(items)
            return {"text": ", ".join(parts)}
        elif node_type == "blur":
            # TODO: implement with Pillow
            return {"image": inputs.get("image")}
        else:
            raise ValueError(f"Unknown node type for local executor: {node_type}")
