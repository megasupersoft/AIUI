import { NodeDef } from "../../types";

export const imageInputNode: NodeDef = {
  id: "image-input",
  label: "Image",
  description: "Upload or paste an image",
  category: "utility",
  icon: "ImagePlus",
  inputs: {},
  outputs: {
    image: { type: "image", label: "Image" },
  },
  params: {
    image: {
      type: "image",
      label: "Image",
      default: null,
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 280,
};
