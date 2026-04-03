"use client";

import React, { useCallback, useRef } from "react";
import { THEME } from "@aiui/canvas";

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  /** Which side the handle sits on — affects cursor and visual */
  side?: "left" | "right" | "top" | "bottom";
}

export function ResizeHandle({ direction, onResize, side }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastPos.current = direction === "horizontal" ? e.clientX : e.clientY;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const current = direction === "horizontal" ? ev.clientX : ev.clientY;
      const delta = current - lastPos.current;
      lastPos.current = current;
      onResize(delta);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [direction, onResize]);

  const isHorizontal = direction === "horizontal";

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "relative",
        width: isHorizontal ? 6 : "100%",
        height: isHorizontal ? "100%" : 6,
        cursor: isHorizontal ? "col-resize" : "row-resize",
        flexShrink: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Visible drag indicator */}
      <div
        style={{
          width: isHorizontal ? 2 : 32,
          height: isHorizontal ? 32 : 2,
          borderRadius: 1,
          background: THEME.nodeBorder,
          opacity: 0.6,
          transition: "opacity 0.15s",
        }}
      />
    </div>
  );
}
