import type { DetectedFiscalPeriod } from "@/features/annual-report-ingestion/types";
import type { LayoutRow } from "@/features/annual-report-ingestion/lib/reconstruct-layout";

export type RawFinancialCandidate = {
  sourceLabel: string;
  rawValue: string;
  fiscalPeriod: { label: string; year?: number };
  pageNumber: number;
  statementType: "income_statement" | "balance_sheet" | "cash_flow" | "working_capital";
  statementScope: "consolidated" | "parent" | "unknown";
  sourceRank: "primary_statement" | "reconciling_note" | "official_table" | "management_kpi" | "narrative";
  currency: "EUR" | "USD" | "GBP" | null;
  scale: "units" | "thousands" | "millions" | "billions" | "unknown";
  coordinates: { x: number; y: number } | null;
};

function isLikelyValue(value: string) {
  return /^(?:\(?-?[\d,.]+\)?|[\d,.]+-)$/.test(value.trim());
}

export function extractRowCandidates(input: {
  pageNumber: number;
  statementType: RawFinancialCandidate["statementType"];
  statementScope: RawFinancialCandidate["statementScope"];
  sourceRank: RawFinancialCandidate["sourceRank"];
  currency: RawFinancialCandidate["currency"];
  scale: RawFinancialCandidate["scale"];
  periods: readonly DetectedFiscalPeriod[];
  rows: LayoutRow[];
}): RawFinancialCandidate[] {
  return input.rows.flatMap((row) => {
    const valueCells = row.cells.filter((cell) => isLikelyValue(cell.text)).slice(-input.periods.length);
    if (valueCells.length !== input.periods.length) return [];
    const labelCells = row.cells.slice(0, row.cells.length - valueCells.length).filter((cell) => !isLikelyValue(cell.text));
    const sourceLabel = labelCells.map((cell) => cell.text).join(" ").trim();
    if (!sourceLabel) return [];

    return valueCells.map((cell, index) => {
      const period = input.periods[index];
      return {
        sourceLabel,
        rawValue: cell.text,
        fiscalPeriod: { label: period.label, ...(period.year === undefined ? {} : { year: period.year }) },
        pageNumber: input.pageNumber,
        statementType: input.statementType,
        statementScope: input.statementScope,
        sourceRank: input.sourceRank,
        currency: input.currency,
        scale: input.scale,
        coordinates: cell.x === undefined || cell.y === undefined ? null : { x: cell.x, y: cell.y },
      };
    });
  });
}
