import { parseFinancialAnalysisInput, type CurrencyCode, type FinancialAnalysisInput, type ValidationIssue } from "@/domain";
import type {
  FinancialInputFormPeriod,
  FinancialInputFormValues,
  FormToCanonicalResult,
} from "@/features/financial-input/types";
import { parseIntegerString, parsePlainNumber } from "@/features/financial-input/numeric-parser";

const emptyPeriod = (): FinancialInputFormPeriod => ({
  year: "",
  incomeStatement: {
    revenue: "",
    costOfGoodsSold: "",
    ebit: "",
    interestExpense: "",
    netIncome: "",
  },
  balanceSheet: {
    cash: "",
    accountsReceivable: "",
    inventory: "",
    currentAssets: "",
    totalAssets: "",
    currentLiabilities: "",
    totalDebt: "",
    equity: "",
  },
  cashFlow: {
    operatingCashFlow: "",
    capitalExpenditure: "",
  },
  workingCapital: {
    averageInventory: "",
    averageReceivables: "",
    averagePayables: "",
  },
});

export function createEmptyFinancialInputForm(): FinancialInputFormValues {
  return {
    company: {
      name: "",
      industry: "",
      currency: "EUR",
    },
    periods: [emptyPeriod(), emptyPeriod(), emptyPeriod()],
  };
}

export function generateCompanyId(name: string): string {
  const slug = name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "company";
}

function numberToFormValue(value: number) {
  return String(value);
}

export function financialInputToFormValues(input: FinancialAnalysisInput): FinancialInputFormValues {
  return {
    company: {
      name: input.company.name,
      industry: input.company.industry,
      currency: input.company.currency,
    },
    periods: input.periods.map((period) => ({
      year: numberToFormValue(period.year),
      incomeStatement: {
        revenue: numberToFormValue(period.incomeStatement.revenue),
        costOfGoodsSold: numberToFormValue(period.incomeStatement.costOfGoodsSold),
        ebit: numberToFormValue(period.incomeStatement.ebit),
        interestExpense: numberToFormValue(period.incomeStatement.interestExpense),
        netIncome: numberToFormValue(period.incomeStatement.netIncome),
      },
      balanceSheet: {
        cash: numberToFormValue(period.balanceSheet.cash),
        accountsReceivable: numberToFormValue(period.balanceSheet.accountsReceivable),
        inventory: numberToFormValue(period.balanceSheet.inventory),
        currentAssets: numberToFormValue(period.balanceSheet.currentAssets),
        totalAssets: numberToFormValue(period.balanceSheet.totalAssets),
        currentLiabilities: numberToFormValue(period.balanceSheet.currentLiabilities),
        totalDebt: numberToFormValue(period.balanceSheet.totalDebt),
        equity: numberToFormValue(period.balanceSheet.equity),
      },
      cashFlow: {
        operatingCashFlow: numberToFormValue(period.cashFlow.operatingCashFlow),
        capitalExpenditure: numberToFormValue(period.cashFlow.capitalExpenditure),
      },
      workingCapital: {
        averageInventory: numberToFormValue(period.workingCapital.averageInventory),
        averageReceivables: numberToFormValue(period.workingCapital.averageReceivables),
        averagePayables: numberToFormValue(period.workingCapital.averagePayables),
      },
    })) as FinancialInputFormValues["periods"],
  };
}

function createError(path: string, message: string, suggestion?: string): ValidationIssue {
  return {
    id: `form-${path}`,
    path,
    severity: "error",
    message,
    suggestion,
  };
}

function createValidationFailure(issues: ValidationIssue[]): Extract<FormToCanonicalResult, { success: false }> {
  return {
    success: false,
    validation: {
      valid: false,
      issues,
      blockingIssueCount: issues.length,
      warningCount: 0,
    },
  };
}

function parseRequiredNumber(value: string, path: string, label: string, issues: ValidationIssue[]) {
  const parsed = parsePlainNumber(value);

  if (!parsed.success) {
    issues.push(
      createError(
        path,
        parsed.code === "required" ? `${label} is required.` : parsed.message,
        "Use plain numbers without currency symbols or thousands separators."
      )
    );
    return 0;
  }

  return parsed.value;
}

function parseRequiredYear(value: string, path: string, label: string, issues: ValidationIssue[]) {
  const parsed = parseIntegerString(value, label);

  if (!parsed.success) {
    issues.push(createError(path, parsed.message, "Enter a four-digit annual reporting year."));
    return 0;
  }

  return parsed.value;
}

export function transformFormValuesToCanonical(values: FinancialInputFormValues): FormToCanonicalResult {
  const issues: ValidationIssue[] = [];

  const companyName = values.company.name.trim();
  const industry = values.company.industry.trim();

  if (!companyName) {
    issues.push(createError("company.name", "Company name is required.", "Enter the company's display name."));
  }

  if (!industry) {
    issues.push(createError("company.industry", "Industry is required.", "Enter the company's industry."));
  }

  if (!["EUR", "USD", "GBP"].includes(values.company.currency)) {
    issues.push(createError("company.currency", "Select a supported currency.", "Choose EUR, USD or GBP."));
  }

  const periods = values.periods.map((period, periodIndex) => {
    const yearLabel = `Reporting year ${periodIndex + 1}`;

    return {
      year: parseRequiredYear(period.year, `periods.${periodIndex}.year`, yearLabel, issues),
      incomeStatement: {
        revenue: parseRequiredNumber(
          period.incomeStatement.revenue,
          `periods.${periodIndex}.incomeStatement.revenue`,
          "Revenue",
          issues
        ),
        costOfGoodsSold: parseRequiredNumber(
          period.incomeStatement.costOfGoodsSold,
          `periods.${periodIndex}.incomeStatement.costOfGoodsSold`,
          "Cost of Goods Sold",
          issues
        ),
        ebit: parseRequiredNumber(period.incomeStatement.ebit, `periods.${periodIndex}.incomeStatement.ebit`, "EBIT", issues),
        interestExpense: parseRequiredNumber(
          period.incomeStatement.interestExpense,
          `periods.${periodIndex}.incomeStatement.interestExpense`,
          "Interest Expense",
          issues
        ),
        netIncome: parseRequiredNumber(
          period.incomeStatement.netIncome,
          `periods.${periodIndex}.incomeStatement.netIncome`,
          "Net Income",
          issues
        ),
      },
      balanceSheet: {
        cash: parseRequiredNumber(period.balanceSheet.cash, `periods.${periodIndex}.balanceSheet.cash`, "Cash", issues),
        accountsReceivable: parseRequiredNumber(
          period.balanceSheet.accountsReceivable,
          `periods.${periodIndex}.balanceSheet.accountsReceivable`,
          "Accounts Receivable",
          issues
        ),
        inventory: parseRequiredNumber(
          period.balanceSheet.inventory,
          `periods.${periodIndex}.balanceSheet.inventory`,
          "Inventory",
          issues
        ),
        currentAssets: parseRequiredNumber(
          period.balanceSheet.currentAssets,
          `periods.${periodIndex}.balanceSheet.currentAssets`,
          "Current Assets",
          issues
        ),
        totalAssets: parseRequiredNumber(
          period.balanceSheet.totalAssets,
          `periods.${periodIndex}.balanceSheet.totalAssets`,
          "Total Assets",
          issues
        ),
        currentLiabilities: parseRequiredNumber(
          period.balanceSheet.currentLiabilities,
          `periods.${periodIndex}.balanceSheet.currentLiabilities`,
          "Current Liabilities",
          issues
        ),
        totalDebt: parseRequiredNumber(
          period.balanceSheet.totalDebt,
          `periods.${periodIndex}.balanceSheet.totalDebt`,
          "Total Debt",
          issues
        ),
        equity: parseRequiredNumber(period.balanceSheet.equity, `periods.${periodIndex}.balanceSheet.equity`, "Equity", issues),
      },
      cashFlow: {
        operatingCashFlow: parseRequiredNumber(
          period.cashFlow.operatingCashFlow,
          `periods.${periodIndex}.cashFlow.operatingCashFlow`,
          "Operating Cash Flow",
          issues
        ),
        capitalExpenditure: parseRequiredNumber(
          period.cashFlow.capitalExpenditure,
          `periods.${periodIndex}.cashFlow.capitalExpenditure`,
          "Capital Expenditure",
          issues
        ),
      },
      workingCapital: {
        averageInventory: parseRequiredNumber(
          period.workingCapital.averageInventory,
          `periods.${periodIndex}.workingCapital.averageInventory`,
          "Average Inventory",
          issues
        ),
        averageReceivables: parseRequiredNumber(
          period.workingCapital.averageReceivables,
          `periods.${periodIndex}.workingCapital.averageReceivables`,
          "Average Receivables",
          issues
        ),
        averagePayables: parseRequiredNumber(
          period.workingCapital.averagePayables,
          `periods.${periodIndex}.workingCapital.averagePayables`,
          "Average Payables",
          issues
        ),
      },
    };
  });

  if (issues.length > 0) {
    return createValidationFailure(issues);
  }

  const candidate = {
    company: {
      id: generateCompanyId(companyName),
      name: companyName,
      industry,
      currency: values.company.currency as CurrencyCode,
    },
    periods,
  };

  const parsed = parseFinancialAnalysisInput(candidate);

  if (!parsed.success) {
    return parsed;
  }

  return parsed;
}
