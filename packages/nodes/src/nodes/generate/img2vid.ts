import { NodeDef } from "../../types";

export const img2vidNode: NodeDef = {
  id: "img2vid",
  label: "Image to Video",
  description: "Animate an image into a video",
  category: "generate",
  icon: "Clapperboard",
  inputs: {
    image: { type: "image", label: "Input Image" },
    prompt: { type: "text", label: "Prompt", optional: true },
  },
  outputs: {
    video: { type: "video", label: "Video" },
  },
  params: {
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "The subject slowly turns...",
      appModeVisible: true,
    },
    model: {
      type: "select",
      label: "Model",
      default: "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors",
      options: [
        { label: "Wan 2.2 I2V (high noise)", value: "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors" },
        { label: "Wan 2.2 I2V (low noise)", value: "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors" },
        { label: "Wan 2.1 I2V 720p", value: "Wan2.1/wan2.1_i2v_720p_14B_fp16.safetensors" },
        { label: "LTX 2.3 (distilled fp8)", value: "ltx-2.3-22b-distilled_fp8_v2.safetensors" },
      ],
      appModeVisible: true,
    },
    frames: { type: "slider", label: "Frames", default: 81, min: 16, max: 256, step: 1 },
    steps: { type: "slider", label: "Steps", default: 20, min: 1, max: 50, step: 1 },
    guidance: { type: "slider", label: "Guidance Scale", default: 5.0, min: 1, max: 20, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["prompt", "model"],
  width: 340,
};
