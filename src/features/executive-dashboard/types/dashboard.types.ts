import type {
  CurrencyCode,
  FinancialHealthClassification,
  InsightSeverity,
  RatioCategory,
  TrendDirection,
} from "@/domain";

export type DashboardMetricDirection = "favourable" | "unfavourable" | "neutral" | "unavailable";

export type DashboardStatusTone = "strong" | "healthy" | "moderate" | "weak" | "critical" | "unavailable";

export type FormattedFinancialValue = {
  display: string;
  accessibleText: string;
  title: string;
  unitLabel: string;
  unavailableReason?: string;
};

export type ExecutiveDashboardViewModel = {
  company: {
    name: string;
    industry: string;
    currency: CurrencyCode;
  };
  period: {
    currentYear: number;
    comparisonYear: number | null;
    display: string;
  };
  routes: {
    editInput: "/input";
    methodology: "/methodology";
  };
  status: {
    label: string;
    description: string;
  };
  coverage: {
    value: number;
    displayValue: string;
    validMetricCount: number;
    configuredMetricCount: number;
    unavailableMetricCount: number;
  };
  score: {
    total: number | null;
    displayValue: string;
    accessibleLabel: string;
    classification: FinancialHealthClassification;
    tone: DashboardStatusTone;
    changeDisplay: string;
    changeAccessibleText: string;
    trend: TrendDirection;
    coverageDisplay: string;
    strongestDimension: string;
    weakestDimension: string;
    previousDisplayValue: string;
    previousAccessibleText: string;
  };
  scoreHistory: Array<{
    year: number;
    score: number | null;
    displayValue: string;
    classification: FinancialHealthClassification;
  }>;
  strongestDimension: DashboardDimensionViewModel | null;
  weakestDimension: DashboardDimensionViewModel | null;
  kpis: DashboardKpiViewModel[];
  dimensions: DashboardDimensionViewModel[];
  dimensionRadar: DashboardDimensionRadarViewModel;
  healthTrend: DashboardHealthTrendViewModel;
  ratioTrend: DashboardRatioTrendViewModel;
  ratioTable: DashboardRatioTableViewModel;
  profitabilityWaterfall: DashboardProfitabilityWaterfallViewModel;
  workingCapital: DashboardWorkingCapitalViewModel;
  scoreContribution: DashboardScoreContributionViewModel;
  executiveSummary: DashboardExecutiveSummaryViewModel;
  principalStrengths: DashboardInsightViewModel[];
  principalRisks: DashboardInsightViewModel[];
  diagnosis: ExecutiveDiagnosisViewModel;
};

export type DashboardKpiViewModel = {
  id: string;
  metricId: string;
  label: string;
  currentValue: FormattedFinancialValue;
  previousValue: FormattedFinancialValue | null;
  movementDisplay: string;
  movementAccessibleText: string;
  direction: DashboardMetricDirection;
  accessibleStatus: string;
  interpretation: string;
  unitLabel: string;
  emphasized: boolean;
};

export type DashboardDimensionViewModel = {
  id: RatioCategory;
  label: string;
  score: number | null;
  displayScore: string;
  accessibleLabel: string;
  status: FinancialHealthClassification;
  tone: DashboardStatusTone;
  coverageDisplay: string;
  coverageValue: number;
  strongestMetricLabel: string;
  weakestMetricLabel: string;
  isStrongest: boolean;
  isWeakest: boolean;
  relativePosition: number | null;
};

export type DashboardInsightEvidenceViewModel = {
  label: string;
  value: string;
  accessibleText: string;
  context: string;
};

export type DashboardInsightViewModel = {
  id: string;
  title: string;
  explanation: string;
  category: "strength" | "risk" | "observation";
  severity: InsightSeverity;
  severityLabel: string;
  trend: TrendDirection;
  trendLabel: string;
  affectedYear: number;
  priority: number;
  supportingMetricLabels: string[];
  evidence: DashboardInsightEvidenceViewModel[];
};

export type DashboardDimensionRadarViewModel = {
  indicators: Array<{
    id: RatioCategory;
    label: string;
    max: 100;
  }>;
  current: {
    year: number;
    values: Array<number | null>;
    displayValues: string[];
  };
  previous: {
    year: number;
    values: Array<number | null>;
    displayValues: string[];
  } | null;
};

export type DashboardHealthTrendViewModel = {
  points: Array<{
    year: number;
    value: number | null;
    displayValue: string;
    classification: FinancialHealthClassification;
  }>;
  summary: string;
};

export type DashboardRatioTrendViewModel = {
  categories: Array<{
    id: RatioCategory;
    label: string;
  }>;
  defaultCategory: RatioCategory;
  defaultMetricId: string;
  metricsByCategory: Record<RatioCategory, DashboardRatioTrendMetricViewModel[]>;
  metricsById: Record<string, DashboardRatioTrendMetricViewModel>;
};

export type DashboardRatioTrendMetricViewModel = {
  metricId: string;
  label: string;
  category: RatioCategory;
  unit: string;
  currentValue: FormattedFinancialValue;
  previousValue: FormattedFinancialValue;
  change: FormattedFinancialValue;
  direction: "Increased" | "Decreased" | "Unchanged" | "Unavailable";
  summary: string;
  accessibleDescription: string;
  points: Array<{
    year: number;
    value: number | null;
    displayValue: string;
    availability: "Available" | "Unavailable";
    unavailableReason?: string;
  }>;
};

export type DashboardRatioTableViewModel = {
  groups: Array<{
    category: RatioCategory;
    label: string;
    rows: DashboardRatioTableRowViewModel[];
  }>;
};

export type DashboardRatioTableRowViewModel = {
  label: string;
  currentValue: FormattedFinancialValue;
  previousValue: FormattedFinancialValue;
  change: FormattedFinancialValue;
  direction: "Increased" | "Decreased" | "Unchanged" | "Unavailable";
  unit: string;
  availability: "Available" | "Unavailable";
  unavailableReason?: string;
  formula: string;
  interpretation: string;
  description: string;
};

export type DashboardWorkingCapitalViewModel = {
  equation: "DSO + DIO - DPO = CCC";
  explanation: string;
  metrics: Array<{
    metricId: string;
    label: string;
    currentValue: FormattedFinancialValue;
    previousValue: FormattedFinancialValue;
    change: FormattedFinancialValue;
    direction: "Increased" | "Decreased" | "Unchanged" | "Unavailable";
    relativePosition: number | null;
  }>;
};

export type DashboardProfitabilityWaterfallViewModel = {
  status: "full" | "partial" | "unavailable";
  summary: string;
  reconciliationNote: string;
  steps: Array<{
    label: string;
    value: FormattedFinancialValue;
    rawValue: number | null;
    kind: "positive" | "negative" | "subtotal" | "total" | "bridge";
  }>;
};

export type DashboardScoreContributionViewModel = {
  dimensions: Array<{
    id: RatioCategory;
    label: string;
    score: number | null;
    contribution: number | null;
    displayContribution: string;
    tone: DashboardStatusTone;
  }>;
  totalDisplay: string;
};

export type DashboardExecutiveSummaryViewModel = {
  overallCondition: string;
  keyImprovement: string;
  primaryConcern: string;
  coverage: string;
};

export type ExecutiveDiagnosisViewModel = {
  headline: string;
  summary: string;
  strongestArea: string;
  primaryPressure: string;
  driverContext: string;
  coverageContext: string;
  disclaimer: string;
};

export type DashboardSessionRecoveryResult =
  | { status: "empty" }
  | { status: "corrupt"; message: string }
  | { status: "invalid"; message: string; issues: string[] }
  | { status: "analysis-error"; message: string }
  | { status: "ready"; viewModel: ExecutiveDashboardViewModel };
