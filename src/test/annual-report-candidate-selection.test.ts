import { describe, expect, it } from "vitest";

import { selectMappedCandidates } from "@/features/annual-report-ingestion/lib/map-candidates";

const evidence = {
  pageNumber: 84,
  statementType: "income_statement" as const,
  statementScope: "consolidated" as const,
  sourceRank: "primary_statement" as const,
  currency: "EUR" as const,
  scale: "millions" as const,
  coordinates: { x: 400, y: 700 },
};

describe("annual report candidate selection", () => {
  it("selects an evidenced consolidated primary-statement revenue candidate as high confidence", () => {
    const selected = selectMappedCandidates([{ ...evidence, sourceLabel: "Net sales", rawValue: "4,725", fiscalPeriod: { label: "2025", year: 2025 } }]);

    expect(selected).toEqual([expect.objectContaining({ canonicalFieldKey: "revenue", normalizedValue: 4_725_000_000, confidence: "high" })]);
  });

  it("does not select excluded EBITDA as EBIT", () => {
    expect(selectMappedCandidates([{ ...evidence, sourceLabel: "Adjusted EBITDA", rawValue: "500", fiscalPeriod: { label: "2025", year: 2025 } }])).toEqual([]);
  });

  it("marks equal-ranked contradictory candidates as a conflict instead of choosing one", () => {
    const selected = selectMappedCandidates([
      { ...evidence, sourceLabel: "Revenue", rawValue: "4,725", fiscalPeriod: { label: "2025", year: 2025 } },
      { ...evidence, sourceLabel: "Revenue", rawValue: "4,381", fiscalPeriod: { label: "2025", year: 2025 } },
    ]);

    expect(selected).toEqual([expect.objectContaining({ canonicalFieldKey: "revenue", normalizedValue: null, confidence: "low", status: "conflict" })]);
  });
});
