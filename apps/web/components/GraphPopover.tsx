"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { THEME } from "@aiui/canvas";
import * as Icons from "lucide-react";

interface GraphPopoverProps {
  nodeType: string;
  device?: string;
  onClose: () => void;
}

const MIN_W = 400;
const MIN_H = 300;
const SNAP_THRESHOLD = 20;
const SNAP_MARGIN = 8;

type SnapZone = "left" | "right" | "top" | "bottom" | "topleft" | "topright" | "bottomleft" | "bottomright" | "maximize" | null;

function getSnapZone(clientX: number, clientY: number): SnapZone {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const nearL = clientX < SNAP_THRESHOLD;
  const nearR = clientX > w - SNAP_THRESHOLD;
  const nearT = clientY < SNAP_THRESHOLD;
  const nearB = clientY > h - SNAP_THRESHOLD;

  if (nearT && nearL) return "topleft";
  if (nearT && nearR) return "topright";
  if (nearB && nearL) return "bottomleft";
  if (nearB && nearR) return "bottomright";
  if (nearT) return "maximize";
  if (nearL) return "left";
  if (nearR) return "right";
  if (nearB) return "bottom";
  return null;
}

function getSnapRect(zone: SnapZone): { x: number; y: number; w: number; h: number } | null {
  if (!zone) return null;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const m = SNAP_MARGIN;
  const half_w = Math.floor((W - m * 3) / 2);
  const half_h = Math.floor((H - m * 3) / 2);

  switch (zone) {
    case "left":        return { x: m, y: m, w: half_w, h: H - m * 2 };
    case "right":       return { x: W - half_w - m, y: m, w: half_w, h: H - m * 2 };
    case "top":         return { x: m, y: m, w: W - m * 2, h: half_h };
    case "bottom":      return { x: m, y: H - half_h - m, w: W - m * 2, h: half_h };
    case "topleft":     return { x: m, y: m, w: half_w, h: half_h };
    case "topright":    return { x: W - half_w - m, y: m, w: half_w, h: half_h };
    case "bottomleft":  return { x: m, y: H - half_h - m, w: half_w, h: half_h };
    case "bottomright": return { x: W - half_w - m, y: H - half_h - m, w: half_w, h: half_h };
    case "maximize":    return { x: m, y: m, w: W - m * 2, h: H - m * 2 };
    default:            return null;
  }
}

export function GraphPopover({ nodeType, device, onClose }: GraphPopoverProps) {
  // Initial centered position
  const initW = Math.min(1200, window.innerWidth * 0.9);
  const initH = Math.min(800, window.innerHeight * 0.85);
  const [pos, setPos] = useState({
    x: Math.floor((window.innerWidth - initW) / 2),
    y: Math.floor((window.innerHeight - initH) / 2),
    w: initW,
    h: initH,
  });

  const [snapPreview, setSnapPreview] = useState<SnapZone>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0, origH: 0, edge: "" });
  const preSnapRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Escape to close
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  // ── Drag ──
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  }, [pos.x, pos.y]);

  useEffect(() => {
    if (!isDragging) return;
    function onMove(e: MouseEvent) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos(p => ({ ...p, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }));
      setSnapPreview(getSnapZone(e.clientX, e.clientY));
    }
    function onUp(e: MouseEvent) {
      setIsDragging(false);
      const zone = getSnapZone(e.clientX, e.clientY);
      const rect = getSnapRect(zone);
      if (rect) {
        // Save pre-snap size for restore on double-click
        preSnapRef.current = { ...pos, x: dragRef.current.origX, y: dragRef.current.origY };
        setPos(rect);
      }
      setSnapPreview(null);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, pos]);

  // ── Resize ──
  const onResizeStart = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, origW: pos.w, origH: pos.h, edge };
  }, [pos]);

  useEffect(() => {
    if (!isResizing) return;
    function onMove(e: MouseEvent) {
      const { startX, startY, origX, origY, origW, origH, edge } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let nx = origX, ny = origY, nw = origW, nh = origH;

      if (edge.includes("r")) nw = Math.max(MIN_W, origW + dx);
      if (edge.includes("b")) nh = Math.max(MIN_H, origH + dy);
      if (edge.includes("l")) { nw = Math.max(MIN_W, origW - dx); nx = origX + origW - nw; }
      if (edge.includes("t")) { nh = Math.max(MIN_H, origH - dy); ny = origY + origH - nh; }

      setPos({ x: nx, y: ny, w: nw, h: nh });
    }
    function onUp() { setIsResizing(false); }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isResizing]);

  // Double-click title bar to toggle maximize
  const onDoubleClick = useCallback(() => {
    const m = SNAP_MARGIN;
    const maxRect = { x: m, y: m, w: window.innerWidth - m * 2, h: window.innerHeight - m * 2 };
    const isMaxed = pos.x === maxRect.x && pos.y === maxRect.y && pos.w === maxRect.w && pos.h === maxRect.h;
    if (isMaxed && preSnapRef.current) {
      setPos(preSnapRef.current);
      preSnapRef.current = null;
    } else {
      preSnapRef.current = { ...pos };
      setPos(maxRect);
    }
  }, [pos]);

  const src = `/comfyui/ui?instance=${encodeURIComponent(device || "")}`;
  const previewRect = getSnapRect(snapPreview);

  // Resize handle shared style
  const handle = (cursor: string, edge: string, style: React.CSSProperties): React.ReactElement => (
    <div
      key={edge}
      onMouseDown={(e) => onResizeStart(e, edge)}
      style={{ position: "absolute", zIndex: 2, cursor, ...style }}
    />
  );

  return (
    <>
      {/* Snap preview overlay */}
      {previewRect && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute",
            left: previewRect.x,
            top: previewRect.y,
            width: previewRect.w,
            height: previewRect.h,
            background: `${THEME.accent}15`,
            border: `2px solid ${THEME.accent}40`,
            borderRadius: 12,
            transition: "all 0.15s ease",
          }} />
        </div>
      )}

      {/* Window */}
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: pos.w,
          height: pos.h,
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          background: THEME.panelBg,
          border: `1px solid ${THEME.panelBorder}`,
          borderRadius: 10,
          boxShadow: "0 16px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Resize handles — edges */}
        {handle("ew-resize", "l", { left: -3, top: 8, bottom: 8, width: 6 })}
        {handle("ew-resize", "r", { right: -3, top: 8, bottom: 8, width: 6 })}
        {handle("ns-resize", "t", { top: -3, left: 8, right: 8, height: 6 })}
        {handle("ns-resize", "b", { bottom: -3, left: 8, right: 8, height: 6 })}
        {/* Resize handles — corners */}
        {handle("nwse-resize", "tl", { top: -4, left: -4, width: 12, height: 12 })}
        {handle("nesw-resize", "tr", { top: -4, right: -4, width: 12, height: 12 })}
        {handle("nesw-resize", "bl", { bottom: -4, left: -4, width: 12, height: 12 })}
        {handle("nwse-resize", "br", { bottom: -4, right: -4, width: 12, height: 12 })}

        {/* Title bar — draggable */}
        <div
          onMouseDown={onDragStart}
          onDoubleClick={onDoubleClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderBottom: `1px solid ${THEME.panelBorder}`,
            flexShrink: 0,
            cursor: "grab",
            userSelect: "none",
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

        {/* Drag/resize overlay — blocks iframe from stealing mouse events */}
        {(isDragging || isResizing) && (
          <div style={{ position: "absolute", inset: 0, zIndex: 3 }} />
        )}

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
    </>
  );
}
