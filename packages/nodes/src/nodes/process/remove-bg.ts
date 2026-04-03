import { NodeDef } from "../../types";

export const removeBgNode: NodeDef = {
  id: "remove-bg",
  label: "Remove Background",
  description: "Remove the background from an image",
  category: "process",
  icon: "Scissors",
  inputs: {
    image: { type: "image", label: "Image" },
  },
  outputs: {
    image: { type: "image", label: "Image (no BG)" },
    mask:  { type: "mask",  label: "Mask" },
  },
  params: {},
  backends: {
    fal: {
      modelId: "fal-ai/birefnet",
      paramMap: {},
      outputMap: { image: "image.url", mask: "mask.url" },
    },
  },
  defaultBackend: "fal",
  width: 280,
};
