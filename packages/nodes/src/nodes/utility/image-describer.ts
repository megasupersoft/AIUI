import { NodeDef } from "../../types";

export const imageDescriberNode: NodeDef = {
  id: "image-describer",
  label: "Describe Image",
  description: "Uses a vision model to describe an image in text",
  category: "utility",
  icon: "ScanText",
  inputs: {
    image: { type: "image", label: "Image" },
  },
  outputs: {
    text: { type: "text", label: "Description" },
  },
  params: {
    detail: {
      type: "select",
      label: "Detail level",
      default: "auto",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Low", value: "low" },
        { label: "High", value: "high" },
      ],
    },
    prompt: {
      type: "prompt",
      label: "Instruction",
      default: "Describe this image in detail.",
      appModeVisible: true,
    },
  },
  backends: { openai: true },
  defaultBackend: "openai",
  width: 300,
};
