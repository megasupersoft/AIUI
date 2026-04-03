"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AIUINode, NodePicker, ParamPanel, THEME, setThemeMode } from "@aiui/canvas";
import type { ThemeMode } from "@aiui/canvas";
import { getNode, SOCKET_COLORS, type SocketType } from "@aiui/nodes";
import { Toolbar } from "../components/Toolbar";
import { LogPanel, LogEntry } from "../components/LogPanel";
import { ContextMenu } from "../components/ContextMenu";
import { ResizeHandle } from "../components/ResizeHandle";

const nodeTypes = { aiuiNode: AIUINode };

const INITIAL_NODES: Node[] = [
  {
    id: "1",
    type: "aiuiNode",
    position: { x: 80, y: 200 },
    data: { nodeType: "text-input", params: { value: "A cyberpunk city at night, neon lights, rain" } },
  },
  {
    id: "2",
    type: "aiuiNode",
    position: { x: 440, y: 100 },
    data: { nodeType: "txt2img", params: { model: "v1-5-pruned-emaonly.safetensors", width: 512, height: 512, steps: 20, guidance: 7.0, seed: -1 } },
  },
  {
    id: "3",
    type: "aiuiNode",
    position: { x: 840, y: 200 },
    data: { nodeType: "image-output", params: {} },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1-2", source: "1", sourceHandle: "text", target: "2", targetHandle: "prompt", type: "default", style: { stroke: SOCKET_COLORS.text, strokeWidth: 2 } },
  { id: "e2-3", source: "2", sourceHandle: "image", target: "3", targetHandle: "image", type: "default", style: { stroke: SOCKET_COLORS.image, strokeWidth: 2 } },
];

let logIdCounter = 0;
function makeLog(type: LogEntry["type"], message: string, extra?: Partial<LogEntry>): LogEntry {
  return { id: String(++logIdCounter), timestamp: Date.now(), type, message, ...extra };
}

// Wrap in provider so we can use useReactFlow
export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function CanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsOpen, setLogsOpen] = useState(true);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    setThemeMode("light");
    return "light";
  });
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number;
    pendingConnection?: { nodeId: string; handleId: string; handleType: "source" | "target" };
  } | null>(null);
  const [isCutting, setIsCutting] = useState(false);
  const [cutLine, setCutLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [devices, setDevices] = useState<{ id: string; label: string; gpu: string; name: string; vramFree: number }[]>([]);
  const [checkpointsByType, setCheckpointsByType] = useState<Record<string, { value: string; label: string }[]>>({});
  const [leftPanelWidth, setLeftPanelWidth] = useState(240);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [logPanelHeight, setLogPanelHeight] = useState(220);
  const nodeIdCounter = useRef(100);

  // Set initial theme CSS vars
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--controls-bg", THEME.nodeBg);
    root.style.setProperty("--controls-border", THEME.nodeBorder);
    root.style.setProperty("--controls-text", THEME.textPrimary);
    root.style.setProperty("--controls-hover", THEME.inputBg);
  }, []);

  // Fetch available GPU devices and checkpoints on mount
  useEffect(() => {
    fetch("http://localhost:8000/devices")
      .then((r) => r.json())
      .then((data) => {
        if (data.devices) {
          setDevices(data.devices.map((d: any) => ({ id: d.id, label: d.label, gpu: d.gpu, name: d.name, vramFree: d.vramFree })));
        }
      })
      .catch(() => {});
    // Fetch models per node type
    const nodeTypes = ["txt2img", "img2img", "txt2vid", "img2vid", "vid2vid", "vid-audio"];
    Promise.all(
      nodeTypes.map((nt) =>
        fetch(`http://localhost:8000/models/checkpoints?node_type=${nt}`)
          .then((r) => r.json())
          .then((data) => ({ type: nt, models: data.checkpoints || [] }))
          .catch(() => ({ type: nt, models: [] }))
      )
    ).then((results) => {
      const byType: Record<string, { value: string; label: string }[]> = {};
      for (const r of results) {
        byType[r.type] = r.models;
      }
      setCheckpointsByType(byType);
    });
  }, []);
  const reactFlowInstance = useReactFlow();

  // ── Shake-to-disconnect: track rapid direction changes while dragging ──
  const shakeRef = useRef<{ positions: { x: number; t: number }[]; nodeId: string | null }>({ positions: [], nodeId: null });

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Detect shake on position changes
    for (const change of changes) {
      if (change.type === "position" && change.dragging && change.position) {
        const now = Date.now();
        const shake = shakeRef.current;

        if (shake.nodeId !== change.id) {
          shake.nodeId = change.id;
          shake.positions = [];
        }

        shake.positions.push({ x: change.position.x, t: now });
        // Keep last 500ms of positions
        shake.positions = shake.positions.filter((p) => now - p.t < 500);

        if (shake.positions.length >= 6) {
          // Count direction reversals
          let reversals = 0;
          for (let i = 2; i < shake.positions.length; i++) {
            const dx1 = shake.positions[i - 1].x - shake.positions[i - 2].x;
            const dx2 = shake.positions[i].x - shake.positions[i - 1].x;
            if ((dx1 > 0 && dx2 < 0) || (dx1 < 0 && dx2 > 0)) {
              reversals++;
            }
          }
          if (reversals >= 4) {
            // Disconnect all edges from this node
            setEdges((eds) => eds.filter((e) => e.source !== change.id && e.target !== change.id));
            shake.positions = [];
            shake.nodeId = null;
          }
        }
      }
      if (change.type === "position" && !change.dragging) {
        shakeRef.current = { positions: [], nodeId: null };
      }
    }
  }, [onNodesChange, setEdges]);

  // ── C+drag wire cutting ──
  const cutStartRef = useRef<{ x: number; y: number } | null>(null);
  const cKeyDown = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        if (!e.metaKey && !e.ctrlKey) { // don't interfere with Cmd+C
          cKeyDown.current = true;
          setIsCutting(true);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        cKeyDown.current = false;
        setIsCutting(false);
        setCutLine(null);
        cutStartRef.current = null;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const getRelPos = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCutMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cKeyDown.current) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getRelPos(e);
    cutStartRef.current = { x: e.clientX, y: e.clientY }; // keep clientX/Y for intersection test
    setCutLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  }, [getRelPos]);

  const handleCutMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cKeyDown.current || !cutStartRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startRel = { x: cutStartRef.current.x - rect.left, y: cutStartRef.current.y - rect.top };
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCutLine({ x1: startRel.x, y1: startRel.y, x2: pos.x, y2: pos.y });
  }, []);

  const handleCutMouseUp = useCallback((e: React.MouseEvent) => {
    if (!cutStartRef.current || !cKeyDown.current) {
      cutStartRef.current = null;
      setCutLine(null);
      return;
    }

    const x1 = cutStartRef.current.x;
    const y1 = cutStartRef.current.y;
    const x2 = e.clientX;
    const y2 = e.clientY;

    // Find all edge SVG paths and test intersection
    const edgeElements = document.querySelectorAll(".react-flow__edge-path");
    const edgesToRemove = new Set<string>();

    edgeElements.forEach((el) => {
      const pathEl = el as SVGPathElement;
      const edgeEl = pathEl.closest(".react-flow__edge");
      if (!edgeEl) return;

      const edgeId = edgeEl.getAttribute("data-id");
      if (!edgeId) return;

      // Sample points along the edge path and test if cut line crosses
      const totalLen = pathEl.getTotalLength();
      const samples = Math.max(20, Math.ceil(totalLen / 10));

      for (let i = 0; i < samples - 1; i++) {
        const p1 = pathEl.getPointAtLength((i / samples) * totalLen);
        const p2 = pathEl.getPointAtLength(((i + 1) / samples) * totalLen);

        // Convert SVG points to screen coordinates
        const svg = pathEl.ownerSVGElement;
        if (!svg) continue;
        const ctm = svg.getScreenCTM();
        if (!ctm) continue;

        const sx1 = p1.x * ctm.a + ctm.e;
        const sy1 = p1.y * ctm.d + ctm.f;
        const sx2 = p2.x * ctm.a + ctm.e;
        const sy2 = p2.y * ctm.d + ctm.f;

        if (lineSegmentsIntersect(x1, y1, x2, y2, sx1, sy1, sx2, sy2)) {
          edgesToRemove.add(edgeId);
          break;
        }
      }
    });

    if (edgesToRemove.size > 0) {
      setEdges((eds) => eds.filter((e) => !edgesToRemove.has(e.id)));
    }

    cutStartRef.current = null;
    setCutLine(null);
  }, [setEdges]);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  const handleToggleTheme = useCallback(() => {
    const next = themeMode === "dark" ? "light" : "dark";
    const t = setThemeMode(next);
    setThemeModeState(next);
    document.body.style.background = t.canvasBg;
    document.body.style.color = t.textPrimary;
    document.body.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    // Update CSS variables for xyflow controls
    const root = document.documentElement;
    root.style.setProperty("--controls-bg", t.nodeBg);
    root.style.setProperty("--controls-border", t.nodeBorder);
    root.style.setProperty("--controls-text", t.textPrimary);
    root.style.setProperty("--controls-hover", t.inputBg);
  }, [themeMode]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const resolveLogs = useCallback((...types: LogEntry["type"][]) => {
    setLogs((prev) =>
      prev.map((l) => types.includes(l.type) && !l.resolved ? { ...l, resolved: true } : l)
    );
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Determine edge color from source socket type
      let strokeColor = "#706860";
      if (connection.source && connection.sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === connection.source);
        if (sourceNode) {
          const sourceDef = getNode((sourceNode.data as any).nodeType);
          const socket = sourceDef.outputs[connection.sourceHandle];
          if (socket) {
            strokeColor = SOCKET_COLORS[socket.type];
          }
        }
      }
      setEdges((eds) => addEdge({
        ...connection,
        type: "default",
        style: { stroke: strokeColor, strokeWidth: 2 },
      }, eds));
    },
    [setEdges, nodes]
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target || !sourceHandle || !targetHandle) return false;
    if (source === target) return false;

    // Get socket types
    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);
    if (!sourceNode || !targetNode) return false;

    const sourceDef = getNode((sourceNode.data as any).nodeType);
    const targetDef = getNode((targetNode.data as any).nodeType);

    const sourceSocket = sourceDef.outputs[sourceHandle];
    const targetSocket = targetDef.inputs[targetHandle];
    if (!sourceSocket || !targetSocket) return false;

    // Type compatibility: "any" matches anything, otherwise must match
    const srcType: SocketType = sourceSocket.type;
    const tgtType: SocketType = targetSocket.type;
    if (srcType !== "any" && tgtType !== "any" && srcType !== tgtType) return false;

    // Prevent multiple connections to the same input port
    const existingConnection = edges.find(
      (e) => e.target === target && e.targetHandle === targetHandle
    );
    if (existingConnection) return false;

    return true;
  }, [nodes, edges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  // Right-click context menu
  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  // Track connection drag source
  const pendingConnectionRef = useRef<{ nodeId: string; handleId: string; handleType: "source" | "target" } | null>(null);

  const onConnectStart = useCallback((_: any, params: { nodeId: string | null; handleId: string | null; handleType: "source" | "target" | null }) => {
    if (params.nodeId && params.handleId && params.handleType) {
      pendingConnectionRef.current = { nodeId: params.nodeId, handleId: params.handleId, handleType: params.handleType };
    }
  }, []);

  // When a connection drag ends on empty space, show filtered context menu
  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("react-flow__pane")) {
      const clientX = "clientX" in event ? event.clientX : event.changedTouches?.[0]?.clientX ?? 0;
      const clientY = "clientY" in event ? event.clientY : event.changedTouches?.[0]?.clientY ?? 0;

      // Pass the pending connection info to the context menu
      const pending = pendingConnectionRef.current;
      setContextMenu({ x: clientX, y: clientY, pendingConnection: pending ?? undefined });
    }
  }, []);

  const handleAddNode = useCallback(
    (nodeType: string, screenX?: number, screenY?: number) => {
      const id = String(++nodeIdCounter.current);
      const def = getNode(nodeType);
      const defaultParams: Record<string, any> = {};
      for (const [key, param] of Object.entries(def.params)) {
        defaultParams[key] = param.default;
      }

      // Convert screen position to flow position if available
      let position = { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 };
      if (screenX !== undefined && screenY !== undefined) {
        position = reactFlowInstance.screenToFlowPosition({ x: screenX, y: screenY });
      }

      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "aiuiNode",
          position,
          data: { nodeType, params: defaultParams },
        },
      ]);
      setSelectedNodeId(id);
      return id;
    },
    [setNodes, reactFlowInstance]
  );

  const handleContextMenuAdd = useCallback((nodeType: string) => {
    if (!contextMenu) return;

    const newNodeId = handleAddNode(nodeType, contextMenu.x, contextMenu.y);
    const pending = contextMenu.pendingConnection;

    // Auto-connect if we have a pending connection from a drag
    if (pending && newNodeId) {
      const newDef = getNode(nodeType);

      if (pending.handleType === "source") {
        // Dragged from an output — find a compatible input on the new node
        const sourceNode = nodes.find((n) => n.id === pending.nodeId);
        if (sourceNode) {
          const sourceDef = getNode((sourceNode.data as any).nodeType);
          const sourceSocket = sourceDef.outputs[pending.handleId];
          if (sourceSocket) {
            const targetEntry = Object.entries(newDef.inputs).find(
              ([, s]) => s.type === sourceSocket.type || s.type === "any" || sourceSocket.type === "any"
            );
            if (targetEntry) {
              const strokeColor = SOCKET_COLORS[sourceSocket.type];
              setEdges((eds) => addEdge({
                id: `e-${pending.nodeId}-${newNodeId}`,
                source: pending.nodeId,
                sourceHandle: pending.handleId,
                target: newNodeId,
                targetHandle: targetEntry[0],
                type: "default",
                style: { stroke: strokeColor, strokeWidth: 2 },
              }, eds));
            }
          }
        }
      } else {
        // Dragged from an input — find a compatible output on the new node
        const targetNode = nodes.find((n) => n.id === pending.nodeId);
        if (targetNode) {
          const targetDef = getNode((targetNode.data as any).nodeType);
          const targetSocket = targetDef.inputs[pending.handleId];
          if (targetSocket) {
            const sourceEntry = Object.entries(newDef.outputs).find(
              ([, s]) => s.type === targetSocket.type || s.type === "any" || targetSocket.type === "any"
            );
            if (sourceEntry) {
              const strokeColor = SOCKET_COLORS[sourceEntry[1].type];
              setEdges((eds) => addEdge({
                id: `e-${newNodeId}-${pending.nodeId}`,
                source: newNodeId,
                sourceHandle: sourceEntry[0],
                target: pending.nodeId,
                targetHandle: pending.handleId,
                type: "default",
                style: { stroke: strokeColor, strokeWidth: 2 },
              }, eds));
            }
          }
        }
      }
    }

    pendingConnectionRef.current = null;
    setContextMenu(null);
  }, [contextMenu, handleAddNode, nodes, setEdges]);

  const handleParamChange = useCallback(
    (nodeId: string, key: string, value: any) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, params: { ...(n.data as any).params, [key]: value } } }
            : n
        )
      );
    },
    [setNodes]
  );

  // ── File drop handler ──
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    const dropPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    let offsetY = 0;

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const pos = { x: dropPos.x, y: dropPos.y + offsetY };

      if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"].includes(ext)) {
        // Upload image and create Image Input node
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch("http://localhost:8000/upload/file", { method: "POST", body: formData });
          const data = await res.json();
          if (data.type === "image" && data.filename) {
            const id = String(++nodeIdCounter.current);
            setNodes((nds) => [...nds, {
              id, type: "aiuiNode", position: pos,
              data: { nodeType: "image-input", params: { image: data.filename } },
            }]);
            offsetY += 200;
          }
        } catch {}
      } else if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
        // Create a placeholder video node
        const id = String(++nodeIdCounter.current);
        setNodes((nds) => [...nds, {
          id, type: "aiuiNode", position: pos,
          data: { nodeType: "image-input", params: { image: null } },
        }]);
        offsetY += 200;
      } else if (["txt", "md", "markdown", "text", "csv", "json", "yaml", "yml"].includes(ext)) {
        // Read text content and create Text node
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch("http://localhost:8000/upload/file", { method: "POST", body: formData });
          const data = await res.json();
          if (data.type === "text" && data.content) {
            const id = String(++nodeIdCounter.current);
            setNodes((nds) => [...nds, {
              id, type: "aiuiNode", position: pos,
              data: { nodeType: "text-input", params: { value: data.content } },
            }]);
            offsetY += 200;
          }
        } catch {}
      }
    }
  }, [reactFlowInstance, setNodes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set false if leaving the container (not entering a child)
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false);
    }
  }, []);

  const executeGraph = useCallback(async (fromNodeId?: string) => {
    setIsRunning(true);
    setLogsOpen(true);

    const graph = {
      id: "canvas",
      name: "Untitled",
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.data as any).nodeType,
        position: n.position,
        params: (n.data as any).params,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle ?? "",
        target: e.target,
        targetHandle: e.targetHandle ?? "",
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLog(makeLog("info", fromNodeId
      ? `Executing from node ${fromNodeId}...`
      : "Executing full workflow..."
    ));

    try {
      const res = await fetch("http://localhost:8000/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, fromNodeId }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try { handleSSEEvent(eventType, JSON.parse(line.slice(6))); } catch {}
            eventType = "";
          }
        }
      }
    } catch (err: any) {
      addLog(makeLog("error", `Execution failed: ${err.message}`));
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isRunning: false, hasError: true } })));
    } finally {
      setIsRunning(false);
    }
  }, [nodes, edges, setNodes, addLog]);

  const handleRunNode = useCallback((nodeId: string) => {
    executeGraph(nodeId);
  }, [executeGraph]);

  // Inject callbacks into node data
  const nodesWithCallbacks = useMemo(() =>
    nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onParamChange: handleParamChange,
        onRunNode: handleRunNode,
        nodeId: n.id,
        devices,
        checkpoints: checkpointsByType[(n.data as any).nodeType] || [],
        _theme: themeMode,
      },
    })),
    [nodes, handleParamChange, handleRunNode, devices, checkpointsByType, themeMode]
  );

  const handleSSEEvent = useCallback((event: string, data: any) => {
    switch (event) {
      case "start":
        addLog(makeLog("start", `Pipeline started (${data.nodeCount} nodes)`));
        setNodes((nds) => nds.map((n) =>
          data.nodeIds.includes(n.id) ? { ...n, data: { ...n.data, isRunning: true, hasError: false } } : n
        ));
        break;
      case "info":
        addLog(makeLog("info", data.message));
        break;
      case "node_start":
        resolveLogs("node_start");
        addLog(makeLog("node_start", `${data.nodeType} [${data.nodeId}]`, {
          nodeId: data.nodeId, nodeType: data.nodeType,
          detail: data.detail || `backend: ${data.backend}`,
        }));
        break;
      case "node_complete":
        resolveLogs("node_start", "comfyui_queued", "comfyui_start", "comfyui_executing");
        addLog(makeLog("node_complete", `${data.nodeType} [${data.nodeId}] complete`, {
          nodeId: data.nodeId, nodeType: data.nodeType, elapsed: data.elapsed,
          detail: data.outputSummary
            ? Object.entries(data.outputSummary).map(([k,v]) => `${k}=${typeof v === 'string' ? v.slice(0,60) : v}`).join(', ')
            : undefined,
        }));
        setNodes((nds) => nds.map((n) =>
          n.id === data.nodeId ? { ...n, data: { ...n.data, isRunning: false, outputImages: data.outputs, progress: undefined, lastRunTime: data.elapsed } } : n
        ));
        break;
      case "node_error":
        resolveLogs("node_start", "comfyui_queued", "comfyui_start", "comfyui_executing");
        addLog(makeLog("node_error", `${data.nodeType} [${data.nodeId}] ERROR: ${data.error}`, {
          nodeId: data.nodeId, nodeType: data.nodeType, elapsed: data.elapsed,
        }));
        setNodes((nds) => nds.map((n) =>
          n.id === data.nodeId ? { ...n, data: { ...n.data, isRunning: false, hasError: true, progress: undefined } } : n
        ));
        break;
      case "done":
        resolveLogs("start", "node_start", "comfyui_queued", "comfyui_start", "comfyui_executing");
        addLog(makeLog("done", "Pipeline complete"));
        setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isRunning: false, progress: undefined } })));
        break;
      case "comfyui_queued":
        addLog(makeLog("comfyui_queued", "Queued on ComfyUI", { nodeId: data.nodeId }));
        break;
      case "comfyui_start":
        resolveLogs("comfyui_queued");
        addLog(makeLog("comfyui_start", data.message, { nodeId: data.nodeId }));
        break;
      case "comfyui_cached":
        addLog(makeLog("comfyui_cached", data.message, { nodeId: data.nodeId }));
        break;
      case "comfyui_executing":
        resolveLogs("comfyui_executing", "comfyui_start");
        addLog(makeLog("comfyui_executing", data.message, { nodeId: data.nodeId }));
        break;
      case "comfyui_progress":
        // Update log panel
        setLogs((prev) => {
          const lastIdx = prev.findLastIndex((l) => l.type === "comfyui_progress" && l.nodeId === data.nodeId);
          const entry = makeLog("comfyui_progress", data.message, {
            nodeId: data.nodeId, progress: { value: data.value, max: data.max, percent: data.percent },
          });
          if (lastIdx >= 0) { const u = [...prev]; entry.id = prev[lastIdx].id; u[lastIdx] = entry; return u; }
          return [...prev, entry];
        });
        // Update node with progress
        setNodes((nds) => nds.map((n) =>
          n.id === data.nodeId
            ? { ...n, data: { ...n.data, progress: { value: data.value, max: data.max, percent: data.percent, message: data.message } } }
            : n
        ));
        break;
      case "comfyui_executed":
        resolveLogs("comfyui_executing");
        addLog(makeLog("comfyui_executed", data.message, { nodeId: data.nodeId }));
        break;
      case "comfyui_success":
        resolveLogs("comfyui_start", "comfyui_executing");
        addLog(makeLog("comfyui_success", data.message, { nodeId: data.nodeId }));
        break;
    }
  }, [addLog, resolveLogs, setNodes]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: THEME.canvasBg }}>
      <Toolbar themeMode={themeMode} onToggleTheme={handleToggleTheme} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: leftPanelWidth, flexShrink: 0 }}>
          <NodePicker onAdd={handleAddNode} />
        </div>
        <ResizeHandle direction="horizontal" onResize={(d) => setLeftPanelWidth((w) => Math.max(160, Math.min(400, w + d)))} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            style={{ flex: 1, position: "relative" }}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <ReactFlow
              nodes={nodesWithCallbacks}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              isValidConnection={isValidConnection}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              nodeTypes={nodeTypes}
              fitView
              selectionOnDrag={!isCutting}
              panOnDrag={[1, 2]}
              selectionMode={"partial" as any}
              deleteKeyCode={["Backspace", "Delete"]}
              defaultEdgeOptions={{ type: "default" }}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color={THEME.canvasDot} />
              <Controls />
            </ReactFlow>

            {/* File drop overlay */}
            {isDraggingFile && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `${THEME.accent}10`,
                  border: `2px dashed ${THEME.accent}`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 998,
                  pointerEvents: "none",
                }}
              >
                <div style={{
                  color: THEME.accent,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: THEME.fontSans,
                  background: THEME.nodeBg,
                  padding: "12px 24px",
                  borderRadius: 8,
                }}>
                  Drop files to add nodes
                </div>
              </div>
            )}

            {/* Cut mode overlay — intercepts all mouse events when C is held */}
            {isCutting && (
              <div
                onMouseDown={handleCutMouseDown}
                onMouseMove={handleCutMouseMove}
                onMouseUp={handleCutMouseUp}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "crosshair",
                  zIndex: 999,
                }}
              >
                {cutLine && (
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                    }}
                  >
                    <line
                      x1={cutLine.x1}
                      y1={cutLine.y1}
                      x2={cutLine.x2}
                      y2={cutLine.y2}
                      stroke="#f43f5e"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                    />
                  </svg>
                )}
              </div>
            )}

            {/* Context menu */}
            {contextMenu && (
              <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                onAdd={handleContextMenuAdd}
                onClose={() => { setContextMenu(null); pendingConnectionRef.current = null; }}
                filterSocket={contextMenu.pendingConnection ? (() => {
                  const pc = contextMenu.pendingConnection!;
                  const node = nodes.find((n) => n.id === pc.nodeId);
                  if (!node) return undefined;
                  const def = getNode((node.data as any).nodeType);
                  const socket = pc.handleType === "source"
                    ? def.outputs[pc.handleId]
                    : def.inputs[pc.handleId];
                  if (!socket) return undefined;
                  return { type: socket.type, direction: pc.handleType };
                })() : undefined}
              />
            )}
          </div>

          {logsOpen && (
            <ResizeHandle direction="vertical" onResize={(d) => setLogPanelHeight((h) => Math.max(80, Math.min(500, h - d)))} />
          )}
          <LogPanel
            logs={logs}
            isOpen={logsOpen}
            onToggle={() => setLogsOpen((o) => !o)}
            onClear={() => setLogs([])}
            height={logPanelHeight}
          />
        </div>

        {selectedNode && (
          <>
            <ResizeHandle direction="horizontal" onResize={(d) => setRightPanelWidth((w) => Math.max(240, Math.min(500, w - d)))} />
            <div style={{ width: rightPanelWidth, flexShrink: 0 }}>
              <ParamPanel
                nodeId={selectedNode.id}
                nodeType={(selectedNode.data as any).nodeType}
                params={(selectedNode.data as any).params}
                onParamChange={handleParamChange}
                onRunNode={handleRunNode}
                isRunning={isRunning}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Line segment intersection test
function lineSegmentsIntersect(
  ax1: number, ay1: number, ax2: number, ay2: number,
  bx1: number, by1: number, bx2: number, by2: number,
): boolean {
  const dax = ax2 - ax1, day = ay2 - ay1;
  const dbx = bx2 - bx1, dby = by2 - by1;
  const denom = dax * dby - day * dbx;
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((bx1 - ax1) * dby - (by1 - ay1) * dbx) / denom;
  const u = ((bx1 - ax1) * day - (by1 - ay1) * dax) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
