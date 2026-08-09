import type { CurrencyCode } from "@/domain";
import type { DupontFactorId } from "@/domain/dupont";
import type { FormattedFinancialValue } from "@/features/executive-dashboard/types/dashboard.types";

export type DupontDirection = "favourable" | "unfavourable" | "neutral" | "contextual" | "unavailable";

export type DupontFactorViewModel = {
  id: DupontFactorId;
  label: string;
  current: FormattedFinancialValue;
  previous: FormattedFinancialValue;
  change: FormattedFinancialValue;
  rawCurrent: number | null;
  rawPrevious: number | null;
  rawChange: number | null;
  unit: string;
  direction: DupontDirection;
  directionLabel: string;
  meaning: string;
};

export type DupontAttributionViewModel =
  | {
      status: "available";
      totalChange: FormattedFinancialValue;
      totalChangeRaw: number;
      reconciliationDifference: number;
      tolerance: number;
      primaryDriver: DupontAttributionContributionViewModel | null;
      contributions: DupontAttributionContributionViewModel[];
      reconciliation: DupontAttributionReconciliationViewModel;
      summary: string;
    }
  | {
      status: "unavailable";
      reason: string;
      tolerance: number;
      primaryDriver: null;
      contributions: [];
      reconciliation: DupontAttributionReconciliationViewModel;
      summary: string;
    }
  | {
      status: "failed";
      reason: string;
      totalChange: FormattedFinancialValue;
      totalChangeRaw: number;
      reconciliationDifference: number;
      tolerance: number;
      primaryDriver: DupontAttributionContributionViewModel | null;
      contributions: DupontAttributionContributionViewModel[];
      reconciliation: DupontAttributionReconciliationViewModel;
      summary: string;
    };

export type DupontAttributionReconciliationViewModel = {
  label: "Attribution reconciliation";
  equation: string;
  status: "reconciled" | "unavailable" | "failed";
  statusLabel: "Reconciled" | "Unavailable" | "Failed";
  totalAttributedChange: FormattedFinancialValue;
  actualRoeChange: FormattedFinancialValue;
  difference: FormattedFinancialValue;
  tolerance: FormattedFinancialValue;
  toleranceRaw: number;
};

export type DupontAttributionContributionViewModel = {
  factorId: DupontFactorId;
  label: string;
  value: FormattedFinancialValue;
  rawValue: number;
  direction: "positive" | "negative" | "neutral";
};

export type DupontFactorTrendViewModel = {
  years: number[];
  series: Array<{
    id: "roe" | DupontFactorId;
    label: string;
    unit: "percentage" | "multiple";
    baseYear: number | null;
    baseValue: number | null;
    points: Array<{
      year: number;
      rawValue: number | null;
      displayValue: string;
    }>;
    indexedPoints: Array<{
      year: number;
      indexedValue: number | null;
    }>;
  }>;
  indexDisclosure: {
    title: "Indexed trend";
    summary: "Base: first available year = 100";
    detail: string;
  };
  summary: string;
};

export type DupontAnalysisViewModel = {
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
    dashboard: "/analysis";
    editInput: "/input";
    methodology: "/methodology";
  };
  availability: {
    label: string;
    description: string;
  };
  overview: {
    currentRoe: FormattedFinancialValue;
    previousRoe: FormattedFinancialValue;
    change: FormattedFinancialValue;
    rawChange: number | null;
    direction: DupontDirection;
    directionLabel: string;
    reconciliationStatus: "Reconciled" | "Approximate" | "Unavailable";
  };
  identity: {
    text: string;
    factors: DupontFactorViewModel[];
    result: FormattedFinancialValue;
    reconciliationText: string;
  };
  factorComparison: DupontFactorViewModel[];
  attribution: DupontAttributionViewModel;
  trends: DupontFactorTrendViewModel;
  explanation: {
    headline: string;
    text: string;
    operatingContext: string;
  };
  leverageContext: string;
  methodology: {
    identity: string;
    factorDefinitions: string[];
    averageBalanceConvention: string;
    attributionMethod: string;
    tolerance: string;
    unavailableConditions: string;
    disclaimer: string;
  };
};

export type DupontSessionRecoveryResult =
  | { status: "empty" }
  | { status: "corrupt"; message: string }
  | { status: "invalid"; message: string; issues: string[] }
  | { status: "analysis-error"; message: string }
  | { status: "ready"; viewModel: DupontAnalysisViewModel };
