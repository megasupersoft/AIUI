import { NodeDef } from "../../types";

export const upscaleNode: NodeDef = {
  id: "upscale",
  label: "Upscale",
  description: "Upscale an image using Real-ESRGAN",
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
      default: "4",
      options: [
        { label: "2\u00d7", value: "2" },
        { label: "4\u00d7", value: "4" },
      ],
      appModeVisible: true,
    },
  },
  backends: {
    fal: {
      modelId: "fal-ai/esrgan",
      paramMap: { scale: "scale" },
      outputMap: { image: "image.url" },
    },
  },
  defaultBackend: "fal",
  exposedParams: ["scale"],
  width: 280,
};
