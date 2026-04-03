import { NodeDef } from "../../types";

export const vidAudioNode: NodeDef = {
  id: "vid-audio",
  label: "Video + Audio",
  description: "Generate video with synchronized audio using LTX",
  category: "generate",
  icon: "MonitorSpeaker",
  inputs: {
    prompt: { type: "text", label: "Prompt", optional: true },
    image: { type: "image", label: "Input Image", optional: true },
  },
  outputs: {
    video: { type: "video", label: "Video" },
    audio: { type: "any", label: "Audio" },
  },
  params: {
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "A dog barking in a park...",
      appModeVisible: true,
    },
    model: {
      type: "select",
      label: "Model",
      default: "ltx-2.3-22b-distilled_fp8_v2.safetensors",
      options: [
        { label: "LTX 2.3 (distilled fp8)", value: "ltx-2.3-22b-distilled_fp8_v2.safetensors" },
      ],
      appModeVisible: true,
    },
    width: { type: "slider", label: "Width", default: 768, min: 256, max: 1920, step: 64 },
    height: { type: "slider", label: "Height", default: 512, min: 256, max: 1080, step: 64 },
    frames: { type: "slider", label: "Frames", default: 97, min: 16, max: 256, step: 1 },
    steps: { type: "slider", label: "Steps", default: 20, min: 1, max: 50, step: 1 },
    guidance: { type: "slider", label: "Guidance Scale", default: 3.0, min: 1, max: 15, step: 0.5 },
    seed: { type: "number", label: "Seed (-1 = random)", default: -1 },
  },
  backends: { comfyui: true },
  defaultBackend: "comfyui",
  exposedParams: ["prompt", "model"],
  width: 340,
};
