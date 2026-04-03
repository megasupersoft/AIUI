"use client";

import React, { useState, useEffect, useRef } from "react";
import { THEME } from "@aiui/canvas";
import { getNodesByCategory, getNode, CATEGORY_COLORS, SOCKET_COLORS, NodeDef, type SocketType } from "@aiui/nodes";
import * as Icons from "lucide-react";
import { Search } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onAdd: (nodeType: string) => void;
  onClose: () => void;
  /** If set, filter nodes to those compatible with this socket type/direction */
  filterSocket?: {
    type: SocketType;
    direction: "source" | "target"; // "source" means we dragged FROM an output, need nodes with matching inputs
  };
}

export function ContextMenu({ x, y, onAdd, onClose, filterSocket }: ContextMenuProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  const byCategory = getNodesByCategory();

  const isSocketCompatible = (node: NodeDef): boolean => {
    if (!filterSocket) return true;
    const { type, direction } = filterSocket;
    if (direction === "source") {
      // We dragged from an output — need a node with a compatible INPUT
      return Object.values(node.inputs).some(
        (s) => s.type === type || s.type === "any" || type === "any"
      );
    } else {
      // We dragged from an input — need a node with a compatible OUTPUT
      return Object.values(node.outputs).some(
        (s) => s.type === type || s.type === "any" || type === "any"
      );
    }
  };

  const filtered = (nodes: NodeDef[]) =>
    nodes.filter(
      (n) =>
        isSocketCompatible(n) && (
          !search ||
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.description.toLowerCase().includes(search.toLowerCase()) ||
          n.id.toLowerCase().includes(search.toLowerCase())
        )
    );

  // Position: keep menu within viewport
  const menuWidth = 240;
  const menuMaxHeight = 380;
  const left = Math.min(x, window.innerWidth - menuWidth - 20);
  const top = Math.min(y, window.innerHeight - menuMaxHeight - 20);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left,
        top,
        width: menuWidth,
        maxHeight: menuMaxHeight,
        background: THEME.panelBg,
        border: `1px solid ${THEME.panelBorder}`,
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        fontFamily: THEME.fontSans,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Search */}
      <div style={{ padding: "8px 8px 4px" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: THEME.textMuted,
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            style={{
              width: "100%",
              background: THEME.inputBg,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: 6,
              padding: "7px 8px 7px 28px",
              color: THEME.textPrimary,
              fontSize: 13,
              fontFamily: THEME.fontSans,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Node list */}
      <div style={{ overflowY: "auto", flex: 1, padding: "4px 6px 8px" }}>
        {Array.from(byCategory.entries()).map(([category, nodes]) => {
          const items = filtered(nodes);
          if (!items.length) return null;
          const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

          return (
            <div key={category} style={{ marginBottom: 8 }}>
              <div
                style={{
                  color,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "6px 6px 3px",
                }}
              >
                {category}
              </div>
              {items.map((node) => {
                const NodeIcon = (Icons as any)[node.icon] ?? Icons.Box;
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      onAdd(node.id);
                      onClose();
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderRadius: 6,
                      padding: "7px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      color: THEME.textPrimary,
                      fontSize: 13,
                      textAlign: "left",
                      transition: "background 0.1s",
                      fontFamily: THEME.fontSans,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = THEME.inputBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <NodeIcon size={14} color={color} style={{ flexShrink: 0 }} />
                    <div>
                      <div>{node.label}</div>
                      <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 1 }}>
                        {node.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
