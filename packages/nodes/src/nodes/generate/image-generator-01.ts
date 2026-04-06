import { NodeDef } from "../../types";

export const imageGenerator01Node: NodeDef = {
  id: "image-generator-01",
  label: "Image Generator 01",
  description: "SD 1.5 checkpoint + LoRA stack + KSampler (euler/karras)",
  category: "generate",
  icon: "ImagePlay",

  inputs: {
    prompt:   { type: "text",  label: "Prompt",          optional: true },
    negative: { type: "text",  label: "Negative Prompt", optional: true },
  },
  outputs: {
    image: { type: "image", label: "Image" },
  },

  params: {
    prompt: {
      type: "prompt",
      label: "Prompt",
      default: "",
      placeholder: "atmospheric 50mm lens behind shot...",
      appModeVisible: true,
    },
    negative: {
      type: "prompt",
      label: "Negative Prompt",
      default:
        "over saturated, fake perspective, cartoon,(worst quality:1.2), (low quality:1.2), (normal quality:1.2), extra limbs, lowres, bad anatomy, bad hands, signature, watermarks, ugly, imperfect eyes, skewed eyes, unnatural face, unnatural body, error, extra limb, missing limbs, ugly, deformed, noisy, blurry, low contrast",
    },
    checkpoint: {
      type: "select",
      label: "Checkpoint",
      default: "analogMadness_v70.safetensors",
      options: [
        { label: "Analog Madness v7",       value: "analogMadness_v70.safetensors" },
        { label: "Realistic Vision v6",      value: "realisticVisionV60B1_v51HyperVAE.safetensors" },
        { label: "CyberRealistic v9",        value: "cyberrealistic_v90.safetensors" },
        { label: "Epic Photogasm",           value: "epicphotogasm_ultimateFidelity.safetensors" },
        { label: "Photon v1",               value: "photon_v1.safetensors" },
        { label: "Lazy Mix",                value: "lazymixRealAmateur_v40.ckpt" },
      ],
      appModeVisible: true,
    },
    lora_1: {
      type: "string",
      label: "LoRA 1",
      default: "epiCRealLife.safetensors",
    },
    lora_1_weight: {
      type: "slider",
      label: "LoRA 1 Weight",
      default: 0.6,
      min: 0,
      max: 2,
      step: 0.05,
    },
    lora_2: {
      type: "string",
      label: "LoRA 2",
      default: "Nlo_CinematicLookEnhancer_v1.safetensors",
    },
    lora_2_weight: {
      type: "slider",
      label: "LoRA 2 Weight",
      default: 0.95,
      min: 0,
      max: 2,
      step: 0.05,
    },
    lora_3: {
      type: "string",
      label: "LoRA 3",
      default: "polyhdron_all_in_one_eyes_hands_skin_fin.safetensors",
    },
    lora_3_weight: {
      type: "slider",
      label: "LoRA 3 Weight",
      default: 0.3,
      min: 0,
      max: 2,
      step: 0.05,
    },
    width: {
      type: "slider",
      label: "Width",
      default: 768,
      min: 512,
      max: 2048,
      step: 64,
      appModeVisible: true,
    },
    height: {
      type: "slider",
      label: "Height",
      default: 1024,
      min: 512,
      max: 2048,
      step: 64,
      appModeVisible: true,
    },
    steps: {
      type: "slider",
      label: "Steps",
      default: 50,
      min: 1,
      max: 150,
      step: 1,
    },
    cfg: {
      type: "slider",
      label: "CFG Scale",
      default: 6,
      min: 1,
      max: 20,
      step: 0.5,
    },
    sampler: {
      type: "select",
      label: "Sampler",
      default: "euler",
      options: [
        { label: "Euler",        value: "euler" },
        { label: "Euler A",      value: "euler_ancestral" },
        { label: "DPM++ 2M",     value: "dpmpp_2m" },
        { label: "DPM++ SDE",    value: "dpmpp_sde" },
        { label: "DDIM",         value: "ddim" },
      ],
    },
    scheduler: {
      type: "select",
      label: "Scheduler",
      default: "karras",
      options: [
        { label: "Karras",   value: "karras" },
        { label: "Normal",   value: "normal" },
        { label: "Simple",   value: "simple" },
        { label: "Exponential", value: "exponential" },
      ],
    },
    seed: {
      type: "number",
      label: "Seed (-1 = random)",
      default: -1,
    },
  },

  backends: {
    comfyui: true,
  },
  defaultBackend: "comfyui",
  comfyuiWorkflow: "Image Generator 01",
  exposedParams: ["prompt", "negative", "checkpoint", "width", "height"],
  width: 340,
};
