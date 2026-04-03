import { NodeDef } from "../../types";

export const numberInputNode: NodeDef = {
  id: "number-input",
  label: "Number",
  description: "A numeric value",
  category: "utility",
  icon: "Hash",
  inputs: {},
  outputs: {
    number: { type: "number", label: "Number" },
  },
  params: {
    value: {
      type: "number",
      label: "Value",
      default: 0,
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 240,
};
