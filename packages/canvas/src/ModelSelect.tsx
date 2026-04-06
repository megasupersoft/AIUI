import React, { useState, useRef, useEffect } from "react";
import { THEME } from "./theme";

interface ModelOption {
  value: string;
  label: string;
}

interface ModelSelectProps {
  value: string;
  options: ModelOption[];
  onChange: (value: string) => void;
}

const ARCH_BADGES: Record<string, { label: string; bg: string; fg: string }> = {
  SD:   { label: "SD",   bg: "#db2777", fg: "#fff" },
  Flux: { label: "Flux", bg: "#2563eb", fg: "#fff" },
  Wan:  { label: "Wan",  bg: "#7c3aed", fg: "#fff" },
  LTX:  { label: "LTX",  bg: "#d97706", fg: "#fff" },
  ACE:  { label: "ACE",  bg: "#dc2626", fg: "#fff" },
};

function parseLabel(label: string): { badge: string | null; name: string } {
  const match = label.match(/^\[(\w+)\]\s*(.*)$/);
  if (match) return { badge: match[1], name: match[2] };
  return { badge: null, name: label };
}

export function ModelSelect({ value, options, onChange }: ModelSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selected = options.find((o) => o.value === value) || options[0];
  const { badge: selBadge, name: selName } = parseLabel(selected?.label || "");

  return (
    <div ref={ref} className="nodrag nowheel" style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: THEME.inputBg,
          border: `1px solid ${THEME.nodeBorder}`,
          borderRadius: 6,
          padding: "4px 8px",
          cursor: "pointer",
          fontFamily: THEME.fontSans,
          fontSize: 11,
          color: THEME.textSecondary,
          width: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          boxSizing: "border-box",
        }}
      >
        {selBadge && <Badge arch={selBadge} />}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selName}</span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: THEME.textMuted }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 2,
            background: THEME.panelBg,
            border: `1px solid ${THEME.nodeBorder}`,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 1000,
            minWidth: 200,
            maxHeight: 240,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {options.map((opt) => {
            const { badge, name } = parseLabel(opt.label);
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: "100%",
                  padding: "6px 10px",
                  background: isActive ? THEME.inputBg : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: THEME.fontSans,
                  fontSize: 12,
                  color: isActive ? THEME.textPrimary : THEME.textSecondary,
                  textAlign: "left",
                }}
              >
                {badge && <Badge arch={badge} />}
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Badge({ arch }: { arch: string }) {
  const style = ARCH_BADGES[arch] || { label: arch, bg: THEME.textMuted, fg: "#fff" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 5px",
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: style.bg,
        color: style.fg,
        flexShrink: 0,
        lineHeight: 1.4,
      }}
    >
      {style.label}
    </span>
  );
}
