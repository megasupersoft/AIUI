# Adding Workflows to AIUI

## Overview

Each AIUI node is a **parameterized ComfyUI workflow template**. The workflow IS the node.

## Current Approach (Code-Driven)

Workflow builders live in `server/app/executors/comfyui_workflows.py`. Each is a Python function that takes AIUI params and returns a ComfyUI prompt JSON with the params injected.

## Adding a New Workflow

### Step 1: Build and test in ComfyUI

- Wire up the workflow in the ComfyUI web UI
- Get it working end-to-end
- Export as JSON (API format, not visual workflow format)

### Step 2: Extract the ComfyUI prompt JSON

- Use the ComfyUI API format (the `prompt` dict that gets POSTed to `/prompt`)
- This is NOT the same as the visual workflow JSON — it's the flat node graph
- You can get this from the browser dev tools Network tab when you queue a prompt in ComfyUI

### Step 3: Create the AIUI node definition

- Create a new file in `packages/nodes/src/nodes/{category}/{name}.ts`
- Implement the `NodeDef` interface
- Pick which params to expose (model, steps, prompt, guidance, seed, etc.)
- Register it in `packages/nodes/src/registry.ts`

### Step 4: Create the workflow builder

- Add a Python function in `server/app/executors/comfyui_workflows.py`
- The function takes `(params: dict, inputs: dict)` and returns a ComfyUI prompt dict
- `params` = the node's own parameters (model, steps, etc.)
- `inputs` = wired inputs from upstream nodes (prompt text, images, etc.)
- Wire `inputs.get("prompt")` into the CLIPTextEncode text field, etc.
- Register the builder in `WORKFLOW_BUILDERS` dict at the bottom of the file

### Step 5: Register the backend

- Add the node type to `DEFAULT_BACKENDS` in `server/app/compiler/graph.py`
- Add any model filtering in `server/app/routers/models.py` (MODEL_CATEGORIES, FRIENDLY_NAMES)

### Step 6: Build and test

```bash
# Rebuild nodes package
npm run build:nodes

# Test workflow builder produces valid prompt
curl http://localhost:8000/test/workflows

# Test end-to-end execution
curl -s -N -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"graph": {"id":"t","name":"t","nodes":[...],"edges":[...]}}'
```

## Future Approach (Data-Driven)

Instead of writing Python code per workflow, we can make this template-driven:

```
server/workflows/
  sd15_txt2img.json    <- ComfyUI API format with {{prompt}}, {{model}} placeholders
  wan_t2v.json
  ltx_video.json
```

A generic builder would:
1. Load the JSON template
2. Replace `{{placeholder}}` tokens with AIUI param values
3. Return the filled prompt dict

This would make adding new workflows as simple as:
1. Export working workflow from ComfyUI
2. Replace values you want exposed with `{{placeholder}}` tokens
3. Drop the JSON file in `server/workflows/`
4. Add a node definition in `packages/nodes/`

No Python code changes needed per workflow.

## Key Files

- `packages/nodes/src/nodes/` — Node definitions (TypeScript)
- `packages/nodes/src/registry.ts` — Node registry
- `server/app/executors/comfyui_workflows.py` — Workflow builders (Python)
- `server/app/executors/comfyui_executor.py` — ComfyUI executor
- `server/app/compiler/graph.py` — Backend routing (DEFAULT_BACKENDS)
- `server/app/routers/models.py` — Model filtering and friendly names

## Working Models (as of April 2026)

### Image Generation
- Stable Diffusion 1.5 (all checkpoint variants) — confirmed working
- Flux Dev (fp8) — confirmed working, uses cfg=1.0, euler/simple scheduler

### Broken / Needs Fix
- Flux 2 — `DiffusionModelLoaderKJ` doesn't support Flux 2 architecture yet
- HiDream — no VAE downloaded on workers
- Wan 2.2 T2V/I2V — 48-channel latent mismatch with current ComfyUI nodes
- LTX 2.3 — untested, uses SamplerCustom workflow
