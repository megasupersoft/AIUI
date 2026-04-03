"use client";

import React, { useEffect, useRef } from "react";
import { THEME } from "@aiui/canvas";
import { Terminal, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2, Play, Cpu, Zap } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: number;
  type: "info" | "node_start" | "node_complete" | "node_error" | "start" | "done" | "error"
    | "comfyui_queued" | "comfyui_start" | "comfyui_cached" | "comfyui_executing"
    | "comfyui_progress" | "comfyui_executed" | "comfyui_success";
  nodeId?: string;
  nodeType?: string;
  message: string;
  detail?: string;
  elapsed?: number;
  progress?: { value: number; max: number; percent: number };
  resolved?: boolean; // spinner -> checkmark when step finishes
}

interface LogPanelProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  height?: number;
}

export function LogPanel({ logs, isOpen, onToggle, onClear, height = 220 }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const hasErrors = logs.some((l) => l.type === "node_error" || l.type === "error");
  const isRunning = logs.some((l) => l.type === "start") && !logs.some((l) => l.type === "done" || l.type === "error");

  const lastProgress = [...logs].reverse().find((l) => l.type === "comfyui_progress");

  return (
    <div
      style={{
        background: THEME.nodeBorder,
        borderTop: `1px solid ${THEME.panelBorder}`,
        flexShrink: 0,
        fontFamily: THEME.fontMono,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header bar */}
      <button
        onClick={onToggle}
        style={{
          height: 36,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          background: "transparent",
          border: "none",
          borderBottom: isOpen ? `1px solid ${THEME.panelBorder}` : "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        <Terminal size={14} color={THEME.textMuted} />
        <span style={{ color: THEME.textSecondary, fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>
          LOGS
        </span>
        {isRunning && (
          <Loader2 size={13} color="#3d7a4d" style={{ animation: "spin 1s linear infinite" }} />
        )}
        {hasErrors && !isRunning && (
          <AlertCircle size={13} color="#7a3a32" />
        )}
        {!isRunning && !hasErrors && logs.some((l) => l.type === "done") && (
          <CheckCircle2 size={13} color="#3d7a4d" />
        )}
        {isRunning && lastProgress?.progress && (
          <span style={{ color: "#3a5a7a", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {lastProgress.progress.value}/{lastProgress.progress.max} ({lastProgress.progress.percent}%)
          </span>
        )}
        <span style={{ color: THEME.textMuted, fontSize: 12 }}>
          {logs.length > 0 ? `${logs.length} entries` : ""}
        </span>
        <div style={{ flex: 1 }} />
        {logs.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{ color: THEME.textMuted, fontSize: 12, cursor: "pointer", padding: "2px 6px" }}
          >
            Clear
          </span>
        )}
        {isOpen ? <ChevronDown size={14} color={THEME.textMuted} /> : <ChevronUp size={14} color={THEME.textMuted} />}
      </button>

      {/* Log entries */}
      {isOpen && (
        <div
          ref={scrollRef}
          style={{
            height,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {logs.length === 0 && (
            <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>
              Press Run to execute the workflow
            </div>
          )}
          {logs.map((log) => (
            <LogLine key={log.id} entry={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  let icon: React.ReactNode = null;
  let color: string = THEME.textPrimary;
  const sz = 12;

  switch (entry.type) {
    case "node_start":
      icon = entry.resolved
        ? <CheckCircle2 size={sz} />
        : <Play size={sz} />;
      color = entry.resolved ? "#3d7a4d" : "#5a4a70";
      break;
    case "node_complete":
    case "done":
    case "comfyui_success":
    case "comfyui_executed":
      icon = <CheckCircle2 size={sz} />;
      color = "#3d7a4d";
      break;
    case "node_error":
    case "error":
      icon = <AlertCircle size={sz} />;
      color = "#7a3a32";
      break;
    case "start":
      icon = entry.resolved
        ? <CheckCircle2 size={sz} />
        : <Loader2 size={sz} style={{ animation: "spin 1s linear infinite" }} />;
      color = entry.resolved ? "#3d7a4d" : "#3d7a4d";
      break;
    case "comfyui_queued":
    case "comfyui_start":
      icon = entry.resolved
        ? <CheckCircle2 size={sz} />
        : <Cpu size={sz} />;
      color = entry.resolved ? "#3d7a4d" : "#6a6830";
      break;
    case "comfyui_cached":
      icon = <Zap size={sz} />;
      color = "#306870";
      break;
    case "comfyui_executing":
      icon = entry.resolved
        ? <CheckCircle2 size={sz} />
        : <Loader2 size={sz} style={{ animation: "spin 1s linear infinite" }} />;
      color = entry.resolved ? "#3d7a4d" : "#3a5a7a";
      break;
    case "comfyui_progress":
      icon = entry.progress && entry.progress.percent >= 100
        ? <CheckCircle2 size={sz} />
        : <Loader2 size={sz} style={{ animation: "spin 1s linear infinite" }} />;
      color = entry.progress && entry.progress.percent >= 100 ? "#3d7a4d" : "#3a5a7a";
      break;
    default:
      color = THEME.textSecondary;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "4px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        minHeight: 24,
      }}
    >
      <span style={{ color: THEME.textMuted, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
        {time}
      </span>
      <span style={{ color, flexShrink: 0, marginTop: 2, width: 14, display: "inline-flex" }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color }}>
          {entry.message}
          {entry.elapsed !== undefined && (
            <span style={{ color: THEME.textMuted, marginLeft: 8 }}>{entry.elapsed}s</span>
          )}
        </span>
        {entry.detail && (
          <span style={{ color: THEME.textMuted, marginLeft: 8 }}>{entry.detail}</span>
        )}
        {entry.progress && (
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 5,
                background: THEME.inputBg,
                borderRadius: 3,
                overflow: "hidden",
                maxWidth: 240,
              }}
            >
              <div
                style={{
                  width: `${entry.progress.percent}%`,
                  height: "100%",
                  background: entry.progress.percent >= 100
                    ? "#3d7a4d"
                    : THEME.accent,
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
