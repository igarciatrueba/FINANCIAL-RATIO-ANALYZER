import { describe, expect, it } from "vitest";

import { applyAnnualReportReviewDraft } from "@/features/annual-report-ingestion/lib/apply-review-draft";
import { createEmptyFinancialInputForm } from "@/features/financial-input/form-transform";

describe("annual report review draft application", () => {
  it("applies only accepted or high-confidence values while preserving an explicitly unresolved third period", () => {
    const applied = applyAnnualReportReviewDraft(createEmptyFinancialInputForm(), {
      runId: "run-1",
      sourceFileName: "annual-report.pdf",
      documentSummary: {},
      periodSlots: [
        { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
        { slotIndex: 1, fiscalPeriod: { label: "FY2024", year: 2024 }, resolution: "resolved" },
        { slotIndex: 2, fiscalPeriod: { label: "FY2025", year: 2025 }, resolution: "resolved" },
      ],
      candidates: [
        { id: "high", normalizedValue: "1000", confidence: "high", candidateKind: "direct", sourceEvidence: { pageNumber: 8 } },
        { id: "medium", normalizedValue: "240", confidence: "medium", candidateKind: "direct", sourceEvidence: { pageNumber: 8 } },
      ],
      fields: [
        { canonicalFieldKey: "revenue", periodSlotIndex: 2, currentCandidateId: "high", originalCandidateId: "high", provenanceType: "PDF_EXTRACTED", reviewState: "UNREVIEWED", formValue: "1000" },
        { canonicalFieldKey: "ebit", periodSlotIndex: 2, currentCandidateId: "medium", originalCandidateId: "medium", provenanceType: "PDF_EXTRACTED", reviewState: "NEEDS_REVIEW", formValue: null },
      ],
    });

    expect(applied.values.periods.map((period) => period.year)).toEqual(["", "2024", "2025"]);
    expect(applied.values.periods[2].incomeStatement.revenue).toBe("1000");
    expect(applied.values.periods[2].incomeStatement.ebit).toBe("");
    expect(applied.fieldByFormPath["periods.2.incomeStatement.ebit"]).toMatchObject({ reviewState: "NEEDS_REVIEW", candidate: { confidence: "medium" } });
  });
});
