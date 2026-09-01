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

  it("rejects a narrative reference to a statement and years when there is no table title and period header", () => {
    expect(discoverFinancialStatement({
      pageNumber: 88,
      rows: [
        { cells: [{ text: "We audited the consolidated statements of income for the year ended 2024." }] },
        { cells: [{ text: "The comparative period was 2023 and the preceding period was 2022." }] },
      ],
    })).toBeNull();
  });

  it("does not infer a statement from a title without at least two structured annual header cells", () => {
    expect(discoverFinancialStatement({
      pageNumber: 56,
      rows: [
        { cells: [{ text: "Consolidated balance sheet" }] },
        { cells: [{ text: "As at December 31, 2024, cash increased compared with 2023." }] },
      ],
    })).toBeNull();
  });
});
