import { NodeDef } from "../../types";

export const textInputNode: NodeDef = {
  id: "text-input",
  label: "Text",
  description: "A text string value",
  category: "utility",
  icon: "Type",
  inputs: {},
  outputs: {
    text: { type: "text", label: "Text" },
  },
  params: {
    value: {
      type: "prompt",
      label: "Text",
      default: "",
      placeholder: "Enter text...",
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 320,
};
