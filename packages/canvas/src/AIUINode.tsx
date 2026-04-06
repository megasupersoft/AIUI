import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { getNode, SOCKET_COLORS, CATEGORY_COLORS, NodeDef } from "@aiui/nodes";
import { THEME } from "./theme";
import { PromptBuilderInline } from "./PromptBuilderInline";
import { ModelSelect } from "./ModelSelect";
import { DeviceSelect } from "./DeviceSelect";
import * as Icons from "lucide-react";

type AIUINodeData = {
  nodeType: string;
  params: Record<string, any>;
  outputImages?: Record<string, string>;
  isRunning?: boolean;
  hasError?: boolean;
  progress?: { value: number; max: number; percent: number; message?: string };
  lastRunTime?: number; // seconds
  devices?: { id: string; label: string; gpu: string; name: string; vramFree: number }[];
  checkpoints?: { value: string; label: string }[];
  onParamChange?: (nodeId: string, key: string, value: any) => void;
  onRunNode?: (nodeId: string) => void;
  nodeId?: string;
  [key: string]: unknown;
};

type AIUINodeType = Node<AIUINodeData, "aiuiNode">;

export const AIUINode = memo(({ id, data, selected }: { id: string; data: AIUINodeData; selected: boolean }) => {
  const def: NodeDef = getNode(data.nodeType);
  const Icon = (Icons as any)[def.icon] ?? Icons.Box;
  const categoryColor = CATEGORY_COLORS[def.category];

  const inputSockets = Object.entries(def.inputs);
  const outputSockets = Object.entries(def.outputs);

  const isTextInput = data.nodeType === "text-input";
  const isPromptBuilder = data.nodeType === "prompt-builder";
  const isImageDisplay = data.nodeType === "image-output" || data.nodeType === "image-input";
  const hasImageOutput = !!data.outputImages?.image;
  const inputImageSrc = data.nodeType === "image-input" && data.params?.image
    ? `/comfyui/view?filename=${encodeURIComponent(data.params.image)}&type=input`
    : null;

  // Can this node be "run"? Only nodes with a non-local backend
  const isRunnable = def.defaultBackend !== "local";

  // Live timer while running
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runStartRef = useRef<number>(0);

  useEffect(() => {
    if (data.isRunning) {
      runStartRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - runStartRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data.isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Does this node have a model selector param?
  const modelParam = def.params.model;
  const hasModelSelect = modelParam?.type === "select" && modelParam.options;

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (data.onParamChange) {
      data.onParamChange(id, "value", e.target.value);
    }
  }, [data.onParamChange, id]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (data.onParamChange) {
      data.onParamChange(id, "model", e.target.value);
    }
  }, [data.onParamChange, id]);

  const promptSelections = useMemo(() => {
    if (!isPromptBuilder) return {};
    try {
      return JSON.parse(data.params?.selections || "{}");
    } catch {
      return {};
    }
  }, [isPromptBuilder, data.params?.selections]);

  const handlePromptSelectionsChange = useCallback((sel: Record<string, Record<string, string[]>>) => {
    if (data.onParamChange) {
      data.onParamChange(id, "selections", JSON.stringify(sel));
    }
  }, [data.onParamChange, id]);

  const handleDeviceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (data.onParamChange) {
      data.onParamChange(id, "_device", e.target.value || undefined);
    }
  }, [data.onParamChange, id]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onRunNode) {
      data.onRunNode(id);
    }
  }, [data.onRunNode, id]);

  const cardMinHeight = isPromptBuilder ? 300 : isTextInput ? 120 : (hasImageOutput || inputImageSrc) ? 100 : 56;

  return (
    <div style={{ fontFamily: THEME.fontSans, position: "relative" }}>
      {/* ── Floating header above the card ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
          paddingLeft: 2,
        }}
      >
        <Icon size={14} color={THEME.textSecondary} style={{ flexShrink: 0 }} />
        <span
          style={{
            color: THEME.textPrimary,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {def.label}
        </span>
        {data.isRunning && (
          <>
            <Icons.Loader2
              size={12}
              color="#6b9e78"
              style={{ animation: "spin 1s linear infinite", flexShrink: 0 }}
            />
            <span style={{
              color: THEME.textMuted,
              fontSize: 11,
              fontFamily: THEME.fontMono,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}>
              {formatTime(elapsed)}
            </span>
          </>
        )}
        {!data.isRunning && isRunnable && data.lastRunTime !== undefined && (
          <span style={{
            color: THEME.textMuted,
            fontSize: 11,
            fontFamily: THEME.fontMono,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}>
            <Icons.Clock size={10} />
            {data.lastRunTime.toFixed(1)}s
          </span>
        )}
        <div style={{ flex: 1 }} />
        {def.backends?.comfyui && (
          <a
            href={`/comfyui/ui${def.comfyuiWorkflow ? `?workflow=${encodeURIComponent(def.comfyuiWorkflow)}` : ""}`}
            target="_blank"
            rel="noreferrer"
            title={def.comfyuiWorkflow ? `Open "${def.comfyuiWorkflow}" in ComfyUI` : "Open in ComfyUI"}
            className="nodrag"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              color: THEME.textMuted,
              fontSize: 10,
              fontFamily: THEME.fontSans,
              textDecoration: "none",
              opacity: 0.6,
              transition: "opacity 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
          >
            <Icons.Workflow size={11} />
          </a>
        )}
      </div>

      {/* ── Card body ── */}
      <div
        style={{
          position: "relative",
          background: THEME.nodeBg,
          border: "none",
          borderRadius: 12,
          minWidth: def.width ?? 280,
          minHeight: cardMinHeight,
        }}
      >
        {/* ── Input handles ── */}
        {inputSockets.map(([key, socket], i) => {
          const topPct = inputSockets.length === 1
            ? 50
            : 25 + (50 / Math.max(inputSockets.length - 1, 1)) * i;
          return (
            <HandleWithTooltip
              key={`in-${key}`}
              type="target"
              position={Position.Left}
              id={key}
              label={socket.label}
              socketType={socket.type}
              topPct={topPct}
              side="left"
            />
          );
        })}

        {/* ── Output handles ── */}
        {outputSockets.map(([key, socket], i) => {
          const topPct = outputSockets.length === 1
            ? 50
            : 25 + (50 / Math.max(outputSockets.length - 1, 1)) * i;
          return (
            <HandleWithTooltip
              key={`out-${key}`}
              type="source"
              position={Position.Right}
              id={key}
              label={socket.label}
              socketType={socket.type}
              topPct={topPct}
              side="right"
            />
          );
        })}

        {/* ── Content ── */}

        {isTextInput && (
          <div style={{ padding: 4 }}>
            <textarea
              value={data.params?.value ?? ""}
              onChange={handleTextChange}
              placeholder="Enter text..."
              className="nodrag nowheel"
              style={{
                width: "100%",
                minHeight: 110,
                background: "transparent",
                border: "none",
                borderRadius: 8,
                padding: "10px 12px",
                color: THEME.textPrimary,
                fontSize: 14,
                fontFamily: THEME.fontSans,
                lineHeight: 1.6,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {isPromptBuilder && (
          <PromptBuilderInline
            selections={promptSelections}
            onChange={handlePromptSelectionsChange}
          />
        )}

        {(hasImageOutput || inputImageSrc) && (
          <img
            src={hasImageOutput ? data.outputImages!.image : inputImageSrc!}
            alt="output"
            style={{
              width: "100%",
              display: "block",
              borderRadius: 11,
            }}
          />
        )}

        {/* Progress bar inside the card when running */}
        {data.isRunning && data.progress && (
          <div style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: THEME.inputBg,
                  borderRadius: 3,
                  overflow: "hidden",
                  border: `1px solid ${THEME.nodeBorder}`,
                }}
              >
                <div
                  style={{
                    width: `${data.progress.percent}%`,
                    height: "100%",
                    background: data.progress.percent >= 100 ? "#7aab8a" : THEME.accent,
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <span
                style={{
                  color: THEME.textSecondary,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: THEME.fontMono,
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {data.progress.value}/{data.progress.max}
              </span>
            </div>
            {data.progress.message && (
              <div style={{ color: THEME.textMuted, fontSize: 11, fontFamily: THEME.fontMono }}>
                {data.progress.message}
              </div>
            )}
          </div>
        )}

        {/* Empty card body for nodes without inline content */}
        {!isTextInput && !isPromptBuilder && !hasImageOutput && !inputImageSrc && !data.progress && (
          <div style={{ minHeight: cardMinHeight }} />
        )}

        {data.hasError && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#f43f5e",
            }}
          />
        )}
      </div>

      {/* ── Control bar: run | device | model ── */}
      {isRunnable && (
        <div style={{ display: "flex", alignItems: "center", marginTop: 6, gap: 4, flexWrap: "wrap" }}>
          {/* Run / Running */}
          {data.isRunning ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                background: `${THEME.accent}18`,
                border: `1px solid ${THEME.accent}40`,
                borderRadius: 8,
                color: THEME.accent,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: THEME.fontSans,
                letterSpacing: "0.03em",
                flexShrink: 0,
              }}
            >
              <Icons.Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
              Running...
            </div>
          ) : (
            <button
              onClick={handleRun}
              className="nodrag"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                background: `${THEME.accent}18`,
                border: `1px solid ${THEME.accent}40`,
                borderRadius: 8,
                color: THEME.accent,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: THEME.fontSans,
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
                letterSpacing: "0.03em",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${THEME.accent}30`;
                e.currentTarget.style.borderColor = THEME.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${THEME.accent}18`;
                e.currentTarget.style.borderColor = `${THEME.accent}40`;
              }}
            >
              <Icons.Play size={11} fill="currentColor" />
              Run
            </button>
          )}
          {/* Device / worker */}
          {data.devices && data.devices.length > 0 && (
            <DeviceSelect
              value={data.params?._device ?? ""}
              devices={data.devices}
              onChange={(v) => { if (data.onParamChange) data.onParamChange(id, "_device", v || undefined); }}
            />
          )}
          {/* Model */}
          {hasModelSelect && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <ModelSelect
                value={data.params?.model ?? modelParam!.default}
                options={data.checkpoints && data.checkpoints.length > 0 ? data.checkpoints : modelParam!.options!}
                onChange={(v) => { if (data.onParamChange) data.onParamChange(id, "model", v); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AIUINode.displayName = "AIUINode";

// ── Handle with hover tooltip ──

import type { SocketType } from "@aiui/nodes";

function HandleWithTooltip({
  type,
  position,
  id,
  label,
  socketType,
  topPct,
  side,
}: {
  type: "source" | "target";
  position: typeof Position.Left | typeof Position.Right;
  id: string;
  label: string;
  socketType: SocketType;
  topPct: number;
  side: "left" | "right";
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        [side]: -7,
        top: `${topPct}%`,
        transform: "translateY(-50%)",
        zIndex: 10,
      }}
    >
      <Handle
        type={type}
        position={position}
        id={id}
        style={{
          position: "relative",
          top: 0,
          left: 0,
          transform: "none",
          width: 14,
          height: 14,
          background: SOCKET_COLORS[socketType],
          border: `3px solid ${THEME.nodeBg}`,
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      />
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: THEME.nodeBg,
            border: `1px solid ${THEME.nodeBorder}`,
            borderRadius: 6,
            padding: "3px 8px",
            whiteSpace: "nowrap",
            fontSize: 11,
            fontFamily: THEME.fontSans,
            color: THEME.textPrimary,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            pointerEvents: "none",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: SOCKET_COLORS[socketType],
            flexShrink: 0,
          }} />
          <span>{label}</span>
          <span style={{ color: THEME.textMuted, fontSize: 10 }}>{socketType}</span>
        </div>
      )}
    </div>
  );
}

