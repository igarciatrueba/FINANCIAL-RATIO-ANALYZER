import type { CanonicalFieldKey, CanonicalFieldMapping } from "@/features/annual-report-ingestion/types";

function normalizeLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export const canonicalFieldMappings: readonly CanonicalFieldMapping[] = [
  { key: "revenue", statementSource: "income_statement", acceptedAliases: ["Revenue", "Net revenue", "Sales", "Net sales", "Turnover", "Operating revenue"], excludedAliases: ["Gross profit", "Segment revenue", "Order intake"], extraction: "direct" },
  { key: "costOfGoodsSold", statementSource: "income_statement", acceptedAliases: ["Cost of goods sold", "Cost of sales", "Cost of revenue", "Cost of products sold"], excludedAliases: ["Operating expenses", "Selling general and administrative expenses", "Depreciation"], extraction: "direct" },
  { key: "ebit", statementSource: "income_statement", acceptedAliases: ["EBIT", "Earnings before interest and tax", "Operating profit"], excludedAliases: ["EBITDA", "Adjusted EBITDA", "EBITA", "Profit before tax"], extraction: "direct" },
  { key: "interestExpense", statementSource: "income_statement", acceptedAliases: ["Interest expense", "Finance costs", "Finance expense"], excludedAliases: ["Interest income", "Finance income", "Net interest income"], extraction: "direct" },
  { key: "netIncome", statementSource: "income_statement", acceptedAliases: ["Net income", "Net profit", "Profit for the year", "Profit after tax"], excludedAliases: ["Comprehensive income", "Earnings per share", "Adjusted profit"], extraction: "direct" },
  { key: "cash", statementSource: "balance_sheet", acceptedAliases: ["Cash and cash equivalents", "Cash", "Cash and short-term deposits"], excludedAliases: ["Restricted cash"], extraction: "direct" },
  { key: "accountsReceivable", statementSource: "balance_sheet", acceptedAliases: ["Trade receivables", "Accounts receivable"], excludedAliases: ["Contract assets", "Other receivables"], extraction: "direct" },
  { key: "inventory", statementSource: "balance_sheet", acceptedAliases: ["Inventories", "Inventory", "Stocks"], excludedAliases: ["Biological assets", "Finished goods"], extraction: "direct" },
  { key: "currentAssets", statementSource: "balance_sheet", acceptedAliases: ["Current assets", "Total current assets"], excludedAliases: ["Working capital", "Liquid assets"], extraction: "direct" },
  { key: "totalAssets", statementSource: "balance_sheet", acceptedAliases: ["Total assets"], excludedAliases: ["Current assets", "Net assets"], extraction: "direct" },
  { key: "currentLiabilities", statementSource: "balance_sheet", acceptedAliases: ["Current liabilities", "Total current liabilities"], excludedAliases: ["Current debt", "Working capital"], extraction: "direct" },
  { key: "totalDebt", statementSource: "balance_sheet", acceptedAliases: ["Total debt", "Borrowings", "Interest-bearing debt"], excludedAliases: ["Net debt", "Lease liabilities"], extraction: "direct-or-derived", derivationId: "total-debt-components" },
  { key: "equity", statementSource: "balance_sheet", acceptedAliases: ["Total equity", "Shareholders' equity", "Shareholders equity"], excludedAliases: ["Market capitalization", "Tangible equity", "Non-controlling interests"], extraction: "direct" },
  { key: "operatingCashFlow", statementSource: "cash_flow", acceptedAliases: ["Net cash from operating activities", "Cash generated from operations", "Operating cash flow"], excludedAliases: ["Free cash flow", "EBITDA", "Operating profit"], extraction: "direct" },
  { key: "capitalExpenditure", statementSource: "cash_flow", acceptedAliases: ["Capital expenditure", "Purchases of property plant and equipment", "Additions to PPE"], excludedAliases: ["Total investing cash flow", "Acquisitions", "Depreciation"], extraction: "direct" },
  { key: "averageInventory", statementSource: "working_capital", acceptedAliases: [], excludedAliases: ["Inventory", "Inventories"], extraction: "derived", derivationId: "average-closing-balances" },
  { key: "averageReceivables", statementSource: "working_capital", acceptedAliases: [], excludedAliases: ["Accounts receivable", "Trade receivables"], extraction: "derived", derivationId: "average-closing-balances" },
  { key: "averagePayables", statementSource: "working_capital", acceptedAliases: [], excludedAliases: ["Accounts payable", "Trade payables"], extraction: "derived", derivationId: "average-closing-balances" },
];

export function isExplicitlyExcludedLabel(field: CanonicalFieldKey, label: string) {
  const normalized = normalizeLabel(label);
  return canonicalFieldMappings.find((mapping) => mapping.key === field)?.excludedAliases.some((alias) => normalizeLabel(alias) === normalized) ?? false;
}

export function findCanonicalFieldMapping(label: string) {
  const normalized = normalizeLabel(label);
  return canonicalFieldMappings.find((mapping) =>
    mapping.acceptedAliases.some((alias) => normalizeLabel(alias) === normalized)
  ) ?? null;
}
