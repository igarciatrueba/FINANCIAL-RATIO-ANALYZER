import type { CanonicalFieldKey } from "@/features/annual-report-ingestion/types";

const magnitudeFields = new Set<CanonicalFieldKey>([
  "costOfGoodsSold",
  "interestExpense",
  "currentLiabilities",
  "totalDebt",
  "capitalExpenditure",
]);

export function canonicalizeExtractedFinancialValue(field: CanonicalFieldKey, value: number) {
  return magnitudeFields.has(field) ? Math.abs(value) : value;
}
