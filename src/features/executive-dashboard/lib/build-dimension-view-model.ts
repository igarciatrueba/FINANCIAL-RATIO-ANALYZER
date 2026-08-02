import { classifyFinancialHealthScore, type DimensionScore, type FinancialAnalysisResult } from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import {
  dimensionLabels,
  toneForClassification,
} from "@/features/executive-dashboard/lib/dashboard-metadata";
import { formatCoverage, formatFinancialValue } from "@/features/executive-dashboard/lib/format-financial-value";
import type { DashboardDimensionViewModel } from "@/features/executive-dashboard/types/dashboard.types";

function metricLabel(metricId: string | undefined) {
  if (!metricId) {
    return "Unavailable";
  }
  return formulaRegistry[metricId as keyof typeof formulaRegistry]?.shortName ?? "Unlabelled metric";
}

function buildDimension(
  dimension: DimensionScore,
  strongestId: string | undefined,
  weakestId: string | undefined
): DashboardDimensionViewModel {
  const status = classifyFinancialHealthScore(dimension.score);
  const formattedScore = formatFinancialValue({ value: dimension.score, unit: "score" });

  return {
    id: dimension.dimension,
    label: dimensionLabels[dimension.dimension],
    score: dimension.score,
    displayScore: dimension.score === null ? "Unavailable" : formattedScore.display,
    accessibleLabel: `${dimensionLabels[dimension.dimension]} score ${formattedScore.accessibleText}; ${formatCoverage(
      dimension.coveragePercentage
    )} coverage.`,
    status,
    tone: toneForClassification(status),
    coverageDisplay: `${formatCoverage(dimension.coveragePercentage)} coverage`,
    coverageValue: dimension.coveragePercentage,
    strongestMetricLabel: metricLabel(dimension.strongestMetrics[0]),
    weakestMetricLabel: metricLabel(dimension.weakestMetrics.at(-1)),
    isStrongest: dimension.dimension === strongestId,
    isWeakest: dimension.dimension === weakestId,
    relativePosition: dimension.score === null ? null : Math.max(0, Math.min(100, dimension.score)),
  };
}

export function buildDimensionViewModels(result: FinancialAnalysisResult): DashboardDimensionViewModel[] {
  const strongestId = result.score.strongestDimension?.dimension;
  const weakestId = result.score.weakestDimension?.dimension;

  return result.score.dimensions.map((dimension) => buildDimension(dimension, strongestId, weakestId));
}
