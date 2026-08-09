export type CurrencyCode = "EUR" | "USD" | "GBP";

export type ReportingYear = number;

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  currency: CurrencyCode;
}

export interface IncomeStatement {
  revenue: number;
  costOfGoodsSold: number;
  ebit: number;
  interestExpense: number;
  netIncome: number;
}

export interface ExtendedIncomeStatement extends IncomeStatement {
  grossProfit?: number;
  operatingExpenses?: number;
  taxExpense?: number;
}

export interface BalanceSheet {
  cash: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  totalDebt: number;
  equity: number;
}

export interface ExtendedBalanceSheet extends BalanceSheet {
  accountsPayable?: number;
  propertyPlantEquipment?: number;
  longTermDebt?: number;
  totalLiabilities?: number;
}

export interface CashFlowStatement {
  operatingCashFlow: number;
  capitalExpenditure: number;
}

export interface ExtendedCashFlowStatement extends CashFlowStatement {
  investingCashFlow?: number;
  financingCashFlow?: number;
  netChangeInCash?: number;
}

export interface WorkingCapitalInputs {
  averageInventory: number;
  averageReceivables: number;
  averagePayables: number;
}

export interface FinancialPeriod {
  year: ReportingYear;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
  workingCapital: WorkingCapitalInputs;
}

export interface FinancialAnalysisInput {
  company: CompanyProfile;
  periods: [FinancialPeriod, FinancialPeriod, FinancialPeriod];
}

export type MetricStatus = "available" | "unavailable";

export interface AvailableMetric {
  status: "available";
  value: number;
}

export interface UnavailableMetric {
  status: "unavailable";
  reason:
    | "missing-input"
    | "zero-denominator"
    | "non-meaningful-denominator"
    | "insufficient-history"
    | "invalid-financial-relationship";
  affectedDenominator?: string;
}

export type MetricResult = AvailableMetric | UnavailableMetric;

export type RatioCategory = "profitability" | "liquidity" | "solvency" | "efficiency" | "cash-flow";

export interface RatioDefinition {
  id: string;
  name: string;
  shortName: string;
  category: RatioCategory;
  unit: "percentage" | "multiple" | "days" | "currency";
  description: string;
  formulaLabel: string;
  inputs: string[];
  interpretation: string;
  unavailableConditions: string[];
  scoreEligible?: boolean;
}

export interface PeriodRatioResult {
  year: ReportingYear;
  ratios: Record<string, MetricResult>;
}

export interface DimensionScore {
  dimension: RatioCategory;
  score: number | null;
  validMetricCount: number;
  configuredMetricCount: number;
  coveragePercentage: number;
  strongestMetrics: string[];
  weakestMetrics: string[];
  unavailableMetricIds: string[];
}

export type FinancialHealthClassification =
  | "Strong"
  | "Healthy"
  | "Moderate"
  | "Weak"
  | "Critical"
  | "Unavailable";

export interface FinancialHealthScore {
  total: number | null;
  classification: FinancialHealthClassification;
  dimensions: DimensionScore[];
  changeFromPreviousPeriod: number | null;
  coveragePercentage: number;
  strongestDimension: DimensionScore | null;
  weakestDimension: DimensionScore | null;
  positiveDrivers: ScoreDriver[];
  negativeDrivers: ScoreDriver[];
  metricScores: MetricScoreResult[];
  trend: TrendDirection;
}

export type InsightCategory = "strength" | "risk" | "observation";
export type InsightSeverity = "low" | "medium" | "high";
export type TrendDirection = "improving" | "deteriorating" | "stable" | "mixed";

export interface FinancialInsight {
  id: string;
  ruleId: string;
  title: string;
  category: InsightCategory;
  severity: InsightSeverity;
  explanation: string;
  supportingMetricIds: string[];
  affectedYear: ReportingYear;
  trend: TrendDirection;
  priority: number;
  evidence: InsightEvidence[];
}

export interface DuPontResult {
  year: ReportingYear;
  roe: MetricResult;
  netProfitMargin: MetricResult;
  assetTurnover: MetricResult;
  financialLeverage: MetricResult;
  reconciliationStatus: "reconciled" | "approximate" | "unavailable";
}

export interface AnalyticalCoverage {
  validMetricCount: number;
  configuredMetricCount: number;
  coveragePercentage: number;
  unavailableMetricIds: string[];
}

export interface PeriodAnalysis {
  year: ReportingYear;
  ratios: Record<string, MetricResult>;
  dupont: DuPontResult;
  score?: FinancialHealthScore;
}

export interface FinancialAnalysisResult {
  company: CompanyProfile;
  periods: PeriodAnalysis[];
  currentPeriod: PeriodAnalysis;
  previousPeriod?: PeriodAnalysis;
  score: FinancialHealthScore;
  insights: FinancialInsight[];
  coverage: AnalyticalCoverage;
  scoreHistory: PeriodScoreResult[];
  principalInsights: PrincipalInsights;
}

export type ThresholdMode = "higher-is-better" | "lower-is-better" | "target-range";

export interface ScoreAnchor {
  value: number;
  score: number;
}

export interface MetricThresholdConfiguration {
  metricId: string;
  mode: ThresholdMode;
  anchors: ScoreAnchor[];
}

export interface ScoringConfiguration {
  disclaimer: string;
  dimensionWeights: Record<RatioCategory, number>;
  metricWeights: Record<RatioCategory, Partial<Record<string, number>>>;
  thresholds: Record<string, MetricThresholdConfiguration>;
  minimumDimensionCoverage: number;
  minimumDimensionMetricCount: number;
  minimumTotalCoverage: number;
  minimumAvailableDimensionCount: number;
}

export interface ScoringConfigurationValidationResult {
  valid: boolean;
  issues: string[];
}

export interface MetricScoreResult {
  metricId: string;
  dimension: RatioCategory;
  raw: MetricResult;
  score: number | null;
  configuredWeight: number;
  effectiveWeight: number;
  totalEffectiveWeight: number;
  contribution: number;
}

export interface ScoreDriver {
  metricId: string;
  dimension: RatioCategory;
  raw: MetricResult;
  score: number;
  impact: number;
  configuredWeight: number;
  effectiveWeight: number;
  totalEffectiveWeight: number;
  contribution: number;
}

export interface PeriodScoreResult {
  year: ReportingYear;
  score: FinancialHealthScore;
}

export type InsightEvidence =
  | {
      type: "metric";
      metricId: string;
      year: ReportingYear;
      value: MetricResult;
    }
  | {
      type: "change";
      metricId: string;
      fromYear: ReportingYear;
      toYear: ReportingYear;
      change: MetricResult;
    }
  | {
      type: "coverage";
      coveragePercentage: number;
      unavailableMetricIds: string[];
    };

export interface PrincipalInsights {
  strengths: FinancialInsight[];
  risks: FinancialInsight[];
}

export interface ScenarioAssumptions {
  revenueGrowthPercent: number;
  ebitMarginPercent: number | null;
  totalDebtChangePercent: number;
  currentAssetsChangePercent: number;
  inventoryChangePercent: number;
  interestExpenseChangePercent: number;
}

export type ScenarioMetricDirection = "favourable" | "unfavourable" | "neutral" | "unavailable";

export interface ScenarioMetricComparison {
  metricId: string;
  baseValue: MetricResult;
  scenarioValue: MetricResult;
  absoluteChange: MetricResult;
  percentageChange: MetricResult;
  direction: ScenarioMetricDirection;
  scoreImpact: number | null;
}

export interface ScenarioComparison {
  scoreChange: number | null;
  metrics: ScenarioMetricComparison[];
}

export interface ScenarioAnalysis {
  id: string;
  name: string;
  assumptions: ScenarioAssumptions;
  transformedInput: FinancialAnalysisInput;
  analysis: FinancialAnalysisResult;
  comparison: ScenarioComparison;
}

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  path: string;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  year?: ReportingYear;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  blockingIssueCount: number;
  warningCount: number;
}

export type ParseFinancialAnalysisInputResult =
  | {
      success: true;
      data: FinancialAnalysisInput;
      validation: ValidationResult;
    }
  | {
      success: false;
      validation: ValidationResult;
    };
