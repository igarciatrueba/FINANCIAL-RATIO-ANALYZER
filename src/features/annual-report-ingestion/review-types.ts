import type { CanonicalFieldKey, ExtractionPeriodSlot } from "@/features/annual-report-ingestion/types";

export type ExtractionReviewCandidate = {
  id: string;
  normalizedValue: string | null;
  confidence: "high" | "medium" | "low";
  candidateKind: "direct" | "aggregation" | "average";
  sourceEvidence: Record<string, unknown>;
};

export type ExtractionReviewField = {
  canonicalFieldKey: CanonicalFieldKey;
  periodSlotIndex: 0 | 1 | 2;
  currentCandidateId: string | null;
  originalCandidateId: string | null;
  provenanceType: "PDF_EXTRACTED" | "USER_PROVIDED" | "USER_OVERRIDE" | "DERIVED" | "NOT_FOUND" | "CONFLICT";
  reviewState: "UNREVIEWED" | "NEEDS_REVIEW" | "USER_CONFIRMED";
  formValue: string | null;
};

export type AnnualReportReviewDraft = {
  runId: string;
  sourceFileId: string;
  sourceFileName: string;
  periodSlots: [ExtractionPeriodSlot, ExtractionPeriodSlot, ExtractionPeriodSlot];
  documentSummary: Record<string, unknown>;
  candidates: ExtractionReviewCandidate[];
  fields: ExtractionReviewField[];
};
