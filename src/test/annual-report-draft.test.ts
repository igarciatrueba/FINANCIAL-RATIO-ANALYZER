import { describe, expect, it } from "vitest";

import { buildExtractionDraft } from "@/features/annual-report-ingestion/lib/build-extraction-draft";

describe("annual report extraction draft", () => {
  it("autofills only a high-confidence evidenced value", () => {
    const draft = buildExtractionDraft([
      { canonicalFieldKey: "revenue", slotIndex: 2, normalizedValue: 4_725_000_000, confidence: "high", status: "available", evidence: [{ pageNumber: 84 }] },
      { canonicalFieldKey: "ebit", slotIndex: 2, normalizedValue: 750_000_000, confidence: "medium", status: "available", evidence: [{ pageNumber: 84 }] },
    ]);

    expect(draft.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({ canonicalFieldKey: "revenue", formValue: "4725000000", provenanceType: "PDF_EXTRACTED", reviewState: "UNREVIEWED" }),
      expect.objectContaining({ canonicalFieldKey: "ebit", formValue: null, provenanceType: "PDF_EXTRACTED", reviewState: "NEEDS_REVIEW" }),
    ]));
  });

  it("never autofills low confidence or conflict values", () => {
    const draft = buildExtractionDraft([
      { canonicalFieldKey: "revenue", slotIndex: 2, normalizedValue: null, confidence: "low", status: "conflict", evidence: [] },
    ]);

    expect(draft.fields[0]).toMatchObject({ formValue: null, provenanceType: "CONFLICT", reviewState: "NEEDS_REVIEW" });
  });
});
