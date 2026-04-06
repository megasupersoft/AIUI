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
      default: "Wan2.1/wan2.1_i2v_720p_14B_fp16.safetensors",
      options: [
        { label: "Wan 2.1 I2V 720p 14B", value: "Wan2.1/wan2.1_i2v_720p_14B_fp16.safetensors" },
      ],
      appModeVisible: true,
    },
    frames: { type: "slider", label: "Frames", default: 81, min: 16, max: 81, step: 1 },
    steps: { type: "slider", label: "Steps", default: 8, min: 1, max: 30, step: 1 },
    guidance: { type: "slider", label: "Guidance Scale", default: 1.0, min: 1, max: 10, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  comfyuiWorkflow: "Wan Video 01",
  exposedParams: ["prompt", "model"],
  width: 340,
};
