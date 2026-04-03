"use client";

import React from "react";
import { THEME } from "@aiui/canvas";
import type { ThemeMode } from "@aiui/canvas";
import { Save, FolderOpen, Zap, Sun, Moon } from "lucide-react";

interface ToolbarProps {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export function Toolbar({ themeMode, onToggleTheme }: ToolbarProps) {
  return (
    <div
      style={{
        height: 52,
        background: THEME.panelBg,
        borderBottom: `1px solid ${THEME.panelBorder}`,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 8,
        flexShrink: 0,
        fontFamily: THEME.fontSans,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 16 }}>
        <Zap size={16} color="#6b9e78" />
        <span style={{ color: THEME.textPrimary, fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>
          AIUI
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: THEME.panelBorder, marginRight: 8 }} />

      {/* File ops */}
      <ToolbarButton icon={<FolderOpen size={14} />} label="Open" onClick={() => {}} />
      <ToolbarButton icon={<Save size={14} />} label="Save" onClick={() => {}} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          background: "transparent",
          border: `1px solid ${THEME.panelBorder}`,
          borderRadius: 8,
          color: THEME.textSecondary,
          cursor: "pointer",
          transition: "color 0.15s, border-color 0.15s",
        }}
      >
        {themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        background: "transparent",
        border: `1px solid ${THEME.panelBorder}`,
        borderRadius: 6,
        color: THEME.textSecondary,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: THEME.fontSans,
        transition: "color 0.1s, border-color 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = THEME.textPrimary;
        e.currentTarget.style.borderColor = THEME.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = THEME.textSecondary;
        e.currentTarget.style.borderColor = THEME.panelBorder;
      }}
    >
      {icon}
      {label}
    </button>
  );
}
