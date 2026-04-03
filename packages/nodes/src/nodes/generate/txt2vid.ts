import { NodeDef } from "../../types";

export const txt2vidNode: NodeDef = {
  id: "txt2vid",
  label: "Text to Video",
  description: "Generate a video from a text prompt",
  category: "generate",
  icon: "Film",
  inputs: {
    prompt: { type: "text", label: "Prompt", optional: true },
    negative: { type: "text", label: "Negative Prompt", optional: true },
  },
  outputs: {
    video: { type: "video", label: "Video" },
  },
  params: {
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "A cinematic scene of...",
      appModeVisible: true,
    },
    negative: {
      type: "prompt",
      label: "Negative Prompt",
      default: "",
      placeholder: "blurry, low quality...",
    },
    model: {
      type: "select",
      label: "Model",
      default: "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
      options: [
        { label: "Wan 2.2 T2V (high noise)", value: "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors" },
        { label: "Wan 2.2 T2V (low noise)", value: "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors" },
        { label: "LTX 2.3 (distilled fp8)", value: "ltx-2.3-22b-distilled_fp8_v2.safetensors" },
      ],
      appModeVisible: true,
    },
    width: { type: "slider", label: "Width", default: 832, min: 256, max: 1920, step: 64, appModeVisible: true },
    height: { type: "slider", label: "Height", default: 480, min: 256, max: 1080, step: 64, appModeVisible: true },
    frames: { type: "slider", label: "Frames", default: 81, min: 16, max: 256, step: 1 },
    steps: { type: "slider", label: "Steps", default: 20, min: 1, max: 50, step: 1 },
    guidance: { type: "slider", label: "Guidance Scale", default: 5.0, min: 1, max: 20, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["prompt", "model", "width", "height"],
  width: 340,
};
