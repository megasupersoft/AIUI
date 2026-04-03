import { NodeDef } from "../../types";

export const ttsNode: NodeDef = {
  id: "tts",
  label: "Text to Speech",
  description: "Generate speech audio from text",
  category: "generate",
  icon: "Speech",
  inputs: {
    text: { type: "text", label: "Text" },
  },
  outputs: {
    audio: { type: "any", label: "Audio" },
  },
  params: {
    text: {
      type: "prompt",
      label: "Text",
      default: "",
      placeholder: "Hello, how are you today?",
      appModeVisible: true,
    },
    engine: {
      type: "select",
      label: "Engine",
      default: "chatterbox",
      options: [
        { label: "Chatterbox", value: "chatterbox" },
        { label: "Qwen3 TTS", value: "qwen3_tts" },
      ],
      appModeVisible: true,
    },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["text", "engine"],
  width: 320,
};
