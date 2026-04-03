import React, { useState, useCallback, useMemo } from "react";
import { PROMPT_TREE } from "@aiui/nodes";
import { THEME } from "./theme";
import * as Icons from "lucide-react";

interface PromptBuilderInlineProps {
  selections: Record<string, Record<string, string[]>>;
  onChange: (selections: Record<string, Record<string, string[]>>) => void;
}

export function PromptBuilderInline({ selections, onChange }: PromptBuilderInlineProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCat((prev) => (prev === cat ? null : cat));
  }, []);

  const toggleOption = useCallback(
    (category: string, group: string, option: string) => {
      const next = { ...selections };
      if (!next[category]) next[category] = {};
      if (!next[category][group]) next[category][group] = [];

      const list = [...next[category][group]];
      const idx = list.indexOf(option);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(option);
      }
      next[category][group] = list;

      // Clean empty
      if (list.length === 0) delete next[category][group];
      if (Object.keys(next[category]).length === 0) delete next[category];

      onChange(next);
    },
    [selections, onChange]
  );

  // Count total selections
  const totalCount = useMemo(() => {
    let count = 0;
    for (const groups of Object.values(selections)) {
      for (const items of Object.values(groups)) {
        count += items.length;
      }
    }
    return count;
  }, [selections]);

  // Build preview string
  const preview = useMemo(() => {
    const parts: string[] = [];
    for (const groups of Object.values(selections)) {
      for (const items of Object.values(groups)) {
        parts.push(...items);
      }
    }
    return parts.join(", ");
  }, [selections]);

  return (
    <div
      className="nodrag nowheel"
      style={{ padding: 6, maxHeight: 400, display: "flex", flexDirection: "column" }}
    >
      {/* Preview of current prompt */}
      {totalCount > 0 && (
        <div
          style={{
            padding: "6px 8px",
            marginBottom: 6,
            background: THEME.inputBg,
            borderRadius: 6,
            border: `1px solid ${THEME.nodeBorder}`,
            fontSize: 11,
            color: THEME.textSecondary,
            lineHeight: 1.5,
            maxHeight: 60,
            overflowY: "auto",
            fontFamily: THEME.fontMono,
          }}
        >
          {preview}
        </div>
      )}
      {totalCount === 0 && (
        <div
          style={{
            padding: "8px",
            fontSize: 12,
            color: THEME.textMuted,
            textAlign: "center",
          }}
        >
          Select prompt modifiers below
        </div>
      )}

      {/* Category tree */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {Object.entries(PROMPT_TREE).map(([catKey, cat]) => {
          const CatIcon = (Icons as any)[cat.icon] ?? Icons.Folder;
          const isExpanded = expandedCat === catKey;
          const catSelections = selections[catKey] ?? {};
          const catCount = Object.values(catSelections).reduce((s, arr) => s + arr.length, 0);

          return (
            <div key={catKey} style={{ marginBottom: 2 }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(catKey)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 6px",
                  background: isExpanded ? THEME.inputBg : "transparent",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: THEME.textPrimary,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: THEME.fontSans,
                  textAlign: "left",
                }}
              >
                {isExpanded
                  ? <Icons.ChevronDown size={12} color={THEME.textMuted} />
                  : <Icons.ChevronRight size={12} color={THEME.textMuted} />
                }
                <CatIcon size={13} color={THEME.accent} />
                <span>{cat.label}</span>
                {catCount > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      background: THEME.accent,
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: "1px 6px",
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {catCount}
                  </span>
                )}
              </button>

              {/* Expanded groups */}
              {isExpanded && (
                <div style={{ paddingLeft: 16, paddingTop: 2 }}>
                  {Object.entries(cat.groups).map(([groupKey, group]) => {
                    const groupSel = catSelections[groupKey] ?? [];
                    return (
                      <div key={groupKey} style={{ marginBottom: 6 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: THEME.textMuted,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "4px 0 2px",
                          }}
                        >
                          {group.label}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {group.options.map((opt: string) => {
                            const isSelected = groupSel.includes(opt);
                            return (
                              <button
                                key={opt}
                                onClick={() => toggleOption(catKey, groupKey, opt)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  fontFamily: THEME.fontSans,
                                  borderRadius: 5,
                                  border: `1px solid ${isSelected ? THEME.accent : THEME.nodeBorder}`,
                                  background: isSelected ? `${THEME.accent}22` : "transparent",
                                  color: isSelected ? THEME.accent : THEME.textSecondary,
                                  cursor: "pointer",
                                  transition: "all 0.1s",
                                  fontWeight: isSelected ? 600 : 400,
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection count */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 6,
          borderTop: `1px solid ${THEME.nodeBorder}`,
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 11, color: THEME.textMuted }}>
          {totalCount} modifier{totalCount !== 1 ? "s" : ""} selected
        </span>
        {totalCount > 0 && (
          <button
            onClick={() => onChange({})}
            style={{
              fontSize: 11,
              color: THEME.textMuted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              fontFamily: THEME.fontSans,
            }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
