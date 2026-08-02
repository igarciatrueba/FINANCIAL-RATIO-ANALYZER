import type { FinancialInsight, PrincipalInsights } from "@/domain/types";

export * from "@/domain/insights/generate-insights";

export function selectPrincipalInsights(insights: FinancialInsight[]): PrincipalInsights {
  return {
    strengths: insights.filter((insight) => insight.category === "strength").slice(0, 3),
    risks: insights.filter((insight) => insight.category === "risk").slice(0, 3),
  };
}
