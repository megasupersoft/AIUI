import { NodeDef } from "../../types";

export const audioInputNode: NodeDef = {
  id: "audio-input",
  label: "Audio",
  description: "Upload or drop an audio file",
  category: "utility",
  icon: "AudioLines",
  inputs: {},
  outputs: {
    audio: { type: "audio", label: "Audio" },
  },
  params: {
    audio: {
      type: "audio",
      label: "Audio",
      default: null,
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 300,
};
