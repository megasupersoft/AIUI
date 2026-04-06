"use client";

import React, { useRef, useEffect } from "react";
import { THEME } from "@aiui/canvas";
import * as Icons from "lucide-react";

interface GraphPopoverProps {
  nodeType: string;
  device?: string;
  onClose: () => void;
}

export function GraphPopover({ nodeType, device, onClose }: GraphPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const src = `/comfyui/ui?instance=${encodeURIComponent(device || "")}`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        style={{
          width: "90%",
          height: "85%",
          maxWidth: 1200,
          maxHeight: 800,
          background: THEME.panelBg,
          border: `1px solid ${THEME.panelBorder}`,
          borderRadius: 12,
          boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderBottom: `1px solid ${THEME.panelBorder}`,
            flexShrink: 0,
          }}
        >
          <Icons.Workflow size={14} color={THEME.accent} />
          <span style={{
            color: THEME.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: THEME.fontSans,
          }}>
            ComfyUI — {nodeType}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => window.open(src, "_blank")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              background: "transparent",
              border: `1px solid ${THEME.nodeBorder}`,
              borderRadius: 6,
              color: THEME.textSecondary,
              fontSize: 11,
              fontFamily: THEME.fontSans,
              cursor: "pointer",
            }}
          >
            <Icons.ExternalLink size={11} />
            Open in tab
          </button>
          <button
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              padding: 4,
              background: "transparent",
              border: "none",
              color: THEME.textMuted,
              cursor: "pointer",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = THEME.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = THEME.textMuted; }}
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* ComfyUI iframe */}
        <iframe
          src={src}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            background: "#1a1a2e",
          }}
          title="ComfyUI"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
