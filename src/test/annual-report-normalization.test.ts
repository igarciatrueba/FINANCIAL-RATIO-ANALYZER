import { describe, expect, it } from "vitest";

import { normalizeFinancialValue } from "@/features/annual-report-ingestion/lib/normalize-financial-value";

describe("annual report value normalization", () => {
  it("normalizes a parenthesized value using the source scale", () => {
    expect(normalizeFinancialValue("(4,725)", "millions")).toEqual({ success: true, value: -4_725_000_000 });
  });

  it("rejects dashes and ambiguous numeric text instead of treating them as zero", () => {
    expect(normalizeFinancialValue("—", "millions")).toEqual(expect.objectContaining({ success: false }));
    expect(normalizeFinancialValue("1,234.56", "millions")).toEqual(expect.objectContaining({ success: false }));
  });
});
