import type { FinancialPeriod, MetricResult } from "@/domain/types";

import { calculateFreeCashFlowValue, isAvailableMetric, safeDivide } from "@/domain/calculations";

export function calculateOperatingCashFlowMargin(period: FinancialPeriod): MetricResult {
  return safeDivide(period.cashFlow.operatingCashFlow, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateFreeCashFlow(period: FinancialPeriod): MetricResult {
  return calculateFreeCashFlowValue(period);
}

export function calculateFreeCashFlowMargin(period: FinancialPeriod): MetricResult {
  const freeCashFlow = calculateFreeCashFlow(period);

  if (!isAvailableMetric(freeCashFlow)) {
    return freeCashFlow;
  }

  return safeDivide(freeCashFlow.value, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateOperatingCashFlowToNetIncome(period: FinancialPeriod): MetricResult {
  return safeDivide(period.cashFlow.operatingCashFlow, period.incomeStatement.netIncome, {
    denominatorName: "net income",
  });
}
