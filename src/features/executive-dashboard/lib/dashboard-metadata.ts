import type { FinancialHealthClassification, RatioCategory } from "@/domain";

export const dimensionLabels: Record<RatioCategory, string> = {
  profitability: "Profitability",
  liquidity: "Liquidity",
  solvency: "Solvency",
  efficiency: "Efficiency",
  "cash-flow": "Cash Flow",
};

export function toneForClassification(classification: FinancialHealthClassification) {
  switch (classification) {
    case "Strong":
      return "strong";
    case "Healthy":
      return "healthy";
    case "Moderate":
      return "moderate";
    case "Weak":
      return "weak";
    case "Critical":
      return "critical";
    case "Unavailable":
      return "unavailable";
  }
}

export function trendLabel(trend: string) {
  switch (trend) {
    case "improving":
      return "Improving";
    case "deteriorating":
      return "Deteriorating";
    case "stable":
      return "Stable";
    default:
      return "Mixed";
  }
}

export function severityLabel(severity: string) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
