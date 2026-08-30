import { describe, expect, it } from "vitest";

import { discoverFinancialStatement } from "@/features/annual-report-ingestion/lib/discover-financial-statements";

describe("annual report statement discovery", () => {
  it("recognizes a consolidated income statement and its year columns", () => {
    const statement = discoverFinancialStatement({
      pageNumber: 34,
      rows: [
        { cells: [{ text: "Consolidated income statement" }] },
        { cells: [{ text: "EUR million" }] },
        { cells: [{ text: "2025" }, { text: "2024" }] },
      ],
    });

    expect(statement).toMatchObject({
      statementType: "income_statement",
      statementScope: "consolidated",
      currency: "EUR",
      scale: "millions",
      periods: [
        { label: "2025", year: 2025, sourceColumnIndex: 0 },
        { label: "2024", year: 2024, sourceColumnIndex: 1 },
      ],
    });
  });

  it("does not classify a scanned page as a financial statement", () => {
    expect(discoverFinancialStatement({ pageNumber: 4, rows: [], extractionMode: "scanned_page_unsupported" })).toBeNull();
  });
});
