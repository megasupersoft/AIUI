import { NodeDef } from "../../types";

export const musicNode: NodeDef = {
  id: "music",
  label: "Music Generation",
  description: "Generate music with ACE-Step",
  category: "generate",
  icon: "Music",
  inputs: {
    prompt: { type: "text", label: "Prompt", optional: true },
  },
  outputs: {
    audio: { type: "any", label: "Audio" },
  },
  params: {
    prompt: {
      type: "prompt",
      label: "Lyrics / Description",
      default: "",
      placeholder: "[verse]\\nLyrics here...",
      appModeVisible: true,
    },
    tags: {
      type: "prompt",
      label: "Tags",
      default: "",
      placeholder: "pop, electronic, 120bpm, female vocal",
      appModeVisible: true,
    },
    duration: { type: "slider", label: "Duration (sec)", default: 30, min: 5, max: 180, step: 5, appModeVisible: true },
    steps: { type: "slider", label: "Steps", default: 60, min: 10, max: 200, step: 5 },
    guidance: { type: "slider", label: "Guidance Scale", default: 5.0, min: 1, max: 15, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["prompt", "tags", "duration"],
  width: 340,
};
