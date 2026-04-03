# AIUI

Open-source, self-hostable alternative to Figma Weave. Node-based AI creative workflow builder.

**Powered by:** fal.ai · Replicate · OpenAI · ComfyUI

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- npm 7+ (workspaces)

### Install

```bash
npm install
cd server && pip install -r requirements.txt --break-system-packages
cp server/.env.example server/.env
# Add your FAL_KEY to server/.env
```

### Run

```bash
# Terminal 1 — Frontend
npm run dev:web

# Terminal 2 — Backend
npm run dev:server
```

Open http://localhost:3000

## Architecture

- `packages/nodes` — Node definitions (TypeScript, framework-agnostic)
- `packages/canvas` — React node editor components (@xyflow/react)
- `apps/web` — Next.js 14 app
- `server/` — FastAPI execution engine

## Adding a Node

1. Create `packages/nodes/src/nodes/{category}/{name}.ts`
2. Implement the `NodeDef` interface
3. Register in `packages/nodes/src/registry.ts`

## Roadmap

- [ ] App Mode (publish workflow as simplified UI)
- [ ] Workflow gallery
- [ ] ComfyUI executor
- [ ] WebSocket progress streaming
- [ ] Video generation nodes (Wan, Kling, Runway)
- [ ] Relight, depth extract, painter nodes
- [ ] LoRA and ControlNet support
