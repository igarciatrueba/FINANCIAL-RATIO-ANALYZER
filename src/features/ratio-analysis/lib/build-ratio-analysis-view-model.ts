import type { FinancialAnalysisResult, RatioCategory } from "@/domain";
import { dimensionOrder } from "@/domain/scoring";
import { buildRatioTableViewModel, buildRatioTrendViewModel } from "@/features/executive-dashboard/lib/build-analytical-reporting-view-model";
import { dimensionLabels } from "@/features/executive-dashboard/lib/dashboard-metadata";

const lowerIsFavourable = new Set(["debt-to-equity", "debt-to-assets", "days-sales-outstanding", "days-inventory-outstanding", "cash-conversion-cycle"]);

export function buildRatioAnalysisViewModel(result: FinancialAnalysisResult) {
  const table = buildRatioTableViewModel(result);
  const trend = buildRatioTrendViewModel(result);
  return {
    company: { name: result.company.name, industry: result.company.industry, currency: result.company.currency },
    period: { current: result.currentPeriod.year, previous: result.previousPeriod?.year ?? null },
    coverage: result.coverage.coveragePercentage,
    categories: dimensionOrder.map((id) => ({ id, label: dimensionLabels[id], count: table.groups.find((group) => group.category === id)?.rows.length ?? 0 })),
    defaultCategory: "profitability" as RatioCategory,
    table,
    trend,
    availability: table.groups.reduce((total, group) => total + group.rows.filter((row) => row.availability === "Available").length, 0),
    configured: table.groups.reduce((total, group) => total + group.rows.length, 0),
    financialDirection: (metricId: string, movement: string) => {
      if (movement === "Unavailable") return "Movement unavailable";
      if (movement === "Unchanged") return "Neutral movement";
      const lower = lowerIsFavourable.has(metricId);
      const favourable = lower ? movement === "Decreased" : movement === "Increased";
      return favourable ? "Favourable movement" : "Unfavourable movement";
    },
  };
}

export type RatioAnalysisViewModel = ReturnType<typeof buildRatioAnalysisViewModel>;
