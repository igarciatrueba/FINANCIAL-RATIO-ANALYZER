import { buildExtractionDraft } from "@/features/annual-report-ingestion/lib/build-extraction-draft";
import { discoverFinancialStatement } from "@/features/annual-report-ingestion/lib/discover-financial-statements";
import { resolvePeriodSlots } from "@/features/annual-report-ingestion/lib/extraction-periods";
import { extractRowCandidates } from "@/features/annual-report-ingestion/lib/extract-row-candidates";
import { selectMappedCandidates } from "@/features/annual-report-ingestion/lib/map-candidates";
import { reconstructPageLayout } from "@/features/annual-report-ingestion/lib/reconstruct-layout";
import { canonicalFinancialFieldKeys, type CanonicalFieldKey, type ExtractionPeriodSlot } from "@/features/annual-report-ingestion/types";
import { NativePdfTextProvider } from "@/server/document-extraction/native-pdf-text-provider";
import { validatePdfUpload } from "@/server/document-extraction/validate-pdf-upload";
import type { DocumentTextExtractionProvider } from "@/server/document-extraction/types";

export const ANNUAL_REPORT_EXTRACTION_ENGINE_VERSION = "annual-report-native@1";

type CandidateKind = "direct" | "aggregation" | "average";
type CandidateConfidence = "high" | "medium" | "low";
type ProvenanceType = "PDF_EXTRACTED" | "USER_PROVIDED" | "USER_OVERRIDE" | "DERIVED" | "NOT_FOUND" | "CONFLICT";
type ReviewState = "UNREVIEWED" | "NEEDS_REVIEW" | "USER_CONFIRMED";

export type AnnualReportExtractionCandidate = {
  reference: string;
  canonicalFieldKey: CanonicalFieldKey;
  periodSlotIndex: 0 | 1 | 2;
  candidateKind: CandidateKind;
  normalizedValue: string | null;
  confidence: CandidateConfidence;
  sourceEvidence: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  sourceCandidateReferences: string[];
  selectionStatus: "available" | "conflict" | "unresolved";
};

export type AnnualReportExtractionDraftField = {
  canonicalFieldKey: CanonicalFieldKey;
  periodSlotIndex: 0 | 1 | 2;
  candidateReference: string | null;
  provenanceType: ProvenanceType;
  reviewState: ReviewState;
  formValue: string | null;
};

export type AnnualReportExtractionOutput = {
  engineVersion: string;
  documentSummary: Record<string, unknown>;
  periodSlots: [ExtractionPeriodSlot, ExtractionPeriodSlot, ExtractionPeriodSlot];
  candidates: AnnualReportExtractionCandidate[];
  draftFields: AnnualReportExtractionDraftField[];
};

export interface AnnualReportExtractionPipeline {
  extract(input: { bytes: Uint8Array; mimeType: string }): Promise<AnnualReportExtractionOutput>;
}

function periodIdentity(period: { label: string; year?: number; endDate?: string }) {
  return period.endDate ? `end:${period.endDate}` : period.year === undefined ? `label:${period.label}` : `year:${period.year}`;
}

function resolveSlotIndex(slots: readonly ExtractionPeriodSlot[], fiscalPeriod: { label: string; year?: number }) {
  return slots.find((slot) => slot.fiscalPeriod && (
    (fiscalPeriod.year !== undefined && slot.fiscalPeriod.year === fiscalPeriod.year)
    || slot.fiscalPeriod.label === fiscalPeriod.label
  ))?.slotIndex ?? null;
}

function candidateReference(field: string, slotIndex: number) {
  return `${field}:${slotIndex}`;
}

export class NativeAnnualReportExtractionPipeline implements AnnualReportExtractionPipeline {
  constructor(private readonly textProvider: DocumentTextExtractionProvider = new NativePdfTextProvider()) {}

  async extract(input: { bytes: Uint8Array; mimeType: string }): Promise<AnnualReportExtractionOutput> {
    validatePdfUpload(input);
    const parsed = await this.textProvider.extract({ bytes: input.bytes });
    const pageLayouts = parsed.pages.map(reconstructPageLayout);
    const discovered = pageLayouts.flatMap((layout, index) => {
      const statement = discoverFinancialStatement({
        pageNumber: layout.pageNumber,
        rows: layout.rows,
        extractionMode: parsed.pages[index]?.extractionMode,
      });
      return statement ? [{ layout, statement }] : [];
    });

    // Repeated headers across financial statements describe the same fiscal period.
    const distinctPeriods = [...new Map(
      discovered.flatMap(({ statement }) => statement.periods)
        .map((period) => [periodIdentity(period), period] as const),
    ).values()];
    const periodSlots = resolvePeriodSlots(distinctPeriods);
    const rawCandidates = discovered.flatMap(({ layout, statement }) => extractRowCandidates({
      pageNumber: layout.pageNumber,
      statementType: statement.statementType,
      statementScope: statement.statementScope,
      sourceRank: "primary_statement",
      currency: statement.currency,
      scale: statement.scale,
      periods: statement.periods,
      rows: layout.rows,
    }));
    const mappedCandidates = selectMappedCandidates(rawCandidates);
    const candidates = mappedCandidates.flatMap((candidate) => {
      const slotIndex = resolveSlotIndex(periodSlots, candidate.fiscalPeriod);
      if (slotIndex === null) return [];
      const canonicalFieldKey = candidate.canonicalFieldKey as CanonicalFieldKey;
      const reference = candidateReference(canonicalFieldKey, slotIndex);
      return [{
        reference,
        canonicalFieldKey,
        periodSlotIndex: slotIndex,
        candidateKind: "direct" as const,
        normalizedValue: candidate.normalizedValue === null ? null : String(candidate.normalizedValue),
        confidence: candidate.confidence,
        sourceEvidence: {
          pageNumber: candidate.pageNumber,
          sourceLabel: candidate.sourceLabel,
          rawValue: candidate.rawValue,
          fiscalPeriod: candidate.fiscalPeriod,
          statementType: candidate.statementType,
          statementScope: candidate.statementScope,
          sourceRank: candidate.sourceRank,
          currency: candidate.currency,
          scale: candidate.scale,
          coordinates: candidate.coordinates,
        },
        diagnostics: { selectionStatus: candidate.status },
        sourceCandidateReferences: [],
        selectionStatus: candidate.status,
      }];
    });
    const candidateByReference = new Map(candidates.map((candidate) => [candidate.reference, candidate]));
    const draftCandidates = canonicalFinancialFieldKeys.flatMap((canonicalFieldKey) => [0, 1, 2].map((slotIndex) => {
      const reference = candidateReference(canonicalFieldKey, slotIndex);
      const candidate = candidateByReference.get(reference);
      return {
        canonicalFieldKey,
        slotIndex: slotIndex as 0 | 1 | 2,
        normalizedValue: candidate?.normalizedValue === null || candidate === undefined ? null : Number(candidate.normalizedValue),
        confidence: candidate?.confidence ?? "low" as const,
        status: candidate?.selectionStatus ?? "unresolved" as const,
        evidence: candidate ? [{ pageNumber: Number(candidate.sourceEvidence.pageNumber) }] : [],
      };
    }));
    const builtDraft = buildExtractionDraft(draftCandidates);

    return {
      engineVersion: ANNUAL_REPORT_EXTRACTION_ENGINE_VERSION,
      periodSlots,
      candidates,
      documentSummary: {
        pageCount: parsed.pageCount,
        nativeTextPageCount: parsed.pages.filter((page) => page.extractionMode === "native_text").length,
        scannedPageUnsupportedCount: parsed.pages.filter((page) => page.extractionMode === "scanned_page_unsupported").length,
        discoveredStatementCount: discovered.length,
        periodSlots,
      },
      draftFields: builtDraft.fields.map((field) => ({
        canonicalFieldKey: field.canonicalFieldKey as CanonicalFieldKey,
        periodSlotIndex: field.slotIndex,
        candidateReference: candidateByReference.has(candidateReference(field.canonicalFieldKey, field.slotIndex))
          ? candidateReference(field.canonicalFieldKey, field.slotIndex)
          : null,
        provenanceType: field.provenanceType,
        reviewState: field.reviewState,
        formValue: field.formValue,
      })),
    };
  }
}
