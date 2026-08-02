export const chartTheme = {
  colors: {
    background: "transparent",
    current: "#38bdf8",
    previous: "#94a3b8",
    positive: "#22c55e",
    warning: "#f59e0b",
    negative: "#ef4444",
    neutral: "#64748b",
    text: "#cbd5e1",
    mutedText: "#94a3b8",
    grid: "rgba(148, 163, 184, 0.18)",
    axis: "rgba(148, 163, 184, 0.28)",
    surface: "#111827",
    border: "#253047",
  },
  fontFamily: "Inter, system-ui, sans-serif",
  monoFontFamily: '"JetBrains Mono", ui-monospace, monospace',
};

export function baseTooltip() {
  return {
    backgroundColor: chartTheme.colors.surface,
    borderColor: chartTheme.colors.border,
    borderWidth: 1,
    textStyle: {
      color: chartTheme.colors.text,
      fontFamily: chartTheme.fontFamily,
      fontSize: 12,
    },
    confine: true,
  };
}
