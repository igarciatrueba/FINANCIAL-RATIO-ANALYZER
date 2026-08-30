import type { DetectedFiscalPeriod } from "@/features/annual-report-ingestion/types";
import type { LayoutRow } from "@/features/annual-report-ingestion/lib/reconstruct-layout";

export type DiscoveredFinancialStatement = {
  statementType: "income_statement" | "balance_sheet" | "cash_flow" | "working_capital";
  statementScope: "consolidated" | "parent" | "unknown";
  currency: "EUR" | "USD" | "GBP" | null;
  scale: "units" | "thousands" | "millions" | "billions" | "unknown";
  periods: DetectedFiscalPeriod[];
};

function normalizedText(rows: LayoutRow[]) {
  return rows.flatMap((row) => row.cells.map((cell) => cell.text)).join(" ").toLowerCase();
}

function findStatementType(text: string): DiscoveredFinancialStatement["statementType"] | null {
  if (/income statement|statement of profit or loss|statement of operations/.test(text)) return "income_statement";
  if (/balance sheet|statement of financial position/.test(text)) return "balance_sheet";
  if (/cash flow statement|statement of cash flows/.test(text)) return "cash_flow";
  return null;
}

function findCurrency(text: string): DiscoveredFinancialStatement["currency"] {
  if (/\beur\b|€/.test(text)) return "EUR";
  if (/\busd\b|us\$|\$/.test(text)) return "USD";
  if (/\bgbp\b|£/.test(text)) return "GBP";
  return null;
}

function findScale(text: string): DiscoveredFinancialStatement["scale"] {
  if (/\bbillions?\b/.test(text)) return "billions";
  if (/\bmillions?\b/.test(text)) return "millions";
  if (/\bthousands?\b|\$000|€000|£000/.test(text)) return "thousands";
  if (/\bunit(s)?\b/.test(text)) return "units";
  return "unknown";
}

function findPeriods(rows: LayoutRow[]) {
  for (const row of rows) {
    const periods = row.cells.flatMap((cell, sourceColumnIndex) => {
      const year = cell.text.match(/(?:fy\s*)?((?:19|20)\d{2})/i)?.[1];
      return year ? [{ label: cell.text, year: Number(year), sourceColumnIndex }] : [];
    });
    if (periods.length >= 1) return periods;
  }
  return [];
}

export function discoverFinancialStatement(input: { pageNumber: number; rows: LayoutRow[]; extractionMode?: "native_text" | "scanned_page_unsupported" }): DiscoveredFinancialStatement | null {
  if (input.extractionMode === "scanned_page_unsupported") return null;
  const text = normalizedText(input.rows);
  const statementType = findStatementType(text);
  if (!statementType) return null;

  return {
    statementType,
    statementScope: /consolidated/.test(text) ? "consolidated" : /parent company|company only|separate financial/.test(text) ? "parent" : "unknown",
    currency: findCurrency(text),
    scale: findScale(text),
    periods: findPeriods(input.rows),
  };
}
