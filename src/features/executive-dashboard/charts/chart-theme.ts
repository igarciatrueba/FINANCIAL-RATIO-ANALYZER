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
    surface: "rgba(17, 23, 34, 0.94)",
    border: "rgba(147, 197, 253, 0.26)",
  },
  fontFamily: "Inter, Arial, sans-serif",
  monoFontFamily: "Inter, Arial, sans-serif",
};

export function baseTooltip() {
  return {
    backgroundColor: chartTheme.colors.surface,
    borderColor: chartTheme.colors.border,
    borderWidth: 1,
    padding: [10, 12],
    extraCssText: "box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 42px rgba(0,0,0,.32); backdrop-filter: blur(14px) saturate(118%); border-radius: 8px;",
    textStyle: {
      color: chartTheme.colors.text,
      fontFamily: chartTheme.fontFamily,
      fontSize: 12,
      fontVariantNumeric: "tabular-nums",
    },
    confine: true,
  };
}
