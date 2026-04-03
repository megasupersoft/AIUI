import { NodeDef } from "../../types";

export const generate3dNode: NodeDef = {
  id: "generate-3d",
  label: "3D Generation",
  description: "Generate a 3D model from an image using TRELLIS",
  category: "generate",
  icon: "Box",
  inputs: {
    image: { type: "image", label: "Input Image" },
  },
  outputs: {
    mesh: { type: "any", label: "3D Mesh" },
  },
  params: {
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
    steps: { type: "slider", label: "Steps", default: 20, min: 1, max: 50, step: 1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: [],
  width: 280,
};
