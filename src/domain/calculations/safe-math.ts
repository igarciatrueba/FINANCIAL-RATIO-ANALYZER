import type { AvailableMetric, MetricResult, UnavailableMetric } from "@/domain/types";

type UnavailableReason = UnavailableMetric["reason"];

export type NegativeDenominatorPolicy = "allow" | "non-meaningful";

export type SafeDivisionOptions = {
  denominatorName?: string;
  negativeDenominator?: NegativeDenominatorPolicy;
};

export function availableMetric(value: number): MetricResult {
  if (!Number.isFinite(value)) {
    return unavailableMetric("missing-input");
  }

  return {
    status: "available",
    value,
  };
}

export function unavailableMetric(reason: UnavailableReason, affectedDenominator?: string): MetricResult {
  return {
    status: "unavailable",
    reason,
    affectedDenominator,
  };
}

export function isAvailableMetric(metric: MetricResult): metric is AvailableMetric {
  return metric.status === "available";
}

export function safeDivide(numerator: number, denominator: number, options: SafeDivisionOptions = {}): MetricResult {
  const denominatorName = options.denominatorName;

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return unavailableMetric("missing-input", denominatorName);
  }

  if (denominator === 0) {
    return unavailableMetric("zero-denominator", denominatorName);
  }

  if (denominator < 0 && options.negativeDenominator === "non-meaningful") {
    return unavailableMetric("non-meaningful-denominator", denominatorName);
  }

  return availableMetric(numerator / denominator);
}
