"""
ComfyUI workflow builders for each model architecture.
Each function returns a ComfyUI prompt dict ready to queue.
"""
import random
from typing import Any, Optional


def _seed(seed: int) -> int:
    return seed if seed != -1 else random.randint(0, 2**32 - 1)


# ─── Architecture detection ──────────────────────────────────────────────────

def detect_arch(model_name: str) -> str:
    """Detect model architecture from filename."""
    n = model_name.lower()
    if "flux2" in n:
        return "flux2"
    if "flux" in n:
        return "flux1"
    if "hidream" in n:
        return "hidream"
    if "ltx" in n:
        return "ltx"
    if "wan" in n and "t2v" in n:
        return "wan_t2v"
    if "wan" in n and "ti2v" in n:
        return "wan_ti2v"
    if "wan" in n and "i2v" in n:
        return "wan_i2v"
    return "sd15"


# ─── SD 1.5 / SDXL (CheckpointLoaderSimple) ─────────────────────────────────

def build_sd15_txt2img(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    negative = inputs.get("negative") or params.get("negative", "")
    ckpt = params.get("model", "v1-5-pruned-emaonly.safetensors")
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {
            "width": params.get("width", 512),
            "height": params.get("height", 512),
            "batch_size": 1,
        }},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
            "latent_image": ["4", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 20),
            "cfg": params.get("guidance", 7.0),
            "sampler_name": "euler",
            "scheduler": "normal",
            "denoise": 1.0,
        }},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "aiui"}},
    }


def build_sd15_img2img(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    negative = inputs.get("negative") or params.get("negative", "")
    ckpt = params.get("model", "v1-5-pruned-emaonly.safetensors")
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["1", 1]}},
        "8": {"class_type": "LoadImage", "inputs": {"image": inputs.get("image", "")}},
        "9": {"class_type": "VAEEncode", "inputs": {"pixels": ["8", 0], "vae": ["1", 2]}},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
            "latent_image": ["9", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 20),
            "cfg": params.get("guidance", 7.0),
            "sampler_name": "euler",
            "scheduler": "normal",
            "denoise": params.get("strength", 0.75),
        }},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "aiui"}},
    }


# ─── Flux 1 (checkpoint-based, different sampler settings) ───────────────────

def build_flux1_txt2img(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    ckpt = params.get("model", "flux1-dev-fp8.safetensors")
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["1", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["1", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {
            "width": params.get("width", 1024),
            "height": params.get("height", 1024),
            "batch_size": 1,
        }},
        "5": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
            "latent_image": ["4", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 20),
            "cfg": 1.0,  # Flux uses very low cfg
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
        }},
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "aiui"}},
    }


# ─── Flux 2 (DiffusionModelLoaderKJ + DualCLIPLoader) ───────────────────────

def build_flux2_txt2img(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    model = params.get("model", "flux2_dev_fp8mixed.safetensors")
    return {
        "1": {"class_type": "DiffusionModelLoaderKJ", "inputs": {
            "model_name": model,
            "weight_dtype": "default",
            "compute_dtype": "default",
            "patch_cublaslinear": False,
            "sage_attention": "disabled",
            "enable_fp16_accumulation": False,
        }},
        "2": {"class_type": "DualCLIPLoader", "inputs": {
            "clip_name1": "mistral_3_small_flux2_fp8.safetensors",
            "clip_name2": "umt5-xxl-enc-bf16.safetensors",
            "type": "flux",
        }},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["2", 0]}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {
            "width": params.get("width", 1024),
            "height": params.get("height", 1024),
            "batch_size": 1,
        }},
        "7": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0],
            "latent_image": ["6", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 20),
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
        }},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "aiui"}},
    }


# ─── HiDream (DiffusionModelLoaderKJ + QuadrupleCLIPLoader) ─────────────────

def build_hidream_txt2img(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    model = params.get("model", "hidream_i1_fast_fp8.safetensors")
    return {
        "1": {"class_type": "DiffusionModelLoaderKJ", "inputs": {
            "model_name": model,
            "weight_dtype": "default",
            "compute_dtype": "default",
            "patch_cublaslinear": False,
            "sage_attention": "disabled",
            "enable_fp16_accumulation": False,
        }},
        "2": {"class_type": "DualCLIPLoader", "inputs": {
            "clip_name1": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
            "clip_name2": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
            "type": "hidream",
        }},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["2", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {
            "width": params.get("width", 1024),
            "height": params.get("height", 1024),
            "batch_size": 1,
        }},
        "7": {"class_type": "KSampler", "inputs": {
            "model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0],
            "latent_image": ["6", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 20),
            "cfg": params.get("guidance", 5.0),
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
        }},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "aiui"}},
    }


# ─── Wan (using WanVideoWrapper nodes) ───────────────────────────────────────

def _wan_vae_name(model: str) -> str:
    if "wan2.2" in model.lower():
        return "wan2.2_vae.safetensors"
    return "wan_2.1_vae.safetensors"


def build_wan_t2v(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    negative = inputs.get("negative") or params.get("negative", "")
    model = params.get("model", "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors")
    width = params.get("width", 512)
    height = params.get("height", 320)
    num_frames = min(params.get("frames", 33), 81)
    return {
        # Wan 2.2 T2V fp8_scaled is pre-quantized — fits in 24GB
        "1": {"class_type": "WanVideoModelLoader", "inputs": {
            "model": model,
            "base_precision": "bf16",
            "quantization": "disabled",
            "load_device": "main_device",
        }},
        # Load T5 text encoder
        "2": {"class_type": "LoadWanVideoT5TextEncoder", "inputs": {
            "model_name": "umt5-xxl-enc-bf16.safetensors",
            "precision": "bf16",
        }},
        # Load VAE
        "3": {"class_type": "WanVideoVAELoader", "inputs": {
            "model_name": _wan_vae_name(model),
            "precision": "bf16",
        }},
        # Encode text
        "4": {"class_type": "WanVideoTextEncode", "inputs": {
            "positive_prompt": prompt,
            "negative_prompt": negative,
            "t5": ["2", 0],
            "force_offload": True,
        }},
        # Empty embeds for T2V (no start image)
        "5": {"class_type": "WanVideoEmptyEmbeds", "inputs": {
            "width": width,
            "height": height,
            "num_frames": num_frames,
        }},
        # Sample
        "6": {"class_type": "WanVideoSampler", "inputs": {
            "model": ["1", 0],
            "image_embeds": ["5", 0],
            "steps": params.get("steps", 20),
            "cfg": params.get("guidance", 5.0),
            "shift": 8.0,
            "seed": _seed(params.get("seed", -1)),
            "force_offload": True,
            "scheduler": "unipc",
            "riflex_freq_index": 0,
            "text_embeds": ["4", 0],
        }},
        # Decode
        "7": {"class_type": "WanVideoDecode", "inputs": {
            "vae": ["3", 0],
            "samples": ["6", 0],
            "enable_vae_tiling": True,
            "tile_x": 480, "tile_y": 320,
            "tile_stride_x": 240, "tile_stride_y": 160,
        }},
        # Combine to video
        "8": {"class_type": "VHS_VideoCombine", "inputs": {
            "images": ["7", 0],
            "frame_rate": 16,
            "loop_count": 0,
            "filename_prefix": "aiui_video",
            "format": "video/h264-mp4",
            "pingpong": False,
            "save_output": True,
        }},
    }


def build_ltx_i2v(params: dict, inputs: dict) -> dict:
    """LTX 2.3 Image-to-Video using core ComfyUI nodes."""
    prompt = inputs.get("prompt") or params.get("prompt", "")
    negative = inputs.get("negative") or params.get("negative", "")
    model = params.get("model", "ltx-2.3-22b-distilled_fp8_v2.safetensors")
    image = inputs.get("image", "example.png")
    return {
        "1": {"class_type": "DiffusionModelLoaderKJ", "inputs": {
            "model_name": model,
            "weight_dtype": "default",
            "compute_dtype": "default",
            "patch_cublaslinear": False,
            "sage_attention": "disabled",
            "enable_fp16_accumulation": False,
        }},
        "2": {"class_type": "CLIPLoader", "inputs": {
            "clip_name": "umt5-xxl-enc-bf16.safetensors",
            "type": "ltxv",
        }},
        "11": {"class_type": "LoadImage", "inputs": {"image": image}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["2", 0]}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "LTX23_video_vae_bf16.safetensors"}},
        "13": {"class_type": "LTXVImgToVideo", "inputs": {
            "positive": ["4", 0], "negative": ["5", 0],
            "vae": ["3", 0],
            "image": ["11", 0],
            "width": params.get("width", 768),
            "height": params.get("height", 512),
            "length": min(params.get("frames", 65), 97),
            "batch_size": 1,
            "strength": params.get("strength", 0.8),
        }},
        "14": {"class_type": "LTXVScheduler", "inputs": {
            "steps": params.get("steps", 20),
            "max_shift": 1.0,
            "base_shift": 0.5,
            "stretch": True,
            "terminal": 0.1,
        }},
        "15": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "7": {"class_type": "SamplerCustom", "inputs": {
            "model": ["1", 0],
            "add_noise": True,
            "noise_seed": _seed(params.get("seed", -1)),
            "cfg": params.get("guidance", 3.0),
            "positive": ["13", 0],
            "negative": ["13", 1],
            "sampler": ["15", 0],
            "sigmas": ["14", 0],
            "latent_image": ["13", 2],
        }},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "VHS_VideoCombine", "inputs": {
            "images": ["8", 0],
            "frame_rate": 24,
            "loop_count": 0,
            "filename_prefix": "aiui_video",
            "format": "video/h264-mp4",
            "pingpong": False,
            "save_output": True,
        }},
    }


# ─── LTX 2.3 Text-to-Video (+Audio) ─────────────────────────────────────────

def build_ltx_t2v(params: dict, inputs: dict) -> dict:
    prompt = inputs.get("prompt") or params.get("prompt", "")
    negative = inputs.get("negative") or params.get("negative", "")
    model = params.get("model", "ltx-2.3-22b-distilled_fp8_v2.safetensors")
    return {
        "1": {"class_type": "DiffusionModelLoaderKJ", "inputs": {
            "model_name": model,
            "weight_dtype": "default",
            "compute_dtype": "default",
            "patch_cublaslinear": False,
            "sage_attention": "disabled",
            "enable_fp16_accumulation": False,
        }},
        "2": {"class_type": "CLIPLoader", "inputs": {
            "clip_name": "umt5-xxl-enc-bf16.safetensors",
            "type": "ltxv",
        }},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "LTX23_video_vae_bf16.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["2", 0]}},
        "13": {"class_type": "LTXVConditioning", "inputs": {
            "positive": ["4", 0], "negative": ["5", 0],
            "frame_rate": 24,
        }},
        "6": {"class_type": "EmptyLTXVLatentVideo", "inputs": {
            "width": params.get("width", 768),
            "height": params.get("height", 512),
            "length": params.get("frames", 97),
            "batch_size": 1,
        }},
        "14": {"class_type": "LTXVScheduler", "inputs": {
            "steps": params.get("steps", 20),
            "max_shift": 1.0,
            "base_shift": 0.5,
            "stretch": True,
            "terminal": 0.1,
        }},
        "15": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "7": {"class_type": "SamplerCustom", "inputs": {
            "model": ["1", 0],
            "add_noise": True,
            "noise_seed": _seed(params.get("seed", -1)),
            "cfg": params.get("guidance", 3.0),
            "positive": ["13", 0],
            "negative": ["13", 1],
            "sampler": ["15", 0],
            "sigmas": ["14", 0],
            "latent_image": ["6", 0],
        }},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "VHS_VideoCombine", "inputs": {
            "images": ["8", 0],
            "frame_rate": 24,
            "loop_count": 0,
            "filename_prefix": "aiui_video",
            "format": "video/h264-mp4",
            "pingpong": False,
            "save_output": True,
        }},
    }


# ─── Music generation (ACE-Step) ────────────────────────────────────────────

def build_ace_music(params: dict, inputs: dict) -> dict:
    tags = inputs.get("tags") or params.get("tags", "")
    lyrics = inputs.get("prompt") or params.get("prompt", "")
    return {
        "1": {"class_type": "CLIPLoader", "inputs": {
            "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
            "type": "ace",
        }},
        "2": {"class_type": "TextEncodeAceStepAudio", "inputs": {
            "clip": ["1", 0],
            "tags": tags,
            "lyrics": lyrics,
            "lyrics_strength": 1.0,
        }},
        "3": {"class_type": "EmptyAceStepLatentAudio", "inputs": {
            "seconds": params.get("duration", 30),
            "batch_size": 1,
        }},
        "4": {"class_type": "KSampler", "inputs": {
            "model": ["1", 1],
            "positive": ["2", 0],
            "negative": ["2", 1],
            "latent_image": ["3", 0],
            "seed": _seed(params.get("seed", -1)),
            "steps": params.get("steps", 60),
            "cfg": params.get("guidance", 5.0),
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1.0,
        }},
        "5": {"class_type": "VAEDecode", "inputs": {"samples": ["4", 0], "vae": ["1", 2]}},
        "6": {"class_type": "SaveAudio", "inputs": {"audio": ["5", 0], "filename_prefix": "aiui_music"}},
    }


# ─── Workflow dispatcher ─────────────────────────────────────────────────────

def build_txt2img(params: dict, inputs: dict) -> dict:
    model = params.get("model", "v1-5-pruned-emaonly.safetensors")
    arch = detect_arch(model)
    if arch == "flux2":
        return build_flux2_txt2img(params, inputs)
    elif arch == "flux1":
        return build_flux1_txt2img(params, inputs)
    elif arch == "hidream":
        return build_hidream_txt2img(params, inputs)
    else:
        return build_sd15_txt2img(params, inputs)


def build_img2img(params: dict, inputs: dict) -> dict:
    model = params.get("model", "v1-5-pruned-emaonly.safetensors")
    arch = detect_arch(model)
    # For now all img2img uses SD1.5 workflow — Flux/HiDream img2img needs different handling
    return build_sd15_img2img(params, inputs)


def build_txt2vid(params: dict, inputs: dict) -> dict:
    model = params.get("model", "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors")
    arch = detect_arch(model)
    if arch == "ltx":
        return build_ltx_t2v(params, inputs)
    else:
        return build_wan_t2v(params, inputs)


def build_img2vid(params: dict, inputs: dict) -> dict:
    return build_ltx_i2v(params, inputs)


def build_vid2vid(params: dict, inputs: dict) -> dict:
    return build_ltx_i2v(params, inputs)


def build_vid_audio(params: dict, inputs: dict) -> dict:
    return build_ltx_t2v(params, inputs)


def build_music(params: dict, inputs: dict) -> dict:
    return build_ace_music(params, inputs)


# Node type → workflow builder
def build_not_implemented(params: dict, inputs: dict) -> dict:
    node_type = params.get("_node_type", "unknown")
    raise NotImplementedError(
        f"{node_type} workflow not yet configured. "
        f"Build the workflow in ComfyUI first, then export and add it to comfyui_workflows.py. "
        f"See docs/adding-workflows.md for instructions."
    )


WORKFLOW_BUILDERS = {
    "txt2img": build_txt2img,
    "img2img": build_img2img,
    "inpaint": build_sd15_txt2img,  # TODO: proper inpaint workflow
    "txt2vid": build_txt2vid,
    "img2vid": build_img2vid,
    "vid2vid": build_vid2vid,
    "vid-audio": build_vid_audio,
    "music": build_not_implemented,      # TODO: needs ACE-Step workflow from ComfyUI
    "tts": build_not_implemented,         # TODO: needs Chatterbox/Qwen3-TTS workflow from ComfyUI
    "voice-clone": build_not_implemented, # TODO: needs RVC workflow from ComfyUI
    "generate-3d": build_not_implemented, # TODO: needs TRELLIS workflow from ComfyUI
}
