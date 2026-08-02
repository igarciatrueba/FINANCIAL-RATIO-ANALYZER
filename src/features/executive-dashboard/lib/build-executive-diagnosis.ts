import type { FinancialAnalysisResult } from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import { SCORE_DISCLAIMER } from "@/domain/scoring/config";
import { trendLabel } from "@/features/executive-dashboard/lib/dashboard-metadata";
import { formatCoverage, formatFinancialValue } from "@/features/executive-dashboard/lib/format-financial-value";
import type {
  DashboardDimensionViewModel,
  ExecutiveDiagnosisViewModel,
} from "@/features/executive-dashboard/types/dashboard.types";

function dimensionName(dimension: DashboardDimensionViewModel | null | undefined) {
  return dimension ? dimension.label : "Unavailable";
}

function driverName(metricId: string | undefined, fallback: string) {
  if (!metricId) {
    return fallback;
  }
  return formulaRegistry[metricId as keyof typeof formulaRegistry]?.name ?? fallback;
}

export function buildExecutiveDiagnosis(
  result: FinancialAnalysisResult,
  dimensions: DashboardDimensionViewModel[]
): ExecutiveDiagnosisViewModel {
  const classification = result.score.classification;
  const trend = trendLabel(result.score.trend).toLowerCase();
  const scoreDisplay = formatFinancialValue({ value: result.score.total, unit: "score" }).display;
  const strongest = dimensions.find((dimension) => dimension.id === result.score.strongestDimension?.dimension) ?? null;
  const weakest = dimensions.find((dimension) => dimension.id === result.score.weakestDimension?.dimension) ?? null;
  const topPositiveDriver = result.score.positiveDrivers[0];
  const topNegativeDriver = result.score.negativeDrivers[0];
  const principalStrength = result.principalInsights.strengths[0];
  const principalRisk = result.principalInsights.risks[0];
  const comparison = result.previousPeriod ? ` versus ${result.previousPeriod.year}` : "";

  return {
    headline: `${classification} financial health with ${trend} score movement`,
    summary:
      result.score.total === null
        ? `${result.company.name} does not have enough analytical coverage for a total Financial Health Score.`
        : `${result.company.name} is classified as ${classification} with a current score of ${scoreDisplay}${comparison}.`,
    strongestArea: `${dimensionName(strongest)} is the strongest financial area${
      strongest ? ` at ${strongest.displayScore}` : ""
    }.`,
    primaryPressure: `${dimensionName(weakest)} is the primary pressure point${
      weakest ? ` at ${weakest.displayScore}` : ""
    }.`,
    driverContext:
      principalStrength || principalRisk
        ? `Primary evidence: ${principalStrength?.title ?? driverName(topPositiveDriver?.metricId, "no principal strength")} / ${
            principalRisk?.title ?? driverName(topNegativeDriver?.metricId, "no principal risk")
          }.`
        : "Principal strengths and risks are unavailable for this analysis.",
    coverageContext: `${formatCoverage(result.coverage.coveragePercentage)} analytical coverage across ${
      result.coverage.validMetricCount
    } of ${result.coverage.configuredMetricCount} configured metrics.`,
    disclaimer: SCORE_DISCLAIMER,
  };
}
