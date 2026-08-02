import type { FinancialPeriod, MetricResult } from "@/domain/types";

import { calculateQuickAssets, isAvailableMetric, safeDivide } from "@/domain/calculations";

export function calculateCurrentRatio(period: FinancialPeriod): MetricResult {
  return safeDivide(period.balanceSheet.currentAssets, period.balanceSheet.currentLiabilities, {
    denominatorName: "current liabilities",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateQuickRatio(period: FinancialPeriod): MetricResult {
  const quickAssets = calculateQuickAssets(period);

  if (!isAvailableMetric(quickAssets)) {
    return quickAssets;
  }

  return safeDivide(quickAssets.value, period.balanceSheet.currentLiabilities, {
    denominatorName: "current liabilities",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateCashRatio(period: FinancialPeriod): MetricResult {
  return safeDivide(period.balanceSheet.cash, period.balanceSheet.currentLiabilities, {
    denominatorName: "current liabilities",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateOperatingCashFlowRatio(period: FinancialPeriod): MetricResult {
  return safeDivide(period.cashFlow.operatingCashFlow, period.balanceSheet.currentLiabilities, {
    denominatorName: "current liabilities",
    negativeDenominator: "non-meaningful",
  });
}
