import React, { useState } from "react";
import { getNodesByCategory, CATEGORY_COLORS, NodeDef } from "@aiui/nodes";
import { THEME } from "./theme";
import * as Icons from "lucide-react";
import { Search } from "lucide-react";

interface NodePickerProps {
  onAdd: (nodeType: string) => void;
}

export function NodePicker({ onAdd }: NodePickerProps) {
  const [search, setSearch] = useState("");
  const byCategory = getNodesByCategory();

  const filtered = (nodes: NodeDef[]) =>
    nodes.filter(
      (n) =>
        !search ||
        n.label.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div
      style={{
        width: "100%",
        background: THEME.panelBg,
        borderRight: `1px solid ${THEME.panelBorder}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: THEME.fontSans,
        height: "100%",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 12px 8px" }}>
        <div style={{ color: THEME.textSecondary, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
          Nodes
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={13}
            style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted, pointerEvents: "none" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              width: "100%",
              background: THEME.inputBg,
              border: `1px solid ${THEME.panelBorder}`,
              borderRadius: 6,
              padding: "6px 8px 6px 28px",
              color: THEME.textPrimary,
              fontSize: 14,
              fontFamily: THEME.fontSans,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ overflowY: "auto", flex: 1, padding: "0 8px 16px" }}>
        {Array.from(byCategory.entries()).map(([category, nodes]) => {
          const items = filtered(nodes);
          if (!items.length) return null;
          const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

          return (
            <div key={category} style={{ marginBottom: 16 }}>
              <div
                style={{
                  color: color,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "6px 4px 4px",
                }}
              >
                {category}
              </div>
              {items.map((node) => {
                const Icon = (Icons as any)[node.icon] ?? Icons.Box;
                return (
                  <button
                    key={node.id}
                    onClick={() => onAdd(node.id)}
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
                      fontSize: 14,
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget.style.background = THEME.inputBg); }}
                    onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); }}
                  >
                    <div style={{ color: color, flexShrink: 0 }}>
                      <Icon size={14} />
                    </div>
                    <span>{node.label}</span>
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
