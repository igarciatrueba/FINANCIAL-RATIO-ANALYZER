import type { FinancialAnalysisInput, FinancialAnalysisResult } from "@/domain";
import {
  dimensionLabels,
  toneForClassification,
} from "@/features/executive-dashboard/lib/dashboard-metadata";
import {
  buildDimensionRadarViewModel,
  buildExecutiveSummaryViewModel,
  buildHealthTrendViewModel,
  buildProfitabilityWaterfallViewModel,
  buildRatioTableViewModel,
  buildRatioTrendViewModel,
  buildScoreContributionViewModel,
  buildWorkingCapitalViewModel,
} from "@/features/executive-dashboard/lib/build-analytical-reporting-view-model";
import { buildDimensionViewModels } from "@/features/executive-dashboard/lib/build-dimension-view-model";
import { buildExecutiveDiagnosis } from "@/features/executive-dashboard/lib/build-executive-diagnosis";
import { buildInsightViewModel } from "@/features/executive-dashboard/lib/build-insight-view-model";
import { buildKpiViewModels } from "@/features/executive-dashboard/lib/build-kpi-view-model";
import { formatCoverage, formatFinancialValue } from "@/features/executive-dashboard/lib/format-financial-value";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";

function dimensionLabel(id: string | undefined) {
  return id && id in dimensionLabels ? dimensionLabels[id as keyof typeof dimensionLabels] : "Unavailable";
}

export function buildExecutiveDashboardViewModel(
  result: FinancialAnalysisResult,
  sourceInput?: FinancialAnalysisInput
): ExecutiveDashboardViewModel {
  const currentYear = result.currentPeriod.year;
  const comparisonYear = result.previousPeriod?.year ?? null;
  const score = formatFinancialValue({ value: result.score.total, unit: "score" });
  const change = formatFinancialValue({
    value: result.score.changeFromPreviousPeriod,
    unit: "score-change",
    signed: true,
    unavailableReason: "comparison-unavailable",
  });
  const dimensions = buildDimensionViewModels(result);
  const strongestDimension = dimensions.find((dimension) => dimension.isStrongest) ?? null;
  const weakestDimension = dimensions.find((dimension) => dimension.isWeakest) ?? null;
  const previousScore = formatFinancialValue({
    value: result.previousPeriod?.score?.total ?? null,
    unit: "score",
    unavailableReason: "comparison-unavailable",
  });
  const principalStrengths = result.principalInsights.strengths.map((insight) =>
    buildInsightViewModel(insight, result.company.currency)
  );
  const principalRisks = result.principalInsights.risks.map((insight) => buildInsightViewModel(insight, result.company.currency));
  const diagnosis = buildExecutiveDiagnosis(result, dimensions);

  return {
    company: {
      name: result.company.name,
      industry: result.company.industry,
      currency: result.company.currency,
    },
    period: {
      currentYear,
      comparisonYear,
      display: comparisonYear ? `${currentYear} vs ${comparisonYear}` : `${currentYear}`,
    },
    routes: {
      editInput: "/input",
      methodology: "/methodology",
    },
    status: {
      label: "Analysis complete",
      description: "Local browser calculation accepted the canonical dataset.",
    },
    coverage: {
      value: result.coverage.coveragePercentage,
      displayValue: formatCoverage(result.coverage.coveragePercentage),
      validMetricCount: result.coverage.validMetricCount,
      configuredMetricCount: result.coverage.configuredMetricCount,
      unavailableMetricCount: result.coverage.unavailableMetricIds.length,
    },
    score: {
      total: result.score.total,
      displayValue: result.score.total === null ? "Unavailable" : score.display,
      accessibleLabel:
        result.score.total === null
          ? `Financial Health Score unavailable, ${result.score.classification}`
          : `Financial Health Score: ${score.display} out of 100, ${result.score.classification}`,
      classification: result.score.classification,
      tone: toneForClassification(result.score.classification),
      changeDisplay: change.display,
      changeAccessibleText: change.accessibleText,
      trend: result.score.trend,
      coverageDisplay: `${formatCoverage(result.score.coveragePercentage)} coverage`,
      strongestDimension: dimensionLabel(result.score.strongestDimension?.dimension),
      weakestDimension: dimensionLabel(result.score.weakestDimension?.dimension),
      previousDisplayValue: previousScore.display,
      previousAccessibleText: previousScore.accessibleText,
    },
    scoreHistory: result.scoreHistory.map((period) => ({
      year: period.year,
      score: period.score.total,
      displayValue: period.score.total === null ? "Unavailable" : formatFinancialValue({ value: period.score.total, unit: "score" }).display,
      classification: period.score.classification,
    })),
    strongestDimension,
    weakestDimension,
    kpis: buildKpiViewModels(result),
    dimensions,
    dimensionRadar: buildDimensionRadarViewModel(result),
    healthTrend: buildHealthTrendViewModel(result),
    ratioTrend: buildRatioTrendViewModel(result),
    ratioTable: buildRatioTableViewModel(result),
    profitabilityWaterfall: buildProfitabilityWaterfallViewModel(result, sourceInput),
    workingCapital: buildWorkingCapitalViewModel(result),
    scoreContribution: buildScoreContributionViewModel(result),
    executiveSummary: buildExecutiveSummaryViewModel(result, diagnosis),
    principalStrengths,
    principalRisks,
    diagnosis,
  };
}
