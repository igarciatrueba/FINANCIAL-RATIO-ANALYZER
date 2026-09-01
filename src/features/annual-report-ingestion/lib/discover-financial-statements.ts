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

function rowText(row: LayoutRow) {
  return row.cells.map((cell) => cell.text).join(" ").replace(/\s+/g, " ").trim();
}

function findStatementType(title: string): DiscoveredFinancialStatement["statementType"] | null {
  const normalized = title.toLowerCase().replace(/\s+/g, " ").trim();
  const withoutSectionNumber = normalized.replace(/^\d+\.\s*/, "");
  if (/^(?:consolidated )?(?:income statements?|statements? of (?:income|operations|profit or loss))$/.test(withoutSectionNumber)) return "income_statement";
  if (/^(?:consolidated )?(?:balance sheets?|statements? of financial position)$/.test(withoutSectionNumber)) return "balance_sheet";
  if (/^(?:consolidated )?(?:cash flows? statements?|statements? of cash flows?)$/.test(withoutSectionNumber)) return "cash_flow";
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

function periodFromHeaderCell(value: string, sourceColumnIndex: number) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > 64) return null;
  const year = text.match(/^(?:fy\s*|fiscal year\s*)?((?:19|20)\d{2})$/i)?.[1];
  if (year) return { label: text, year: Number(year), sourceColumnIndex };
  if (/^(?:(?:year ended|as at|at)?\s*)?(?:\d{1,2}[/.\-]\d{1,2}[/.\-](?:19|20)\d{2}|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+\d{1,2},?\s+(?:19|20)\d{2}|\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(?:19|20)\d{2})$/i.test(text)) {
    const yearMatch = text.match(/((?:19|20)\d{2})$/);
    return yearMatch ? { label: text, year: Number(yearMatch[1]), sourceColumnIndex } : null;
  }
  return null;
}

function findPeriods(rows: LayoutRow[], titleIndex: number) {
  for (const row of rows.slice(titleIndex + 1, titleIndex + 5)) {
    const periods = row.cells.flatMap((cell, sourceColumnIndex) => {
      const period = periodFromHeaderCell(cell.text, sourceColumnIndex);
      return period ? [period] : [];
    });
    if (periods.length >= 2) return periods;
  }
  return [];
}

export function discoverFinancialStatement(input: { pageNumber: number; rows: LayoutRow[]; extractionMode?: "native_text" | "scanned_page_unsupported" }): DiscoveredFinancialStatement | null {
  if (input.extractionMode === "scanned_page_unsupported") return null;
  const titleIndex = input.rows.slice(0, 12).findIndex((row) => findStatementType(rowText(row)) !== null);
  if (titleIndex < 0) return null;
  const statementType = findStatementType(rowText(input.rows[titleIndex]!));
  const periods = findPeriods(input.rows, titleIndex);
  if (!statementType || periods.length < 2) return null;
  const text = normalizedText(input.rows.slice(Math.max(0, titleIndex - 1), titleIndex + 8));

  return {
    statementType,
    statementScope: /consolidated/.test(text) ? "consolidated" : /parent company|company only|separate financial|annual financial statements/.test(text) ? "parent" : "unknown",
    currency: findCurrency(text),
    scale: findScale(text),
    periods,
  };
}
