"use client";

import React, { useEffect, useRef } from "react";
import { THEME } from "@aiui/canvas";
import { getNode } from "@aiui/nodes";
import * as Icons from "lucide-react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string;
  params: Record<string, any>;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
}

export function NodeContextMenu({
  x, y, nodeId, nodeType, params, onClose, onDelete, onDuplicate,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const def = getNode(nodeType);
  const hasComfyui = !!def.backends?.comfyui;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const menuWidth = 200;
  const left = Math.min(x, window.innerWidth - menuWidth - 20);
  const top = Math.min(y, window.innerHeight - 300);

  const handleViewGraph = async () => {
    onClose();
    try {
      const res = await fetch("/comfyui/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_type: nodeType, params: params || {}, inputs: {} }),
      });
      const json = await res.json();
      const popup = window.open("", "_blank", "width=720,height=600,scrollbars=yes");
      if (popup) {
        const escaped = JSON.stringify(json.error || json.prompt, null, 2).replace(/&/g, "&amp;").replace(/</g, "&lt;");
        popup.document.write(`<!DOCTYPE html><html><head><title>ComfyUI Graph — ${nodeType}</title>
<style>body{margin:0;background:#1a1a2e;color:#e0e0e0;font-family:monospace;font-size:13px}
pre{margin:0;padding:16px;white-space:pre-wrap;word-wrap:break-word}
.toolbar{padding:8px 16px;background:#16213e;border-bottom:1px solid #333;display:flex;gap:8px;align-items:center}
button{background:#2563eb;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:12px}
button:hover{background:#1d4ed8}
h3{margin:0;font-size:14px;font-weight:600;color:#60a5fa}</style></head><body>
<div class="toolbar"><h3>${nodeType}</h3>
<button onclick="navigator.clipboard.writeText(document.getElementById('json').textContent)">Copy JSON</button></div>
<pre id="json">${escaped}</pre></body></html>`);
        popup.document.close();
      }
    } catch (err) {
      console.error("Failed to fetch graph:", err);
    }
  };

  const items: { icon: any; label: string; onClick: () => void; danger?: boolean; separator?: boolean }[] = [];

  if (hasComfyui) {
    items.push({
      icon: Icons.Braces,
      label: "View ComfyUI Graph",
      onClick: handleViewGraph,
    });
    items.push({
      icon: Icons.ExternalLink,
      label: "Open in ComfyUI",
      onClick: () => {
        onClose();
        const device = params?._device || "";
        const workflow = def.comfyuiWorkflow || "";
        const url = `/comfyui/ui?instance=${encodeURIComponent(device)}&workflow=${encodeURIComponent(workflow)}`;
        window.open(url, "_blank");
      },
    });
  }

  items.push({
    icon: Icons.Copy,
    label: "Duplicate",
    separator: items.length > 0,
    onClick: () => { onDuplicate(nodeId); onClose(); },
  });

  items.push({
    icon: Icons.Trash2,
    label: "Delete",
    danger: true,
    onClick: () => { onDelete(nodeId); onClose(); },
  });

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left,
        top,
        width: menuWidth,
        background: THEME.panelBg,
        border: `1px solid ${THEME.panelBorder}`,
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: THEME.fontSans,
        zIndex: 1000,
        padding: "4px 0",
        overflow: "hidden",
      }}
    >
      {items.map((item, i) => {
        const ItemIcon = item.icon;
        return (
          <React.Fragment key={i}>
            {item.separator && (
              <div style={{ height: 1, background: THEME.panelBorder, margin: "4px 8px" }} />
            )}
            <button
              onClick={item.onClick}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderRadius: 0,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                color: item.danger ? "#f43f5e" : THEME.textPrimary,
                fontSize: 13,
                textAlign: "left",
                fontFamily: THEME.fontSans,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = THEME.inputBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <ItemIcon size={14} style={{ flexShrink: 0 }} />
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
