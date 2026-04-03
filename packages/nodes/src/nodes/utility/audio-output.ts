import { NodeDef } from "../../types";

export const audioOutputNode: NodeDef = {
  id: "audio-output",
  label: "Audio Output",
  description: "Plays the result audio",
  category: "utility",
  icon: "Volume2",
  inputs: {
    audio: { type: "any", label: "Audio" },
  },
  outputs: {},
  params: {},
  backends: { local: true },
  defaultBackend: "local",
  width: 280,
};
