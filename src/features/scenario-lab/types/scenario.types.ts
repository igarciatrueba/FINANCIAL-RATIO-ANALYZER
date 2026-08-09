import type {
  CurrencyCode,
  FinancialHealthClassification,
  FinancialAnalysisInput,
  FinancialAnalysisResult,
  RatioCategory,
  ScenarioAssumptions,
  ScenarioPresetId,
  ScenarioTransformationMetadata,
  ScenarioValidationIssue,
} from "@/domain";
import type {
  DashboardMetricDirection,
  DashboardInsightViewModel,
  FormattedFinancialValue,
} from "@/features/executive-dashboard/types/dashboard.types";

export type ScenarioPipelineResult =
  | {
      status: "success";
      input: FinancialAnalysisInput;
      analysis: FinancialAnalysisResult;
      metadata: ScenarioTransformationMetadata;
    }
  | {
      status: "transformation-error";
      issues: ScenarioValidationIssue[];
    }
  | {
      status: "canonical-validation-error";
      issues: string[];
    }
  | {
      status: "analysis-error";
      message: string;
    };

export type ScenarioComparisonViewModel = {
  company: {
    name: string;
    industry: string;
    currency: CurrencyCode;
  };
  period: {
    latestYear: number;
    comparisonLabel: string;
  };
  selectedPresetId: ScenarioPresetId | "custom" | null;
  selectedPresetLabel: string;
  assumptions: ScenarioAssumptions;
  score: {
    base: ScenarioScoreValue;
    scenario: ScenarioScoreValue;
    delta: FormattedFinancialValue;
    direction: DashboardMetricDirection;
    coverageDelta: FormattedFinancialValue;
    headline: string;
  };
  dimensions: ScenarioDimensionComparison[];
  dimensionChart: ScenarioDimensionChartViewModel;
  keyMetrics: ScenarioMetricComparison[];
  insightComparison: ScenarioInsightComparison;
  dupont: ScenarioDupontComparison;
  changedFields: ScenarioChangedFieldViewModel[];
  methodology: {
    summary: string;
    propagationRules: Array<{
      label: string;
      sourceLabel: string;
      transformation: string;
      affectedValues: string;
      balancingAssumption: string;
      limitation: string;
    }>;
    limitations: string[];
  };
};

export type ScenarioScoreValue = {
  raw: number | null;
  display: string;
  classification: FinancialHealthClassification;
  coverageDisplay: string;
};

export type ScenarioDimensionComparison = {
  label: string;
  baseScore: FormattedFinancialValue;
  scenarioScore: FormattedFinancialValue;
  delta: FormattedFinancialValue;
  direction: DashboardMetricDirection;
  category: RatioCategory;
};

export type ScenarioDimensionChartViewModel = {
  categories: string[];
  baseValues: Array<number | null>;
  scenarioValues: Array<number | null>;
  summary: string;
};

export type ScenarioMetricComparison = {
  label: string;
  baseValue: FormattedFinancialValue;
  scenarioValue: FormattedFinancialValue;
  absoluteChange: FormattedFinancialValue;
  percentageChange: FormattedFinancialValue;
  direction: DashboardMetricDirection;
  unitLabel: string;
  availability: "Available" | "Unavailable";
  interpretation: string;
};

export type ScenarioInsightComparison = {
  newStrengths: DashboardInsightViewModel[];
  resolvedStrengths: DashboardInsightViewModel[];
  newRisks: DashboardInsightViewModel[];
  resolvedRisks: DashboardInsightViewModel[];
  persistentRisks: DashboardInsightViewModel[];
  scenarioStrengths: DashboardInsightViewModel[];
  scenarioRisks: DashboardInsightViewModel[];
};

export type ScenarioDupontComparison = {
  factors: Array<{
    label: string;
    baseValue: FormattedFinancialValue;
    scenarioValue: FormattedFinancialValue;
    delta: FormattedFinancialValue;
    direction: DashboardMetricDirection | "contextual";
    meaning: string;
  }>;
  summary: string;
};

export type ScenarioChangedFieldViewModel = {
  label: string;
  baseValue: FormattedFinancialValue;
  scenarioValue: FormattedFinancialValue;
  change: FormattedFinancialValue;
  path: string;
};

export type ScenarioSessionRecoveryResult =
  | { status: "empty" }
  | { status: "corrupt"; message: string }
  | { status: "invalid"; message: string; issues: string[] }
  | { status: "analysis-error"; message: string }
  | {
      status: "ready";
      baseInput: FinancialAnalysisInput;
      baseAnalysis: FinancialAnalysisResult;
      initialViewModel: ScenarioComparisonViewModel;
    };
