import type { CurrencyCode, FinancialAnalysisInput, ValidationIssue, ValidationResult } from "@/domain";

export type WorkflowStepId =
  | "company"
  | "income-statement"
  | "balance-sheet"
  | "cash-flow"
  | "working-capital"
  | "review";

export type FinancialSectionId = Exclude<WorkflowStepId, "company" | "review">;

export type FinancialInputFormPeriod = {
  year: string;
  incomeStatement: {
    revenue: string;
    costOfGoodsSold: string;
    ebit: string;
    interestExpense: string;
    netIncome: string;
  };
  balanceSheet: {
    cash: string;
    accountsReceivable: string;
    inventory: string;
    currentAssets: string;
    totalAssets: string;
    currentLiabilities: string;
    totalDebt: string;
    equity: string;
  };
  cashFlow: {
    operatingCashFlow: string;
    capitalExpenditure: string;
  };
  workingCapital: {
    averageInventory: string;
    averageReceivables: string;
    averagePayables: string;
  };
};

export type FinancialInputFormValues = {
  company: {
    name: string;
    industry: string;
    currency: CurrencyCode | "";
  };
  periods: [FinancialInputFormPeriod, FinancialInputFormPeriod, FinancialInputFormPeriod];
};

export type FormToCanonicalResult =
  | {
      success: true;
      data: FinancialAnalysisInput;
      validation: ValidationResult;
    }
  | {
      success: false;
      validation: ValidationResult;
    };

export type ValidationFeedback = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
};
