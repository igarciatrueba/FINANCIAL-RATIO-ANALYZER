import { describe, expect, it } from "vitest";

import {
  canonicalFieldMappings,
  findCanonicalFieldMapping,
  isExplicitlyExcludedLabel,
} from "@/features/annual-report-ingestion/lib/canonical-field-mapping";

describe("annual report canonical field mapping", () => {
  it("defines every current Financial Input financial field exactly once", () => {
    expect(canonicalFieldMappings.map((mapping) => mapping.key)).toEqual([
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
    ]);
  });

  it("maps explicit accounting aliases without relying on UI labels", () => {
    expect(findCanonicalFieldMapping("Net sales")?.key).toBe("revenue");
    expect(findCanonicalFieldMapping("Cost of revenue")?.key).toBe("costOfGoodsSold");
    expect(findCanonicalFieldMapping("Cash and short-term deposits")?.key).toBe("cash");
    expect(findCanonicalFieldMapping("Net cash from operating activities")?.key).toBe("operatingCashFlow");
  });

  it("excludes lookalike metrics that cannot be treated as canonical inputs", () => {
    expect(isExplicitlyExcludedLabel("ebit", "Adjusted EBITDA")).toBe(true);
    expect(isExplicitlyExcludedLabel("totalDebt", "Net debt")).toBe(true);
    expect(isExplicitlyExcludedLabel("operatingCashFlow", "Free cash flow")).toBe(true);
    expect(isExplicitlyExcludedLabel("currentAssets", "Working capital")).toBe(true);
    expect(findCanonicalFieldMapping("Adjusted EBITDA")).toBeNull();
  });
});
