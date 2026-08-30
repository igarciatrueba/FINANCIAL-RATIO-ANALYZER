import { describe, expect, it } from "vitest";

import { extractRowCandidates } from "@/features/annual-report-ingestion/lib/extract-row-candidates";

describe("annual report row candidates", () => {
  it("associates values with their reported fiscal columns without treating a note number as financial data", () => {
    const candidates = extractRowCandidates({
      pageNumber: 84,
      statementType: "income_statement",
      statementScope: "consolidated",
      sourceRank: "primary_statement",
      currency: "EUR",
      scale: "millions",
      periods: [
        { label: "2025", year: 2025, sourceColumnIndex: 0 },
        { label: "2024", year: 2024, sourceColumnIndex: 1 },
      ],
      rows: [{
        cells: [
          { text: "Revenue", x: 72, y: 700 },
          { text: "5", x: 250, y: 700 },
          { text: "4,725", x: 400, y: 700 },
          { text: "4,381", x: 500, y: 700 },
        ],
      }],
    });

    expect(candidates).toEqual([
      expect.objectContaining({ sourceLabel: "Revenue", rawValue: "4,725", fiscalPeriod: { label: "2025", year: 2025 } }),
      expect.objectContaining({ sourceLabel: "Revenue", rawValue: "4,381", fiscalPeriod: { label: "2024", year: 2024 } }),
    ]);
  });
});
