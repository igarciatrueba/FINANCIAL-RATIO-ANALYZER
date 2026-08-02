import type { FinancialPeriod, MetricResult } from "@/domain/types";

import { calculateAverageTotalAssets, isAvailableMetric, safeDivide, unavailableMetric } from "@/domain/calculations";

export function calculateAssetTurnover(period: FinancialPeriod, previousPeriod?: FinancialPeriod): MetricResult {
  const averageTotalAssets = calculateAverageTotalAssets(period, previousPeriod);

  if (!isAvailableMetric(averageTotalAssets)) {
    return averageTotalAssets;
  }

  return safeDivide(period.incomeStatement.revenue, averageTotalAssets.value, {
    denominatorName: "average total assets",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateInventoryTurnover(period: FinancialPeriod): MetricResult {
  return safeDivide(period.incomeStatement.costOfGoodsSold, period.workingCapital.averageInventory, {
    denominatorName: "average inventory",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateReceivablesTurnover(period: FinancialPeriod): MetricResult {
  return safeDivide(period.incomeStatement.revenue, period.workingCapital.averageReceivables, {
    denominatorName: "average receivables",
    negativeDenominator: "non-meaningful",
  });
}

export function calculateDaysSalesOutstanding(period: FinancialPeriod): MetricResult {
  const ratio = safeDivide(period.workingCapital.averageReceivables, period.incomeStatement.revenue, {
    denominatorName: "revenue",
    negativeDenominator: "non-meaningful",
  });

  return isAvailableMetric(ratio) ? { status: "available", value: ratio.value * 365 } : ratio;
}

export function calculateDaysInventoryOutstanding(period: FinancialPeriod): MetricResult {
  const ratio = safeDivide(period.workingCapital.averageInventory, period.incomeStatement.costOfGoodsSold, {
    denominatorName: "cost of goods sold",
    negativeDenominator: "non-meaningful",
  });

  return isAvailableMetric(ratio) ? { status: "available", value: ratio.value * 365 } : ratio;
}

export function calculateDaysPayablesOutstanding(period: FinancialPeriod): MetricResult {
  const ratio = safeDivide(period.workingCapital.averagePayables, period.incomeStatement.costOfGoodsSold, {
    denominatorName: "cost of goods sold",
    negativeDenominator: "non-meaningful",
  });

  return isAvailableMetric(ratio) ? { status: "available", value: ratio.value * 365 } : ratio;
}

export function calculateCashConversionCycle(period: FinancialPeriod): MetricResult {
  const dio = calculateDaysInventoryOutstanding(period);
  const dso = calculateDaysSalesOutstanding(period);
  const dpo = calculateDaysPayablesOutstanding(period);

  const unavailableComponent = [dio, dso, dpo].find((metric) => !isAvailableMetric(metric));

  if (unavailableComponent && !isAvailableMetric(unavailableComponent)) {
    return unavailableMetric(unavailableComponent.reason, unavailableComponent.affectedDenominator);
  }

  return {
    status: "available",
    value:
      (dio.status === "available" ? dio.value : 0) +
      (dso.status === "available" ? dso.value : 0) -
      (dpo.status === "available" ? dpo.value : 0),
  };
}
