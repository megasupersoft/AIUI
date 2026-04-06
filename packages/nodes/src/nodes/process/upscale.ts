import { NodeDef } from "../../types";

export const upscaleNode: NodeDef = {
  id: "upscale",
  label: "Upscale",
  description: "Upscale an image using Ultimate SD Upscale + ControlNet tile",
  category: "process",
  icon: "ZoomIn",
  inputs: {
    image: { type: "image", label: "Image" },
  },
  outputs: {
    image: { type: "image", label: "Upscaled Image" },
  },
  params: {
    scale: {
      type: "select",
      label: "Scale",
      default: "2",
      options: [
        { label: "2×", value: "2" },
        { label: "4×", value: "4" },
      ],
      appModeVisible: true,
    },
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "Optional detail prompt...",
      appModeVisible: false,
    },
    steps: { type: "slider", label: "Steps", default: 50, min: 10, max: 100, step: 5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  comfyuiWorkflow: "Image Upscaler 01",
  exposedParams: ["scale"],
  width: 280,
};
