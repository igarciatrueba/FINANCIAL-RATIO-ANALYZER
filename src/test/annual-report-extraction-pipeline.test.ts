import { describe, expect, it } from "vitest";

import { NativeAnnualReportExtractionPipeline } from "@/server/document-extraction/annual-report-extraction-pipeline";
import type { DocumentTextExtractionProvider } from "@/server/document-extraction/types";

const provider: DocumentTextExtractionProvider = {
  async extract() {
    return {
      pageCount: 1,
      pages: [{
        pageNumber: 7,
        extractionMode: "native_text",
        tokens: [
          { text: "Consolidated statement of operations", x: 20, y: 100, width: 240, height: 10 },
          { text: "In millions", x: 20, y: 90, width: 80, height: 10 },
          { text: "2025", x: 400, y: 90, width: 30, height: 10 },
          { text: "2024", x: 500, y: 90, width: 30, height: 10 },
          { text: "Revenue", x: 20, y: 80, width: 50, height: 10 },
          { text: "100", x: 400, y: 80, width: 30, height: 10 },
          { text: "90", x: 500, y: 80, width: 30, height: 10 },
        ],
      }],
    };
  },
};

describe("native annual report extraction pipeline", () => {
  it("creates a complete three-slot review draft without inventing a missing historical period", async () => {
    const output = await new NativeAnnualReportExtractionPipeline(provider).extract({
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("%PDF-test"),
    });

    expect(output.periodSlots).toEqual([
      { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
      { slotIndex: 1, fiscalPeriod: { label: "2024", year: 2024 }, resolution: "resolved" },
      { slotIndex: 2, fiscalPeriod: { label: "2025", year: 2025 }, resolution: "resolved" },
    ]);
    expect(output.draftFields).toHaveLength(54);
    expect(output.draftFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ canonicalFieldKey: "revenue", periodSlotIndex: 2, formValue: "100000000", provenanceType: "PDF_EXTRACTED", reviewState: "UNREVIEWED" }),
      expect.objectContaining({ canonicalFieldKey: "revenue", periodSlotIndex: 0, formValue: null, provenanceType: "NOT_FOUND", reviewState: "NEEDS_REVIEW" }),
      expect.objectContaining({ canonicalFieldKey: "ebit", periodSlotIndex: 2, formValue: null, provenanceType: "NOT_FOUND" }),
    ]));
    expect(output.candidates).toEqual(expect.arrayContaining([expect.objectContaining({
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      normalizedValue: "100000000",
      confidence: "high",
      sourceEvidence: expect.objectContaining({ pageNumber: 7, sourceLabel: "Revenue" }),
    })]));
  });
});
