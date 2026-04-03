import os
import json
import time
import asyncio
import logging
import traceback
from fastapi import APIRouter

logger = logging.getLogger("aiui.execute")
from fastapi.responses import StreamingResponse
from typing import Any, AsyncGenerator
from ..models.graph import ExecutionRequest
from ..compiler.graph import topological_sort, resolve_inputs, get_backend
from ..executors.fal_executor import FalExecutor
from ..executors.local_executor import LocalExecutor
from ..executors.comfyui_executor import ComfyUIExecutor

router = APIRouter()

fal_executor = FalExecutor()
local_executor = LocalExecutor()
comfyui_executor = ComfyUIExecutor()

EXECUTOR_MAP = {
    "fal": fal_executor,
    "local": local_executor,
    "comfyui": comfyui_executor,
}


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _execute_stream(request: ExecutionRequest) -> AsyncGenerator[str, None]:
    graph = request.graph
    ordered = topological_sort(graph)

    # Log the full graph for debugging
    all_node_ids = [f"{n.id}:{n.type}" for n in graph.nodes]
    all_edge_ids = [f"{e.source}.{e.sourceHandle}->{e.target}.{e.targetHandle}" for e in graph.edges]
    yield _sse_event("info", {
        "message": f"Graph: {len(graph.nodes)} nodes [{', '.join(all_node_ids)}], {len(graph.edges)} edges"
    })

    if request.fromNodeId:
        # Walk UPSTREAM to find all dependencies (so inputs resolve)
        upstream = set()
        uqueue = [request.fromNodeId]
        while uqueue:
            nid = uqueue.pop(0)
            if nid not in upstream:
                upstream.add(nid)
                for edge in graph.edges:
                    if edge.target == nid:
                        uqueue.append(edge.source)
        # Walk DOWNSTREAM to find all dependents
        downstream = set()
        dqueue = [request.fromNodeId]
        while dqueue:
            nid = dqueue.pop(0)
            if nid not in downstream:
                downstream.add(nid)
                for edge in graph.edges:
                    if edge.source == nid:
                        dqueue.append(edge.target)
        # Execute both upstream + downstream in topological order
        execute_set = upstream | downstream
        ordered = [n for n in ordered if n.id in execute_set]
        yield _sse_event("info", {
            "message": f"Running from node {request.fromNodeId}: {len(ordered)} nodes [{', '.join(n.id+':'+n.type for n in ordered)}]"
        })

    yield _sse_event("start", {
        "nodeCount": len(ordered),
        "nodeIds": [n.id for n in ordered],
    })

    node_outputs: dict[str, dict[str, Any]] = {}
    all_outputs: dict[str, dict[str, Any]] = {}

    progress_queue: asyncio.Queue = asyncio.Queue()

    async def on_progress(event_type: str, data: dict[str, Any]):
        await progress_queue.put((event_type, data))

    for node in ordered:
        backend_key = get_backend(node)
        executor = EXECUTOR_MAP.get(backend_key)

        if executor is None:
            yield _sse_event("node_error", {
                "nodeId": node.id,
                "nodeType": node.type,
                "error": f"No executor for backend: {backend_key}",
            })
            continue

        inputs = resolve_inputs(node, graph, node_outputs)

        # Verbose: log what this node is receiving
        device = node.params.get("_device", "auto")
        model = node.params.get("model", "—")
        prompt_preview = ""
        if inputs.get("prompt"):
            prompt_preview = str(inputs["prompt"])[:80]
        elif node.params.get("prompt"):
            prompt_preview = str(node.params["prompt"])[:80]
        elif node.params.get("value"):
            prompt_preview = str(node.params["value"])[:80]

        logger.info(f"[{node.id}:{node.type}] backend={backend_key} model={model} device={device} inputs={list(inputs.keys())} params_keys={list(node.params.keys())}")

        detail_parts = [f"backend:{backend_key}"]
        if model != "—":
            detail_parts.append(f"model:{model}")
        if device != "auto":
            detail_parts.append(f"gpu:{device}")
        if prompt_preview:
            detail_parts.append(f'prompt:"{prompt_preview}"')
        if inputs:
            input_keys = list(inputs.keys())
            detail_parts.append(f"wired_inputs:{input_keys}")

        yield _sse_event("node_start", {
            "nodeId": node.id,
            "nodeType": node.type,
            "backend": backend_key,
            "detail": " | ".join(detail_parts),
            "model": model,
            "device": device,
        })

        t0 = time.time()

        exec_task = asyncio.create_task(
            executor.execute(node.type, node.params, inputs, on_progress=on_progress)
        )

        while not exec_task.done():
            try:
                event_type, event_data = await asyncio.wait_for(progress_queue.get(), timeout=0.5)
                yield _sse_event(event_type, {**event_data, "nodeId": node.id})
            except asyncio.TimeoutError:
                continue

        while not progress_queue.empty():
            event_type, event_data = progress_queue.get_nowait()
            yield _sse_event(event_type, {**event_data, "nodeId": node.id})

        elapsed = round(time.time() - t0, 2)

        try:
            outputs = exec_task.result()
            node_outputs[node.id] = outputs
            all_outputs[node.id] = outputs

            # Verbose: log outputs
            output_summary = {}
            for k, v in outputs.items():
                if isinstance(v, str) and len(v) > 100:
                    output_summary[k] = v[:100] + "..."
                else:
                    output_summary[k] = v

            logger.info(f"[{node.id}:{node.type}] COMPLETE in {elapsed}s outputs={output_summary}")

            yield _sse_event("node_complete", {
                "nodeId": node.id,
                "nodeType": node.type,
                "outputs": outputs,
                "outputSummary": output_summary,
                "elapsed": elapsed,
            })
        except Exception as e:
            error_msg = str(e)
            tb = traceback.format_exc()
            all_outputs[node.id] = {"error": error_msg}

            logger.error(f"[{node.id}:{node.type}] ERROR in {elapsed}s: {error_msg}")

            yield _sse_event("node_error", {
                "nodeId": node.id,
                "nodeType": node.type,
                "error": error_msg,
                "traceback": tb,
                "elapsed": elapsed,
            })

    yield _sse_event("done", {"outputs": all_outputs, "status": "done"})


@router.post("/execute")
async def execute_graph(request: ExecutionRequest):
    return StreamingResponse(
        _execute_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
