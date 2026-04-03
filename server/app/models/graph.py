from pydantic import BaseModel
from typing import Any, Optional

class GraphNode(BaseModel):
    id: str
    type: str
    position: dict[str, float]
    params: dict[str, Any]
    backend: Optional[str] = None
    exposed: Optional[bool] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    sourceHandle: str
    target: str
    targetHandle: str

class Graph(BaseModel):
    id: str
    name: str
    nodes: list[GraphNode]
    edges: list[GraphEdge]

class ExecutionRequest(BaseModel):
    graph: Graph
    fromNodeId: Optional[str] = None
