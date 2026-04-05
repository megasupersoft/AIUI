import json
import uuid
import asyncio
import httpx
import websockets
from typing import Any
from .base import BaseExecutor, ProgressCallback
from .._device_registry import get_worker_urls
from .comfyui_workflows import WORKFLOW_BUILDERS


class ComfyUIExecutor(BaseExecutor):
    def __init__(self):
        self.client_id = str(uuid.uuid4())

    async def execute(
        self,
        node_type: str,
        params: dict[str, Any],
        inputs: dict[str, Any],
        on_progress: ProgressCallback = None,
    ) -> dict[str, Any]:
        builder = WORKFLOW_BUILDERS.get(node_type)
        if builder is None:
            raise ValueError(f"No ComfyUI workflow for node type: {node_type}")

        # Pre-process: upload any image URLs to ComfyUI's input folder
        device_id = params.get("_device") or None
        urls = get_worker_urls(device_id)
        processed_inputs = await self._resolve_image_inputs(inputs, urls["http"], on_progress)

        prompt = builder({**params, "_node_type": node_type}, processed_inputs)

        # Build human-readable labels for progress messages
        node_labels = {}
        for nid, node_data in prompt.items():
            if isinstance(node_data, dict) and "class_type" in node_data:
                node_labels[nid] = node_data["class_type"]

        # Fresh client_id per execution to avoid cache collisions
        self.client_id = str(uuid.uuid4())

        return await self._queue_and_wait(prompt, node_labels, on_progress, urls, device_id or "")

    async def _resolve_image_inputs(self, inputs: dict, http_base: str, on_progress: ProgressCallback = None) -> dict:
        """Convert image proxy URLs to ComfyUI input filenames by uploading."""
        resolved = dict(inputs)
        for key, value in inputs.items():
            if not isinstance(value, str):
                continue
            if "comfyui/view?" in value or "/view?" in value:
                import urllib.parse
                parsed = urllib.parse.urlparse(value)
                qs = urllib.parse.parse_qs(parsed.query)
                original_name = qs.get("filename", ["upload.png"])[0]

                if on_progress:
                    await on_progress("info", {"message": f"Uploading {original_name} to ComfyUI..."})

                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        img_res = await client.get(value)
                        img_res.raise_for_status()
                        img_data = img_res.content

                        if on_progress:
                            await on_progress("info", {"message": f"Downloaded {len(img_data)//1024}KB, uploading to worker..."})

                        upload_res = await client.post(
                            f"{http_base}/upload/image",
                            files={"image": (original_name, img_data, "image/png")},
                            data={"overwrite": "true"},
                        )
                        if upload_res.status_code == 200:
                            upload_data = upload_res.json()
                            resolved[key] = upload_data.get("name", original_name)
                            if on_progress:
                                await on_progress("info", {"message": f"Image uploaded as {resolved[key]}"})
                        else:
                            resolved[key] = original_name
                except Exception as e:
                    resolved[key] = original_name
                    if on_progress:
                        await on_progress("info", {"message": f"Image upload failed ({e}), using filename: {original_name}"})
        return resolved

    async def _queue_and_wait(
        self,
        prompt: dict,
        node_labels: dict,
        on_progress: ProgressCallback = None,
        urls: dict = None,
        worker_name: str = "",
    ) -> dict[str, Any]:
        if urls is None:
            urls = get_worker_urls(None)

        http_base = urls["http"]
        ws_base = urls["ws"]

        # Queue the prompt
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{http_base}/prompt",
                json={"prompt": prompt, "client_id": self.client_id},
            )
            if res.status_code != 200:
                error_data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
                node_errors = error_data.get("node_errors", {})
                if node_errors:
                    first_err = list(node_errors.values())[0]
                    err_msgs = [e.get("message", "") for e in first_err.get("errors", [])]
                    raise RuntimeError(f"ComfyUI validation error: {'; '.join(err_msgs)}")
                raise RuntimeError(f"ComfyUI returned {res.status_code}: {res.text[:200]}")
            prompt_id = res.json()["prompt_id"]

        if on_progress:
            target_label = f" on {worker_name}" if worker_name else " (auto)"
            await on_progress("comfyui_queued", {
                "promptId": prompt_id,
                "message": f"Queued{target_label} → {http_base}",
            })
            # Log every node in the prompt
            prompt_lines = []
            for nid in sorted(prompt.keys(), key=lambda x: int(x) if x.isdigit() else 999):
                nd = prompt[nid]
                if not isinstance(nd, dict):
                    continue
                ct = nd.get("class_type", "?")
                inp = nd.get("inputs", {})
                detail = ""
                # Extract key info per node type
                if "TextEncode" in ct or "CLIPTextEncode" in ct:
                    text = inp.get("text") or inp.get("positive_prompt") or ""
                    if text:
                        detail = f' → "{text[:60]}"'
                    neg = inp.get("negative_prompt", "")
                    if neg:
                        detail += f' neg="{neg[:30]}"'
                elif "Loader" in ct or "CheckpointLoader" in ct:
                    model_name = inp.get("ckpt_name") or inp.get("model_name") or inp.get("model") or inp.get("vae_name") or inp.get("clip_name") or ""
                    if model_name:
                        detail = f" → {model_name}"
                elif ct == "KSampler":
                    detail = f" steps={inp.get('steps')} cfg={inp.get('cfg')} seed={inp.get('seed')}"
                elif "Sampler" in ct:
                    detail = f" steps={inp.get('steps','')} cfg={inp.get('cfg','')} seed={inp.get('seed','')}"
                elif "VideoCombine" in ct:
                    detail = f" fps={inp.get('frame_rate','')} format={inp.get('format','')}"
                elif "EmptyLatent" in ct or "EmptyEmbeds" in ct or "ImageToVideoEncode" in ct:
                    w = inp.get("width", "")
                    h = inp.get("height", "")
                    f = inp.get("num_frames") or inp.get("length", "")
                    if w: detail = f" {w}x{h} frames={f}"
                prompt_lines.append(f"[{nid}] {ct}{detail}")
            await on_progress("info", {
                "message": "Workflow: " + " → ".join(prompt_lines),
            })

        # Watch WebSocket for progress
        async with websockets.connect(f"{ws_base}/ws?clientId={self.client_id}") as ws:
            while True:
                msg = await asyncio.wait_for(ws.recv(), timeout=600)
                if isinstance(msg, bytes):
                    continue

                data = json.loads(msg)
                msg_type = data.get("type", "")
                msg_data = data.get("data", {})

                if msg_data.get("prompt_id") and msg_data["prompt_id"] != prompt_id:
                    continue

                if on_progress:
                    await self._emit_progress(msg_type, msg_data, node_labels, on_progress)

                if msg_type == "executing":
                    if msg_data.get("prompt_id") == prompt_id and msg_data.get("node") is None:
                        break

                if msg_type == "execution_error":
                    error = msg_data.get("exception_message", "Unknown ComfyUI error")
                    raise RuntimeError(f"ComfyUI error: {error}")

        # Fetch output
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{http_base}/history/{prompt_id}")
            res.raise_for_status()
            history = res.json()

        outputs = history.get(prompt_id, {}).get("outputs", {})

        # Find image or video output
        for node_id, node_output in outputs.items():
            if "images" in node_output:
                img = node_output["images"][0]
                filename = img["filename"]
                subfolder = img.get("subfolder", "")
                img_type = img.get("type", "output")
                worker_param = f"&instance={worker_name}" if worker_name else ""
                image_url = f"http://localhost:8000/comfyui/view?filename={filename}&subfolder={subfolder}&type={img_type}{worker_param}"
                return {"image": image_url}
            if "gifs" in node_output:
                # VHS_VideoCombine outputs as "gifs"
                vid = node_output["gifs"][0]
                filename = vid["filename"]
                subfolder = vid.get("subfolder", "")
                vid_type = vid.get("type", "output")
                worker_param = f"&instance={worker_name}" if worker_name else ""
                video_url = f"http://localhost:8000/comfyui/view?filename={filename}&subfolder={subfolder}&type={vid_type}{worker_param}"
                return {"video": video_url, "image": video_url}
            if "audio" in node_output:
                aud = node_output["audio"][0]
                filename = aud["filename"]
                subfolder = aud.get("subfolder", "")
                aud_type = aud.get("type", "output")
                worker_param = f"&instance={worker_name}" if worker_name else ""
                audio_url = f"http://localhost:8000/comfyui/view?filename={filename}&subfolder={subfolder}&type={aud_type}{worker_param}"
                return {"audio": audio_url}

        raise RuntimeError("No output found in ComfyUI result")

    async def _emit_progress(self, msg_type, msg_data, node_labels, on_progress):
        if msg_type == "execution_start":
            await on_progress("comfyui_start", {"message": "ComfyUI execution started"})
        elif msg_type == "execution_cached":
            cached = msg_data.get("nodes", [])
            if cached:
                names = [node_labels.get(n, n) for n in cached]
                await on_progress("comfyui_cached", {"message": f"Cached ({len(cached)}): {', '.join(names)}"})
        elif msg_type == "executing":
            node_id = msg_data.get("node")
            if node_id:
                label = node_labels.get(node_id, node_id)
                await on_progress("comfyui_executing", {"message": f"Running [{node_id}]: {label}", "comfyNodeId": node_id})
        elif msg_type == "progress":
            value = msg_data.get("value", 0)
            max_val = msg_data.get("max", 1)
            node_id = msg_data.get("node", "")
            label = node_labels.get(node_id, node_id)
            pct = round((value / max_val) * 100) if max_val > 0 else 0
            await on_progress("comfyui_progress", {
                "message": f"{label} [{value}/{max_val}] {pct}%",
                "value": value, "max": max_val, "percent": pct, "comfyNodeId": node_id,
            })
        elif msg_type == "executed":
            node_id = msg_data.get("node", "")
            label = node_labels.get(node_id, node_id)
            output = msg_data.get("output", {})
            output_keys = list(output.keys()) if output else []
            detail = f" → {output_keys}" if output_keys else ""
            await on_progress("comfyui_executed", {"message": f"Done [{node_id}]: {label}{detail}", "comfyNodeId": node_id})
        elif msg_type == "execution_success":
            await on_progress("comfyui_success", {"message": "ComfyUI prompt complete"})
        elif msg_type == "execution_interrupted":
            await on_progress("info", {"message": "ComfyUI execution interrupted"})
