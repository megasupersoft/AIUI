import { NodeDef } from "../../types";

export const voiceCloneNode: NodeDef = {
  id: "voice-clone",
  label: "Voice Clone",
  description: "Clone a voice using RVC and generate speech",
  category: "generate",
  icon: "Mic",
  inputs: {
    text: { type: "text", label: "Text" },
    audio_ref: { type: "any", label: "Reference Audio", optional: true },
  },
  outputs: {
    audio: { type: "any", label: "Audio" },
  },
  params: {
    text: {
      type: "prompt",
      label: "Text",
      default: "",
      placeholder: "Text to speak in the cloned voice...",
      appModeVisible: true,
    },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["text"],
  width: 320,
};
