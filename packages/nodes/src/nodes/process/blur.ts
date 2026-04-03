import { NodeDef } from "../../types";

export const blurNode: NodeDef = {
  id: "blur",
  label: "Blur",
  description: "Apply Gaussian blur to an image",
  category: "process",
  icon: "Droplets",
  inputs: {
    image: { type: "image", label: "Image" },
  },
  outputs: {
    image: { type: "image", label: "Image" },
  },
  params: {
    radius: {
      type: "slider",
      label: "Radius",
      default: 5,
      min: 1,
      max: 50,
      step: 1,
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 260,
};
