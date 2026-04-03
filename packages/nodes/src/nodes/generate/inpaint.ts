import { NodeDef } from "../../types";

export const inpaintNode: NodeDef = {
  id: "inpaint",
  label: "Inpaint",
  description: "Fill masked areas of an image using AI",
  category: "generate",
  icon: "PaintBucket",
  inputs: {
    image: { type: "image", label: "Image" },
    mask:  { type: "mask",  label: "Mask" },
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
      placeholder: "Replace with...",
      appModeVisible: true,
    },
    steps: {
      type: "slider",
      label: "Steps",
      default: 28,
      min: 1,
      max: 50,
      step: 1,
    },
    seed: {
      type: "number",
      label: "Seed (-1 = random)",
      default: -1,
    },
  },
  backends: {
    fal: {
      modelId: "fal-ai/flux/dev/image-to-image",
      paramMap: { prompt: "prompt", steps: "num_inference_steps", seed: "seed" },
      outputMap: { image: "images[0].url" },
    },
  },
  defaultBackend: "fal",
  exposedParams: ["prompt"],
  width: 340,
};
