import { NodeDef } from "../../types";

export const imageOutputNode: NodeDef = {
  id: "image-output",
  label: "Output",
  description: "Displays the result image",
  category: "utility",
  icon: "MonitorPlay",
  inputs: {
    image: { type: "image", label: "Image" },
  },
  outputs: {},
  params: {},
  backends: { local: true },
  defaultBackend: "local",
  exposedParams: [],
  width: 320,
};
