import type { CurrencyCode, FinancialInsight, InsightEvidence, MetricResult } from "@/domain";
import { formulaRegistry } from "@/domain/ratios";
import { severityLabel, trendLabel } from "@/features/executive-dashboard/lib/dashboard-metadata";
import {
  formatCoverage,
  formatFinancialValue,
  reasonForUnavailableMetric,
  valueFromMetric,
} from "@/features/executive-dashboard/lib/format-financial-value";
import type {
  DashboardInsightEvidenceViewModel,
  DashboardInsightViewModel,
} from "@/features/executive-dashboard/types/dashboard.types";

function metricDefinition(metricId: string) {
  return formulaRegistry[metricId as keyof typeof formulaRegistry];
}

function metricLabel(metricId: string) {
  return metricDefinition(metricId)?.name ?? "Unlabelled metric";
}

function metricUnit(metricId: string) {
  return metricDefinition(metricId)?.unit ?? "multiple";
}

function formatMetric(metricId: string, metric: MetricResult | undefined, currency: CurrencyCode, signed = false) {
  return formatFinancialValue({
    value: valueFromMetric(metric),
    unit: metricUnit(metricId),
    currency,
    unavailableReason: reasonForUnavailableMetric(metric),
    signed,
  });
}

function evidenceToViewModel(evidence: InsightEvidence, currency: CurrencyCode): DashboardInsightEvidenceViewModel {
  if (evidence.type === "coverage") {
    const value = `${formatCoverage(evidence.coveragePercentage)} coverage`;
    return {
      label: "Analytical coverage",
      value,
      accessibleText: value,
      context: evidence.unavailableMetricIds.length
        ? `${evidence.unavailableMetricIds.length} unavailable metrics`
        : "All configured metrics available",
    };
  }

  if (evidence.type === "change") {
    const formatted = formatMetric(evidence.metricId, evidence.change, currency, true);
    return {
      label: metricLabel(evidence.metricId),
      value: formatted.display,
      accessibleText: formatted.accessibleText,
      context: `${evidence.fromYear} to ${evidence.toYear}`,
    };
  }

  const formatted = formatMetric(evidence.metricId, evidence.value, currency);
  return {
    label: metricLabel(evidence.metricId),
    value: formatted.display,
    accessibleText: formatted.accessibleText,
    context: `${evidence.year}`,
  };
}

export function buildInsightViewModel(insight: FinancialInsight, currency: CurrencyCode): DashboardInsightViewModel {
  return {
    id: insight.id,
    title: insight.title,
    explanation: insight.explanation,
    category: insight.category,
    severity: insight.severity,
    severityLabel: severityLabel(insight.severity),
    trend: insight.trend,
    trendLabel: trendLabel(insight.trend),
    affectedYear: insight.affectedYear,
    priority: insight.priority,
    supportingMetricLabels: insight.supportingMetricIds.map(metricLabel),
    evidence: insight.evidence.map((item) => evidenceToViewModel(item, currency)),
  };
}
