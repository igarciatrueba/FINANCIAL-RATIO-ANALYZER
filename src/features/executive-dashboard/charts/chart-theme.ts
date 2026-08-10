export const chartTheme = {
  colors: {
    background: "transparent",
    current: "#60a5fa",
    previous: "#7e8796",
    positive: "#10b981",
    warning: "#f59e0b",
    negative: "#ef4444",
    neutral: "#64748b",
    text: "#dde3ec",
    mutedText: "#a7b0c0",
    grid: "rgba(167, 176, 192, 0.12)",
    axis: "rgba(167, 176, 192, 0.22)",
    surface: "#111722",
    border: "#202a38",
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
      fontVariantNumeric: "tabular-nums",
    },
    confine: true,
  };
}
