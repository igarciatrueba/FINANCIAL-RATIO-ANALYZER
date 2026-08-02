import type { FinancialPeriod, PeriodRatioResult } from "@/domain/types";

import { formulaRegistry } from "@/domain/ratios/registry";

export function calculatePeriodRatios(period: FinancialPeriod, previousPeriod?: FinancialPeriod): PeriodRatioResult {
  return {
    year: period.year,
    ratios: Object.fromEntries(
      Object.entries(formulaRegistry).map(([formulaId, definition]) => [
        formulaId,
        definition.calculate(period, previousPeriod),
      ])
    ),
  };
}
