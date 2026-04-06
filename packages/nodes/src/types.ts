// ─── Socket Types ────────────────────────────────────────────────────────────

export type SocketType =
  | "image"
  | "mask"
  | "text"
  | "number"
  | "latent"
  | "model"
  | "video"
  | "audio"
  | "any";

export const SOCKET_COLORS: Record<SocketType, string> = {
  image:  "#7aab8a",   // muted green
  mask:   "#b08060",   // muted orange
  text:   "#b09860",   // muted yellow
  number: "#7090b0",   // muted blue
  latent: "#a07078",   // muted rose
  model:  "#a09860",   // muted gold
  video:  "#6098a0",   // muted cyan
  audio:  "#c07898",   // muted pink
  any:    "#8a8a96",   // muted slate
};

// ─── Node Categories ─────────────────────────────────────────────────────────

export type NodeCategory =
  | "generate"
  | "process"
  | "utility"
  | "composite";

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  generate:  "#7c3aed",   // violet
  process:   "#0891b2",   // cyan
  utility:   "#374151",   // grey
  composite: "#be185d",   // pink
};

// ─── Param Definitions ───────────────────────────────────────────────────────

export type ParamType =
  | "string"
  | "prompt"      // multiline string with prompt-specific UI
  | "number"
  | "slider"
  | "select"
  | "boolean"
  | "image"       // image upload widget
  | "video"       // video upload widget
  | "audio"       // audio upload widget
  | "model_ref";  // references a model from the backend's model list

export interface ParamDef {
  type: ParamType;
  label: string;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  multiline?: boolean;
  placeholder?: string;
  /** If true, this param appears in App Mode when the node is marked exposed */
  appModeVisible?: boolean;
}

// ─── Socket Definitions ──────────────────────────────────────────────────────

export interface SocketDef {
  type: SocketType;
  label: string;
  optional?: boolean;
}

// ─── Backend Definitions ─────────────────────────────────────────────────────

export type BackendType = "comfyui" | "fal" | "replicate" | "openai" | "local";

export interface FalBackendDef {
  modelId: string;   // e.g. "fal-ai/flux/schnell"
  /** Map node param keys to fal API param keys. Identity if omitted. */
  paramMap?: Record<string, string>;
  /** Map node output socket keys to fal result keys */
  outputMap?: Record<string, string>;
}

export interface ReplicateBackendDef {
  modelId: string;   // e.g. "black-forest-labs/flux-schnell"
  paramMap?: Record<string, string>;
  outputMap?: Record<string, string>;
}

export interface ComfyUIBackendDef {
  /**
   * Returns a ComfyUI prompt fragment (partial node graph) for this node.
   * The compiler will stitch these fragments together.
   */
  expand: (params: Record<string, any>, inputIds: Record<string, string>) => ComfyUIGraph;
}

export interface ComfyUIGraph {
  nodes: Record<string, ComfyUINode>;
  /** The node ID within this fragment whose output is the primary image output */
  outputNodeId: string;
}

export interface ComfyUINode {
  class_type: string;
  inputs: Record<string, any>;
}

// ─── Node Definition ─────────────────────────────────────────────────────────

export interface NodeDef {
  /** Unique identifier, e.g. "txt2img" */
  id: string;
  label: string;
  description: string;
  category: NodeCategory;
  icon: string;   // lucide icon name

  inputs: Record<string, SocketDef>;
  outputs: Record<string, SocketDef>;

  /** Sidebar controls — not wirable sockets */
  params: Record<string, ParamDef>;

  backends: Partial<Record<BackendType, FalBackendDef | ReplicateBackendDef | ComfyUIBackendDef | true>>;
  defaultBackend: BackendType;

  /** Param keys that are exposed in App Mode by default */
  exposedParams?: string[];

  /** Node dimensions hint */
  width?: number;

  /** Name of the source ComfyUI workflow file (without .json), for the "Open in ComfyUI" button */
  comfyuiWorkflow?: string;
}

// ─── Graph Types (serialised canvas state) ───────────────────────────────────

export interface GraphNode {
  id: string;
  type: string;           // NodeDef.id
  position: { x: number; y: number };
  params: Record<string, any>;
  backend?: BackendType;  // override defaultBackend
  exposed?: boolean;      // App Mode: is this node's exposed params shown?
}

export interface GraphEdge {
  id: string;
  source: string;         // GraphNode.id
  sourceHandle: string;   // output socket key
  target: string;         // GraphNode.id
  targetHandle: string;   // input socket key
}

export interface Graph {
  id: string;
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  createdAt: string;
  updatedAt: string;
}

// ─── Execution Types ─────────────────────────────────────────────────────────

export interface ExecutionRequest {
  graph: Graph;
  /** If set, only execute from this node forward */
  fromNodeId?: string;
}

export interface ExecutionProgress {
  type: "progress" | "node_start" | "node_complete" | "node_error" | "done" | "error";
  nodeId?: string;
  progress?: number;     // 0–100
  imageUrl?: string;     // for node_complete with image output
  error?: string;
}
