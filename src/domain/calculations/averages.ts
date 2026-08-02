import type { MetricResult } from "@/domain/types";

import { availableMetric, unavailableMetric } from "@/domain/calculations/safe-math";

export function calculateAverageBalance(
  previousClosingBalance: number | undefined,
  currentClosingBalance: number,
  balanceName: string
): MetricResult {
  if (!Number.isFinite(currentClosingBalance)) {
    return unavailableMetric("missing-input", balanceName);
  }

  if (previousClosingBalance === undefined) {
    return availableMetric(currentClosingBalance);
  }

  if (!Number.isFinite(previousClosingBalance)) {
    return unavailableMetric("missing-input", balanceName);
  }

  return availableMetric((previousClosingBalance + currentClosingBalance) / 2);
}
