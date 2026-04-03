import { NodeDef } from "../../types";

export const img2imgNode: NodeDef = {
  id: "img2img",
  label: "Image to Image",
  description: "Transform an image using a text prompt",
  category: "generate",
  icon: "Wand2",
  inputs: {
    image: { type: "image", label: "Input Image" },
    prompt: { type: "text", label: "Prompt", optional: true },
  },
  outputs: {
    image: { type: "image", label: "Image" },
  },
  params: {
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "Transform into...",
      appModeVisible: true,
    },
    model: {
      type: "select",
      label: "Model",
      default: "v1-5-pruned-emaonly.safetensors",
      options: [
        { label: "SD 1.5", value: "v1-5-pruned-emaonly.safetensors" },
        { label: "Flux Dev (fp8)", value: "flux1-dev-fp8.safetensors" },
        { label: "Realistic Vision v6", value: "realisticVisionV60B1_v51HyperVAE.safetensors" },
        { label: "CyberRealistic v9", value: "cyberrealistic_v90.safetensors" },
      ],
      appModeVisible: true,
    },
    strength: {
      type: "slider",
      label: "Strength",
      default: 0.75,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      appModeVisible: true,
    },
    steps: { type: "slider", label: "Steps", default: 20, min: 1, max: 50, step: 1 },
    guidance: { type: "slider", label: "Guidance Scale", default: 7.0, min: 1, max: 20, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["prompt", "model", "strength"],
  width: 340,
};
