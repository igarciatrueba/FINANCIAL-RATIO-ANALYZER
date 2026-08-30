import type { FinancialAnalysisInput } from "@/domain";

export type PersistedStatementType = "income_statement" | "balance_sheet" | "cash_flow" | "working_capital";

export type CanonicalStatementValueRow = {
  metricKey: string;
  value: string;
  source: "manual" | "demo" | "import" | "scenario";
};

export type CanonicalStatementRow = {
  datasetVersionId: string;
  statementType: PersistedStatementType;
  periodYear: number;
  currency: FinancialAnalysisInput["company"]["currency"];
  values: CanonicalStatementValueRow[];
};

const statementDefinitions: Array<{
  statementType: PersistedStatementType;
  sourceKey: "incomeStatement" | "balanceSheet" | "cashFlow" | "workingCapital";
}> = [
  { statementType: "income_statement", sourceKey: "incomeStatement" },
  { statementType: "balance_sheet", sourceKey: "balanceSheet" },
  { statementType: "cash_flow", sourceKey: "cashFlow" },
  { statementType: "working_capital", sourceKey: "workingCapital" },
];

export function canonicalInputToStatementRows(
  input: FinancialAnalysisInput,
  datasetVersionId: string,
  source: CanonicalStatementValueRow["source"] = "manual"
): CanonicalStatementRow[] {
  return input.periods.flatMap((period) =>
    statementDefinitions.map(({ statementType, sourceKey }) => ({
      datasetVersionId,
      statementType,
      periodYear: period.year,
      currency: input.company.currency,
      values: Object.entries(period[sourceKey]).map(([metricKey, value]) => ({
        metricKey,
        value: String(value),
        source,
      })),
    }))
  );
}
