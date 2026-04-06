import { NodeDef } from "./types";
import { textInputNode } from "./nodes/utility/text-input";
import { numberInputNode } from "./nodes/utility/number-input";
import { imageInputNode } from "./nodes/utility/image-input";
import { videoInputNode } from "./nodes/utility/video-input";
import { audioInputNode } from "./nodes/utility/audio-input";
import { imageOutputNode } from "./nodes/utility/image-output";
import { videoOutputNode } from "./nodes/utility/video-output";
import { audioOutputNode } from "./nodes/utility/audio-output";
import { imageDescriberNode } from "./nodes/utility/image-describer";
import { promptBuilderNode } from "./nodes/utility/prompt-builder";
import { txt2imgNode } from "./nodes/generate/txt2img";
import { imageGenerator01Node } from "./nodes/generate/image-generator-01";
import { img2imgNode } from "./nodes/generate/img2img";
import { inpaintNode } from "./nodes/generate/inpaint";
import { txt2vidNode } from "./nodes/generate/txt2vid";
import { img2vidNode } from "./nodes/generate/img2vid";
import { vid2vidNode } from "./nodes/generate/vid2vid";
import { vidAudioNode } from "./nodes/generate/vid-audio";
import { ttsNode } from "./nodes/generate/tts";
import { musicNode } from "./nodes/generate/music";
import { generate3dNode } from "./nodes/generate/generate3d";
import { voiceCloneNode } from "./nodes/generate/voice-clone";
import { upscaleNode } from "./nodes/process/upscale";
import { removeBgNode } from "./nodes/process/remove-bg";
import { blurNode } from "./nodes/process/blur";

const nodes: NodeDef[] = [
  // Utility
  textInputNode,
  numberInputNode,
  imageInputNode,
  videoInputNode,
  audioInputNode,
  imageOutputNode,
  videoOutputNode,
  audioOutputNode,
  imageDescriberNode,
  promptBuilderNode,
  // Generate — Image
  imageGenerator01Node,
  txt2imgNode,
  img2imgNode,
  inpaintNode,
  // Generate — Video
  txt2vidNode,
  img2vidNode,
  vid2vidNode,
  vidAudioNode,
  // Generate — Audio
  ttsNode,
  musicNode,
  voiceCloneNode,
  // Generate — 3D
  generate3dNode,
  // Process
  upscaleNode,
  removeBgNode,
  blurNode,
];

export const NODE_REGISTRY = new Map<string, NodeDef>(
  nodes.map((n) => [n.id, n])
);

export function getNode(id: string): NodeDef {
  const node = NODE_REGISTRY.get(id);
  if (!node) throw new Error(`Unknown node type: ${id}`);
  return node;
}

export function getNodesByCategory() {
  const byCategory = new Map<string, NodeDef[]>();
  for (const node of NODE_REGISTRY.values()) {
    const list = byCategory.get(node.category) ?? [];
    list.push(node);
    byCategory.set(node.category, list);
  }
  return byCategory;
}

export * from "./types";
