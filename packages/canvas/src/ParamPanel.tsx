import React from "react";
import { getNode, NodeDef, ParamDef, CATEGORY_COLORS } from "@aiui/nodes";
import { THEME } from "./theme";
import * as Icons from "lucide-react";
import { Play, Loader2 } from "lucide-react";

interface ParamPanelProps {
  nodeId: string;
  nodeType: string;
  params: Record<string, any>;
  onParamChange: (nodeId: string, key: string, value: any) => void;
  onRunNode?: (nodeId: string) => void;
  isRunning?: boolean;
}

export function ParamPanel({ nodeId, nodeType, params, onParamChange, onRunNode, isRunning }: ParamPanelProps) {
  const def: NodeDef = getNode(nodeType);
  const Icon = (Icons as any)[def.icon] ?? Icons.Box;
  const color = CATEGORY_COLORS[def.category];

  return (
    <div
      style={{
        width: "100%",
        background: THEME.panelBg,
        borderLeft: `1px solid ${THEME.panelBorder}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: THEME.fontSans,
        height: "100%",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${THEME.panelBorder}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ color, flexShrink: 0 }}>
          <Icon size={16} />
        </div>
        <div>
          <div style={{ color: THEME.textPrimary, fontSize: 15, fontWeight: 600 }}>
            {def.label}
          </div>
          <div style={{ color: THEME.textSecondary, fontSize: 15, marginTop: 1 }}>
            {def.description}
          </div>
        </div>
      </div>

      {/* Params */}
      <div style={{ overflowY: "auto", flex: 1, padding: 16 }}>
        {Object.entries(def.params).length === 0 && (
          <div style={{ color: THEME.textMuted, fontSize: 14, textAlign: "center", paddingTop: 20 }}>
            No parameters
          </div>
        )}
        {Object.entries(def.params).map(([key, param]) => (
          <ParamField
            key={key}
            paramKey={key}
            def={param}
            value={params[key] ?? param.default}
            onChange={(val) => onParamChange(nodeId, key, val)}
          />
        ))}
      </div>

      {/* Run Node button */}
      {onRunNode && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${THEME.panelBorder}` }}>
          <button
            onClick={() => onRunNode(nodeId)}
            disabled={isRunning}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 16px",
              background: isRunning ? "#3a2060" : THEME.accent,
              border: "none",
              borderRadius: 6,
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              fontFamily: THEME.fontSans,
              transition: "background 0.15s",
            }}
          >
            {isRunning ? (
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Play size={13} />
            )}
            {isRunning ? "Running..." : `Run from ${def.label}`}
          </button>
        </div>
      )}
    </div>
  );
}

function ParamField({
  paramKey,
  def,
  value,
  onChange,
}: {
  paramKey: string;
  def: ParamDef;
  value: any;
  onChange: (v: any) => void;
}) {
  const labelStyle: React.CSSProperties = {
    color: THEME.textSecondary,
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 6,
    display: "block",
    letterSpacing: "0.02em",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: THEME.inputBg,
    border: `1px solid ${THEME.panelBorder}`,
    borderRadius: 6,
    padding: "7px 10px",
    color: THEME.textPrimary,
    fontSize: 14,
    fontFamily: def.type === "prompt" ? THEME.fontMono : THEME.fontSans,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical" as const,
  };

  const wrapStyle: React.CSSProperties = { marginBottom: 16 };

  if (def.type === "prompt" || (def.type === "string" && def.multiline)) {
    return (
      <div style={wrapStyle}>
        <label style={labelStyle}>{def.label}</label>
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          rows={4}
          style={{ ...inputStyle, lineHeight: 1.5 }}
        />
      </div>
    );
  }

  if (def.type === "select") {
    return (
      <div style={wrapStyle}>
        <label style={labelStyle}>{def.label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {def.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (def.type === "slider") {
    return (
      <div style={wrapStyle}>
        <label style={labelStyle}>
          {def.label}
          <span style={{ color: THEME.textPrimary, marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </span>
        </label>
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: "100%", accentColor: THEME.accent }}
        />
      </div>
    );
  }

  if (def.type === "number") {
    return (
      <div style={wrapStyle}>
        <label style={labelStyle}>{def.label}</label>
        <input
          type="number"
          value={value ?? ""}
          min={def.min}
          max={def.max}
          step={def.step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      </div>
    );
  }

  if (def.type === "boolean") {
    return (
      <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{def.label}</label>
        <div
          onClick={() => onChange(!value)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: value ? THEME.accent : "#2a2a3a",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: 3,
              left: value ? 19 : 3,
              transition: "left 0.2s",
            }}
          />
        </div>
      </div>
    );
  }

  // string / fallback
  return (
    <div style={wrapStyle}>
      <label style={labelStyle}>{def.label}</label>
      <input
        type="text"
        value={value ?? ""}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}
