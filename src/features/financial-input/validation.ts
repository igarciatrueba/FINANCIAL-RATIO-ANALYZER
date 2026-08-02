import type { FinancialAnalysisInput, FinancialPeriod, ValidationIssue } from "@/domain";
import type { ValidationFeedback } from "@/features/financial-input/types";

function issue(
  id: string,
  path: string,
  severity: ValidationIssue["severity"],
  message: string,
  suggestion: string,
  year?: number
): ValidationIssue {
  return {
    id,
    path,
    severity,
    message,
    suggestion,
    year,
  };
}

function periodPath(index: number, path: string) {
  return `periods.${index}.${path}`;
}

function createRelationshipWarnings(period: FinancialPeriod, index: number): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  const { balanceSheet } = period;

  if (balanceSheet.cash > balanceSheet.currentAssets) {
    warnings.push(
      issue(
        `cash-greater-than-current-assets-${period.year}`,
        periodPath(index, "balanceSheet.cash"),
        "warning",
        "Cash is greater than current assets.",
        "Review cash and current assets for this period.",
        period.year
      )
    );
  }

  if (balanceSheet.accountsReceivable > balanceSheet.currentAssets) {
    warnings.push(
      issue(
        `receivables-greater-than-current-assets-${period.year}`,
        periodPath(index, "balanceSheet.accountsReceivable"),
        "warning",
        "Accounts receivable are greater than current assets.",
        "Review receivables and current assets for this period.",
        period.year
      )
    );
  }

  if (balanceSheet.inventory > balanceSheet.currentAssets) {
    warnings.push(
      issue(
        `inventory-greater-than-current-assets-${period.year}`,
        periodPath(index, "balanceSheet.inventory"),
        "warning",
        "Inventory is greater than current assets.",
        "Review inventory and current assets for this period.",
        period.year
      )
    );
  }

  if (balanceSheet.currentAssets > balanceSheet.totalAssets) {
    warnings.push(
      issue(
        `current-assets-greater-than-total-assets-${period.year}`,
        periodPath(index, "balanceSheet.currentAssets"),
        "warning",
        "Current assets are greater than total assets.",
        "Review current assets and total assets for this period.",
        period.year
      )
    );
  }

  return warnings;
}

function createDenominatorWarnings(period: FinancialPeriod, index: number): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];

  const checks: Array<{
    id: string;
    path: string;
    value: number;
    message: string;
    suggestion: string;
  }> = [
    {
      id: "revenue-denominator",
      path: "incomeStatement.revenue",
      value: period.incomeStatement.revenue,
      message: "Revenue is zero or negative, so revenue-based ratios may be unavailable.",
      suggestion: "Revenue can be unusual, but margins and turnover metrics need positive revenue.",
    },
    {
      id: "current-liabilities-denominator",
      path: "balanceSheet.currentLiabilities",
      value: period.balanceSheet.currentLiabilities,
      message: "Current liabilities are zero or negative, so liquidity ratios may be unavailable.",
      suggestion: "Review current liabilities if liquidity ratios should be calculated.",
    },
    {
      id: "total-assets-denominator",
      path: "balanceSheet.totalAssets",
      value: period.balanceSheet.totalAssets,
      message: "Total assets are zero or negative, so asset-based ratios may be unavailable.",
      suggestion: "Review total assets if ROA, debt-to-assets or asset turnover should be calculated.",
    },
    {
      id: "equity-denominator",
      path: "balanceSheet.equity",
      value: period.balanceSheet.equity,
      message: "Equity is zero or negative, so equity-based ratios may be unavailable.",
      suggestion: "Review equity if ROE or debt-to-equity should be calculated.",
    },
    {
      id: "average-inventory-denominator",
      path: "workingCapital.averageInventory",
      value: period.workingCapital.averageInventory,
      message: "Average inventory is zero or negative, so inventory turnover may be unavailable.",
      suggestion: "Use a positive average inventory balance when inventory analysis is required.",
    },
    {
      id: "average-receivables-denominator",
      path: "workingCapital.averageReceivables",
      value: period.workingCapital.averageReceivables,
      message: "Average receivables are zero or negative, so receivables turnover may be unavailable.",
      suggestion: "Use a positive average receivables balance when receivables analysis is required.",
    },
    {
      id: "average-payables-denominator",
      path: "workingCapital.averagePayables",
      value: period.workingCapital.averagePayables,
      message: "Average payables are zero or negative, so payables days may be unavailable.",
      suggestion: "Use a positive average payables balance when payables analysis is required.",
    },
    {
      id: "interest-expense-denominator",
      path: "incomeStatement.interestExpense",
      value: period.incomeStatement.interestExpense,
      message: "Interest expense is zero or negative, so interest coverage may be unavailable.",
      suggestion: "This warning does not block analysis, but interest coverage needs positive interest expense.",
    },
  ];

  for (const check of checks) {
    if (check.value <= 0) {
      warnings.push(
        issue(
          `${check.id}-${period.year}`,
          periodPath(index, check.path),
          "warning",
          check.message,
          check.suggestion,
          period.year
        )
      );
    }
  }

  return warnings;
}

export function createInformationalNotices(hasLoadedDemo: boolean): ValidationIssue[] {
  const notices: ValidationIssue[] = [
    issue(
      "capex-positive-convention",
      "periods",
      "info",
      "Enter CapEx as a positive expenditure; Free Cash Flow is calculated as Operating Cash Flow minus CapEx.",
      "Keep CapEx positive unless the source statement explicitly presents a reversal."
    ),
    issue(
      "oldest-period-average-balance-fallback",
      "periods.0",
      "info",
      "For oldest-period average-balance ratios, the engine uses the current closing balance as the documented fallback.",
      "Later periods use previous and current closing balances where applicable."
    ),
    issue(
      "educational-analysis-notice",
      "company",
      "info",
      "This is an educational analytical tool, not a credit rating, investment recommendation, audit opinion or professional substitute.",
      "Use the accepted dataset for transparent ratio analysis only."
    ),
  ];

  if (hasLoadedDemo) {
    notices.push(
      issue(
        "fictional-demo-data-notice",
        "company",
        "info",
        "Loaded demo-company data is fictional and internally constructed for analytical demonstration.",
        "Edit the values freely or reset the form before entering another company."
      )
    );
  }

  return notices;
}

export function createFinancialValidationFeedback(
  input: FinancialAnalysisInput | null,
  hasLoadedDemo: boolean
): ValidationFeedback {
  const warnings = input
    ? input.periods.flatMap((period, index) => [
        ...createRelationshipWarnings(period, index),
        ...createDenominatorWarnings(period, index),
      ])
    : [];

  return {
    errors: [],
    warnings,
    infos: createInformationalNotices(hasLoadedDemo),
  };
}
