import { NodeDef } from "../../types";

/** Structured prompt categories and options */
export const PROMPT_TREE = {
  camera: {
    label: "Camera",
    icon: "Camera",
    groups: {
      angle: {
        label: "Angle",
        options: ["eye level", "low angle", "high angle", "bird's eye view", "worm's eye view", "dutch angle", "overhead shot"],
      },
      lens: {
        label: "Lens",
        options: ["35mm", "50mm", "85mm portrait", "wide angle 24mm", "telephoto 200mm", "macro", "fisheye", "tilt-shift", "anamorphic"],
      },
      shot: {
        label: "Shot Type",
        options: ["close-up", "extreme close-up", "medium shot", "full shot", "wide shot", "establishing shot", "over the shoulder", "POV"],
      },
      focus: {
        label: "Focus",
        options: ["shallow depth of field", "deep focus", "bokeh", "rack focus", "soft focus", "tack sharp"],
      },
    },
  },
  lighting: {
    label: "Lighting",
    icon: "Sun",
    groups: {
      type: {
        label: "Type",
        options: ["natural light", "golden hour", "blue hour", "studio lighting", "ring light", "neon lighting", "candlelight", "moonlight", "backlit", "rim lighting", "volumetric lighting", "chiaroscuro"],
      },
      mood: {
        label: "Mood",
        options: ["dramatic lighting", "soft diffused light", "harsh shadows", "high key", "low key", "silhouette", "light rays", "god rays", "lens flare"],
      },
      direction: {
        label: "Direction",
        options: ["front lit", "side lit", "back lit", "top lit", "under lit", "rembrandt lighting", "split lighting", "butterfly lighting"],
      },
    },
  },
  style: {
    label: "Style",
    icon: "Palette",
    groups: {
      art: {
        label: "Art Style",
        options: ["photorealistic", "hyperrealistic", "cinematic", "editorial", "fashion photography", "street photography", "documentary", "fine art", "conceptual art", "surrealism", "impressionism", "oil painting", "watercolor", "digital art", "3D render", "anime", "manga", "comic book", "pixel art", "vaporwave"],
      },
      medium: {
        label: "Medium",
        options: ["photograph", "digital painting", "oil on canvas", "pencil drawing", "charcoal sketch", "ink illustration", "pastel", "acrylic", "mixed media", "collage", "sculpture", "CGI"],
      },
      reference: {
        label: "Artist Reference",
        options: ["in the style of Greg Rutkowski", "by Artgerm", "by Alphonse Mucha", "by Studio Ghibli", "by Wes Anderson", "by Roger Deakins", "by Annie Leibovitz", "by Peter Lindbergh", "by Helmut Newton"],
      },
    },
  },
  mood: {
    label: "Mood & Tone",
    icon: "Heart",
    groups: {
      atmosphere: {
        label: "Atmosphere",
        options: ["ethereal", "dreamy", "mysterious", "ominous", "serene", "chaotic", "melancholic", "euphoric", "nostalgic", "futuristic", "dystopian", "utopian", "apocalyptic", "whimsical"],
      },
      time: {
        label: "Time of Day",
        options: ["dawn", "morning", "midday", "afternoon", "sunset", "dusk", "twilight", "night", "midnight"],
      },
      weather: {
        label: "Weather",
        options: ["sunny", "overcast", "cloudy", "rainy", "stormy", "foggy", "misty", "snowy", "windy", "hazy"],
      },
    },
  },
  color: {
    label: "Color",
    icon: "Droplets",
    groups: {
      palette: {
        label: "Palette",
        options: ["vibrant colors", "muted tones", "pastel colors", "monochrome", "black and white", "sepia", "warm tones", "cool tones", "earth tones", "neon colors", "complementary colors", "analogous colors"],
      },
      grading: {
        label: "Color Grading",
        options: ["cinematic color grading", "teal and orange", "cross-processed", "bleach bypass", "desaturated", "high saturation", "film grain", "vintage color"],
      },
    },
  },
  composition: {
    label: "Composition",
    icon: "LayoutGrid",
    groups: {
      framing: {
        label: "Framing",
        options: ["rule of thirds", "centered composition", "symmetrical", "asymmetrical", "leading lines", "framing within frame", "negative space", "golden ratio", "diagonal composition"],
      },
      perspective: {
        label: "Perspective",
        options: ["one-point perspective", "two-point perspective", "isometric", "forced perspective", "aerial perspective", "flat lay"],
      },
    },
  },
  quality: {
    label: "Quality",
    icon: "Sparkles",
    groups: {
      detail: {
        label: "Detail",
        options: ["highly detailed", "ultra detailed", "intricate details", "fine details", "8K", "4K UHD", "high resolution", "photographic quality"],
      },
      render: {
        label: "Render",
        options: ["octane render", "unreal engine 5", "ray tracing", "global illumination", "subsurface scattering", "physically based rendering", "V-Ray"],
      },
      platform: {
        label: "Platform",
        options: ["trending on artstation", "featured on behance", "award winning", "national geographic", "vogue cover"],
      },
    },
  },
} as const;

export type PromptCategory = keyof typeof PROMPT_TREE;

export const promptBuilderNode: NodeDef = {
  id: "prompt-builder",
  label: "Prompt Builder",
  description: "Build structured prompts from categories",
  category: "utility",
  icon: "BookOpen",
  inputs: {},
  outputs: {
    text: { type: "text", label: "Prompt" },
  },
  params: {
    selections: {
      type: "string",
      label: "Selections (JSON)",
      default: "{}",
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 340,
};
