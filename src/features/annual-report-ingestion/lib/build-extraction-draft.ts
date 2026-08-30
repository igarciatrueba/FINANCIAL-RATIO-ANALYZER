export type DraftCandidate = {
  canonicalFieldKey: string;
  slotIndex: 0 | 1 | 2;
  normalizedValue: number | null;
  confidence: "high" | "medium" | "low";
  status: "available" | "conflict" | "unresolved";
  evidence: Array<{ pageNumber: number }>;
};

export type ExtractionDraftField = {
  canonicalFieldKey: string;
  slotIndex: 0 | 1 | 2;
  formValue: string | null;
  provenanceType: "PDF_EXTRACTED" | "NOT_FOUND" | "CONFLICT";
  reviewState: "UNREVIEWED" | "NEEDS_REVIEW";
  candidate: DraftCandidate;
};

export function buildExtractionDraft(candidates: readonly DraftCandidate[]) {
  return {
    fields: candidates.map((candidate): ExtractionDraftField => {
      if (candidate.status === "conflict") {
        return { canonicalFieldKey: candidate.canonicalFieldKey, slotIndex: candidate.slotIndex, formValue: null, provenanceType: "CONFLICT", reviewState: "NEEDS_REVIEW", candidate };
      }
      if (candidate.status !== "available" || candidate.normalizedValue === null || candidate.confidence === "low" || candidate.evidence.length === 0) {
        return { canonicalFieldKey: candidate.canonicalFieldKey, slotIndex: candidate.slotIndex, formValue: null, provenanceType: "NOT_FOUND", reviewState: "NEEDS_REVIEW", candidate };
      }
      return {
        canonicalFieldKey: candidate.canonicalFieldKey,
        slotIndex: candidate.slotIndex,
        formValue: candidate.confidence === "high" ? String(candidate.normalizedValue) : null,
        provenanceType: "PDF_EXTRACTED",
        reviewState: candidate.confidence === "high" ? "UNREVIEWED" : "NEEDS_REVIEW",
        candidate,
      };
    }),
  };
}
