import type { FinancialAnalysisInput, FinancialAnalysisResult, PeriodAnalysis, ScoringConfiguration } from "@/domain/types";
import { calculateDuPont } from "@/domain/dupont";
import { calculatePeriodRatios } from "@/domain/ratios";
import { generateDeterministicInsights, selectPrincipalInsights } from "@/domain/insights";
import { calculateAnalyticalCoverage, calculateScoreHistory, defaultScoringConfig } from "@/domain/scoring";

export function analyseFinancialStatements(
  input: FinancialAnalysisInput,
  config: ScoringConfiguration = defaultScoringConfig
): FinancialAnalysisResult {
  const ratioPeriods = input.periods.map((period, index) => calculatePeriodRatios(period, input.periods[index - 1]));
  const scoreHistory = calculateScoreHistory(ratioPeriods, config);
  const periods: PeriodAnalysis[] = input.periods.map((period, index) => ({
    year: period.year,
    ratios: ratioPeriods[index].ratios,
    dupont: calculateDuPont(period, input.periods[index - 1]),
    score: scoreHistory[index].score,
  }));
  const currentPeriod = periods[periods.length - 1];
  const previousPeriod = periods[periods.length - 2];
  const score = scoreHistory[scoreHistory.length - 1].score;
  const coverage = calculateAnalyticalCoverage(score);
  const insights = generateDeterministicInsights({
    company: input.company,
    periods,
    currentPeriod,
    previousPeriod,
    scoreHistory,
    score,
    coverage,
  });

  return {
    company: input.company,
    periods,
    currentPeriod,
    previousPeriod,
    score,
    insights,
    coverage,
    scoreHistory,
    principalInsights: selectPrincipalInsights(insights),
  };
}
