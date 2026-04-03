export type ThemeMode = "dark" | "light";

const DARK = {
  canvasBg: "#1e1c1a",
  canvasGrid: "#28261e",
  canvasDot: "#38342c",
  nodeBg: "#26241e",
  nodeBorder: "#3e3a30",
  nodeBorderSelected: "#6b9e78",
  nodeShadow: "none",
  panelBg: "#221f1a",
  panelBorder: "#342f28",
  textPrimary: "#e8e2d8",
  textSecondary: "#9a9488",
  textMuted: "#5a5448",
  inputBg: "#2c2a22",
  accent: "#6b9e78",
  accentHover: "#5a8a66",
} as const;

const LIGHT = {
  canvasBg: "#cdc8c2",
  canvasGrid: "#c0bab4",
  canvasDot: "#a09890",
  nodeBg: "#d9d4ce",
  nodeBorder: "#b8b2aa",
  nodeBorderSelected: "#6b9e78",
  nodeShadow: "none",
  panelBg: "#d0cbc4",
  panelBorder: "#bfb8b0",
  textPrimary: "#1e1a16",
  textSecondary: "#504840",
  textMuted: "#887e74",
  inputBg: "#c5bfb8",
  accent: "#6b9e78",
  accentHover: "#5a8a66",
} as const;

const SHARED = {
  nodeHeaderHeight: 40,
  nodeRadius: 10,
  socketSize: 14,
  socketBorderWidth: 3,
  panelWidth: 320,
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontSans: "'Geist', 'Inter', system-ui, sans-serif",
} as const;

type ColorTokens = {
  canvasBg: string;
  canvasGrid: string;
  canvasDot: string;
  nodeBg: string;
  nodeBorder: string;
  nodeBorderSelected: string;
  nodeShadow: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  accent: string;
  accentHover: string;
};

export type ThemeTokens = ColorTokens & typeof SHARED;

// Mutable theme — updated by setThemeMode()
export let THEME: ThemeTokens = { ...LIGHT, ...SHARED };

let _currentMode: ThemeMode = "light";

export function getThemeMode(): ThemeMode {
  return _currentMode;
}

export function setThemeMode(mode: ThemeMode): ThemeTokens {
  _currentMode = mode;
  const colors = mode === "dark" ? DARK : LIGHT;
  THEME = { ...colors, ...SHARED };
  return THEME;
}

export function getThemeColors(mode: ThemeMode) {
  return mode === "dark" ? { ...DARK, ...SHARED } : { ...LIGHT, ...SHARED };
}
