import React, { useState, useRef, useEffect } from "react";
import { THEME } from "./theme";

interface Device {
  id: string;
  label: string;
  gpu: string;
  name: string;
  vramFree: number;
}

interface DeviceSelectProps {
  value: string;
  devices: Device[];
  onChange: (value: string) => void;
}

const GPU_COLORS: Record<string, string> = {
  "RTX 4090": "#76b900",
  "RTX 3090": "#76b900",
  "RTX 4080": "#76b900",
  "RTX 3080": "#76b900",
  "A100": "#76b900",
};

function gpuColor(gpu: string): string {
  for (const [key, color] of Object.entries(GPU_COLORS)) {
    if (gpu.includes(key)) return color;
  }
  return "#6b7280";
}

function vramColor(gb: number): string {
  if (gb >= 20) return "#22c55e";
  if (gb >= 10) return "#eab308";
  if (gb >= 5) return "#f97316";
  return "#ef4444";
}

export function DeviceSelect({ value, devices, onChange }: DeviceSelectProps) {
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

  const selected = devices.find((d) => d.id === value);

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
          maxWidth: 200,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {selected ? (
          <>
            <GpuBadge gpu={selected.gpu} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{selected.name}</span>
            <VramTag gb={selected.vramFree} />
          </>
        ) : (
          <span>Auto</span>
        )}
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
            minWidth: 220,
            maxHeight: 240,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {/* Auto option */}
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: "6px 10px",
              background: !value ? THEME.inputBg : "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: THEME.fontSans,
              fontSize: 12,
              color: !value ? THEME.textPrimary : THEME.textSecondary,
              textAlign: "left",
            }}
          >
            Auto (load balanced)
          </button>

          {devices.map((d) => {
            const isActive = d.id === value;
            return (
              <button
                key={d.id}
                onClick={() => { onChange(d.id); setOpen(false); }}
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
                <GpuBadge gpu={d.gpu} />
                <span>{d.name}</span>
                <div style={{ flex: 1 }} />
                <VramTag gb={d.vramFree} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GpuBadge({ gpu }: { gpu: string }) {
  // Shorten: "RTX 4090" from full name
  let short = gpu;
  if (gpu.includes("RTX")) {
    const m = gpu.match(/RTX\s*\d+/);
    if (m) short = m[0];
  }
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 5px",
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: gpuColor(gpu),
        color: "#fff",
        flexShrink: 0,
        lineHeight: 1.4,
      }}
    >
      {short}
    </span>
  );
}

function VramTag({ gb }: { gb: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 5px",
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 600,
        background: `${vramColor(gb)}20`,
        color: vramColor(gb),
        flexShrink: 0,
        lineHeight: 1.4,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {gb.toFixed(0)}GB
    </span>
  );
}
