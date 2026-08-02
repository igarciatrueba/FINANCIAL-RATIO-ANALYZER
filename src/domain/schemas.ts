import { z } from "zod";

import type {
  FinancialAnalysisInput,
  ParseFinancialAnalysisInputResult,
  ValidationIssue,
  ValidationResult,
} from "@/domain/types";

const finiteNumberSchema = z.number({
  required_error: "A numeric value is required.",
  invalid_type_error: "Value must be entered as a number.",
}).finite("Value must be finite.");

export const currencyCodeSchema = z.enum(["EUR", "USD", "GBP"]);

export const companyProfileSchema = z
  .object({
    id: z.string().trim().min(1, "Company id is required."),
    name: z.string().trim().min(1, "Company name is required."),
    industry: z.string().trim().min(1, "Industry is required."),
    currency: currencyCodeSchema,
  })
  .strict();

export const incomeStatementSchema = z
  .object({
    revenue: finiteNumberSchema,
    costOfGoodsSold: finiteNumberSchema,
    ebit: finiteNumberSchema,
    interestExpense: finiteNumberSchema,
    netIncome: finiteNumberSchema,
  })
  .strict();

export const extendedIncomeStatementSchema = incomeStatementSchema.extend({
  grossProfit: finiteNumberSchema.optional(),
  operatingExpenses: finiteNumberSchema.optional(),
  taxExpense: finiteNumberSchema.optional(),
});

export const balanceSheetSchema = z
  .object({
    cash: finiteNumberSchema,
    accountsReceivable: finiteNumberSchema,
    inventory: finiteNumberSchema,
    currentAssets: finiteNumberSchema,
    totalAssets: finiteNumberSchema,
    currentLiabilities: finiteNumberSchema,
    totalDebt: finiteNumberSchema,
    equity: finiteNumberSchema,
  })
  .strict();

export const extendedBalanceSheetSchema = balanceSheetSchema.extend({
  accountsPayable: finiteNumberSchema.optional(),
  propertyPlantEquipment: finiteNumberSchema.optional(),
  longTermDebt: finiteNumberSchema.optional(),
  totalLiabilities: finiteNumberSchema.optional(),
});

export const cashFlowStatementSchema = z
  .object({
    operatingCashFlow: finiteNumberSchema,
    capitalExpenditure: finiteNumberSchema,
  })
  .strict();

export const extendedCashFlowStatementSchema = cashFlowStatementSchema.extend({
  investingCashFlow: finiteNumberSchema.optional(),
  financingCashFlow: finiteNumberSchema.optional(),
  netChangeInCash: finiteNumberSchema.optional(),
});

export const workingCapitalInputsSchema = z
  .object({
    averageInventory: finiteNumberSchema,
    averageReceivables: finiteNumberSchema,
    averagePayables: finiteNumberSchema,
  })
  .strict();

export const financialPeriodSchema = z
  .object({
    year: z.number({ invalid_type_error: "Reporting year must be a number." }).int("Reporting year must be an integer."),
    incomeStatement: incomeStatementSchema,
    balanceSheet: balanceSheetSchema,
    cashFlow: cashFlowStatementSchema,
    workingCapital: workingCapitalInputsSchema,
  })
  .strict();

export const financialAnalysisInputSchema = z
  .object({
    company: companyProfileSchema,
    periods: z.tuple([financialPeriodSchema, financialPeriodSchema, financialPeriodSchema], {
      required_error: "Exactly three reporting periods are required.",
      invalid_type_error: "Periods must contain exactly three reporting periods.",
    }),
  })
  .strict()
  .superRefine((input, context) => {
    const years = input.periods.map((period) => period.year);
    const uniqueYears = new Set(years);

    if (uniqueYears.size !== years.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periods"],
        message: "Reporting years must be unique.",
        params: {
          id: "period-years-unique",
          suggestion: "Use one distinct annual reporting year for each period.",
        },
      });
    }

    const chronological = years.every((year, index) => index === 0 || year > years[index - 1]);

    if (!chronological) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periods"],
        message: "Reporting years must be chronological.",
        params: {
          id: "period-years-chronological",
          suggestion: "Order periods from oldest year to newest year.",
        },
      });
    }
  });

function pathToString(path: Array<string | number>) {
  return path.join(".");
}

function issueIdForPath(path: string) {
  return path ? `schema-${path}` : "schema-root";
}

function createValidationResult(issues: ValidationIssue[]): ValidationResult {
  const blockingIssueCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    valid: blockingIssueCount === 0,
    issues,
    blockingIssueCount,
    warningCount,
  };
}

function zodIssueToValidationIssue(issue: z.ZodIssue): ValidationIssue {
  const path = pathToString(issue.path);
  const params = issue.code === z.ZodIssueCode.custom ? issue.params : undefined;

  return {
    id: typeof params?.id === "string" ? params.id : issueIdForPath(path),
    path,
    severity: "error",
    message: issue.message,
    suggestion: typeof params?.suggestion === "string" ? params.suggestion : undefined,
  };
}

export function parseFinancialAnalysisInput(input: unknown): ParseFinancialAnalysisInputResult {
  const result = financialAnalysisInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      validation: createValidationResult(result.error.issues.map(zodIssueToValidationIssue)),
    };
  }

  return {
    success: true,
    data: result.data satisfies FinancialAnalysisInput,
    validation: createValidationResult([]),
  };
}
