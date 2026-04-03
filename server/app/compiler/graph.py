from typing import Any
from ..models.graph import Graph, GraphNode, GraphEdge

# Node type → default backend
DEFAULT_BACKENDS = {
    "text-input": "local",
    "number-input": "local",
    "image-input": "local",
    "image-output": "local",
    "video-output": "local",
    "audio-output": "local",
    "prompt-builder": "local",
    "blur": "local",
    "txt2img": "comfyui",
    "img2img": "comfyui",
    "inpaint": "comfyui",
    "txt2vid": "comfyui",
    "img2vid": "comfyui",
    "vid2vid": "comfyui",
    "vid-audio": "comfyui",
    "tts": "comfyui",
    "music": "comfyui",
    "voice-clone": "comfyui",
    "generate-3d": "comfyui",
    "upscale": "fal",
    "remove-bg": "fal",
    "image-describer": "openai",
}

def topological_sort(graph: Graph) -> list[GraphNode]:
    """Return nodes in execution order (sources first)."""
    node_map = {n.id: n for n in graph.nodes}
    in_degree = {n.id: 0 for n in graph.nodes}
    adjacency: dict[str, list[str]] = {n.id: [] for n in graph.nodes}

    for edge in graph.edges:
        adjacency[edge.source].append(edge.target)
        in_degree[edge.target] += 1

    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    result = []

    while queue:
        nid = queue.pop(0)
        result.append(node_map[nid])
        for neighbour in adjacency[nid]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    return result

def resolve_inputs(
    node: GraphNode,
    graph: Graph,
    node_outputs: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """For a given node, collect its wired input values from upstream outputs."""
    inputs: dict[str, Any] = {}
    for edge in graph.edges:
        if edge.target == node.id:
            upstream_outputs = node_outputs.get(edge.source, {})
            if edge.sourceHandle in upstream_outputs:
                inputs[edge.targetHandle] = upstream_outputs[edge.sourceHandle]
    return inputs

def get_backend(node: GraphNode) -> str:
    return node.backend or DEFAULT_BACKENDS.get(node.type, "fal")
