import { NodeDef } from "../../types";

export const vid2vidNode: NodeDef = {
  id: "vid2vid",
  label: "First/Last Frame Video",
  description: "Generate video from first and last frame images",
  category: "generate",
  icon: "Layers",
  inputs: {
    first_frame: { type: "image", label: "First Frame" },
    last_frame: { type: "image", label: "Last Frame", optional: true },
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
      placeholder: "Smooth transition between frames...",
      appModeVisible: true,
    },
    model: {
      type: "select",
      label: "Model",
      default: "wan2.2_ti2v_5B_fp16.safetensors",
      options: [
        { label: "Wan 2.2 TI2V 5B", value: "wan2.2_ti2v_5B_fp16.safetensors" },
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
