export const canonicalFinancialFieldKeys = [
  "revenue",
  "costOfGoodsSold",
  "ebit",
  "interestExpense",
  "netIncome",
  "cash",
  "accountsReceivable",
  "inventory",
  "currentAssets",
  "totalAssets",
  "currentLiabilities",
  "totalDebt",
  "equity",
  "operatingCashFlow",
  "capitalExpenditure",
  "averageInventory",
  "averageReceivables",
  "averagePayables",
] as const;

export type CanonicalFieldKey = typeof canonicalFinancialFieldKeys[number];

export type FiscalPeriodIdentity = {
  label: string;
  year?: number;
  endDate?: string;
};

export type DetectedFiscalPeriod = FiscalPeriodIdentity & {
  sourceColumnIndex: number;
};

export type ExtractionPeriodSlot = {
  slotIndex: 0 | 1 | 2;
  fiscalPeriod: FiscalPeriodIdentity | null;
  resolution: "resolved" | "manual_input_required";
};

export type StatementSource = "income_statement" | "balance_sheet" | "cash_flow" | "working_capital";

export type CanonicalFieldMapping = {
  key: CanonicalFieldKey;
  statementSource: StatementSource;
  acceptedAliases: readonly string[];
  excludedAliases: readonly string[];
  extraction: "direct" | "derived" | "direct-or-derived";
  derivationId?: "total-debt-components" | "average-closing-balances";
};
