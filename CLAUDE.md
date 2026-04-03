# AIUI — Claude Code Context

## What this is

AIUI is an open-source alternative to Figma Weave (weave.figma.com).
Node-based AI creative workflow builder. Self-hostable. Built by Megasupersoft Ltd.

## Architecture

### packages/nodes
Framework-agnostic TypeScript. Defines every node type via the `NodeDef` interface.
The `NodeDef` is the single source of truth — it drives the canvas renderer,
the param panel, the execution router, and App Mode.

**To add a new node:** implement `NodeDef` in the appropriate category folder,
register it in `registry.ts`. That's it.

### packages/canvas
React components only. Depends on `@aiui/nodes`. No business logic.
- `AIUINode` — xyflow custom node renderer
- `NodePicker` — left sidebar
- `ParamPanel` — right sidebar, renders params from `NodeDef.params`
- `THEME` — single design token source

### apps/web
Next.js 14 app router. The canvas page wires together `@aiui/canvas` components.
State: xyflow nodes/edges + selected node id. No external state library needed yet.

### server
FastAPI. Three routers: execute, models, workflows.
Executor pattern: each backend (fal, local, comfyui, openai) is a class implementing `BaseExecutor`.
The compiler does topological sort + input resolution before execution.

## Key constraints

- KISS. Prefer simple over clever.
- The `NodeDef` interface must not be broken — it's the contract between all layers.
- The server never imports React. The canvas package never imports fastapi.
- Adding a new executor backend: implement `BaseExecutor`, add to `EXECUTOR_MAP` in `execute.py`.
- Node definitions own the ComfyUI `expand()` logic — the server compiler calls it, not the other way around.

## Environment

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- ComfyUI (optional): http://localhost:8188 (or skeletor)

## Current state

v0.1 scaffold. Working: canvas UI, node picker, param panel, fal.ai executor (txt2img, upscale, remove-bg), local executor (text/number/image pass-through).

Not yet implemented: ComfyUI executor, WebSocket progress, App Mode, workflow gallery, video nodes.
