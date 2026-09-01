import { buildExtractionDraft } from "@/features/annual-report-ingestion/lib/build-extraction-draft";
import { deriveTotalDebt } from "@/features/annual-report-ingestion/lib/derive-financial-fields";
import { discoverFinancialStatement } from "@/features/annual-report-ingestion/lib/discover-financial-statements";
import { resolvePeriodSlots } from "@/features/annual-report-ingestion/lib/extraction-periods";
import { extractRowCandidates } from "@/features/annual-report-ingestion/lib/extract-row-candidates";
import { selectMappedCandidates } from "@/features/annual-report-ingestion/lib/map-candidates";
import { normalizeFinancialValue } from "@/features/annual-report-ingestion/lib/normalize-financial-value";
import { reconstructPageLayout } from "@/features/annual-report-ingestion/lib/reconstruct-layout";
import { canonicalFinancialFieldKeys, type CanonicalFieldKey, type DetectedFiscalPeriod, type ExtractionPeriodSlot } from "@/features/annual-report-ingestion/types";
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

function headerSignature(periods: readonly { label: string; year?: number; endDate?: string }[]) {
  return periods.map(periodIdentity).join("|");
}

function selectConsensusPeriods(statements: readonly { statement: { statementType: string; periods: DetectedFiscalPeriod[] } }[]) {
  const eligible = statements.filter(({ statement }) => statement.statementType === "income_statement" || statement.statementType === "cash_flow");
  const source = eligible.length > 0 ? eligible : statements;
  const groups = new Map<string, { periods: DetectedFiscalPeriod[]; count: number }>();
  for (const { statement } of source) {
    const periods = statement.periods;
    const signature = headerSignature(periods);
    const previous = groups.get(signature);
    groups.set(signature, previous ? { ...previous, count: previous.count + 1 } : { periods, count: 1 });
  }
  return [...groups.values()].sort((left, right) => right.count - left.count || right.periods.length - left.periods.length || headerSignature(left.periods).localeCompare(headerSignature(right.periods)))[0]?.periods ?? [];
}

function isCompatibleWithConsensus(periods: readonly DetectedFiscalPeriod[], consensus: readonly DetectedFiscalPeriod[]) {
  return periods.every((period) => consensus.some((candidate) => periodIdentity(candidate) === periodIdentity(period)));
}

function debtComponentKind(label: string): "current" | "non_current" | null {
  const normalized = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(?:\s+\d+(?:\s*,\s*\d+)*)+\s*$/, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (["short term debt and current maturities of long term debt", "current portion of long term debt", "short term borrowings", "current borrowings"].includes(normalized)) return "current";
  if (["long term debt", "non current borrowings", "long term borrowings"].includes(normalized)) return "non_current";
  return null;
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
    const consensusPeriods = selectConsensusPeriods(discovered);
    const periodSlots = resolvePeriodSlots(consensusPeriods);
    const compatibleStatements = discovered.filter(({ statement }) => isCompatibleWithConsensus(statement.periods, consensusPeriods));
    const rawCandidates = compatibleStatements.flatMap(({ layout, statement }) => extractRowCandidates({
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
    const directCandidates: AnnualReportExtractionCandidate[] = mappedCandidates.flatMap((candidate) => {
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
    const directCandidateReferences = new Set(directCandidates.map((candidate) => candidate.reference));
    const debtComponents: AnnualReportExtractionCandidate[] = rawCandidates.flatMap((candidate) => {
      if (candidate.statementType !== "balance_sheet" || candidate.statementScope === "parent") return [];
      const component = debtComponentKind(candidate.sourceLabel);
      const normalized = normalizeFinancialValue(candidate.rawValue, candidate.scale);
      const periodSlotIndex = resolveSlotIndex(periodSlots, candidate.fiscalPeriod);
      if (!component || !normalized.success || periodSlotIndex === null) return [];
      const reference = `totalDebt-${component}:${periodSlotIndex}`;
      return [{
        reference,
        canonicalFieldKey: "totalDebt" as const,
        periodSlotIndex,
        candidateKind: "direct" as const,
        normalizedValue: String(normalized.value),
        confidence: candidate.statementScope === "consolidated" || candidate.statementScope === "unknown" ? "high" as const : "medium" as const,
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
          debtComponent: component,
        },
        diagnostics: { selectionStatus: "available", debtComponent: component },
        sourceCandidateReferences: [],
        selectionStatus: "available" as const,
      }];
    });
    const derivedDebtCandidates: AnnualReportExtractionCandidate[] = [0, 1, 2].flatMap((slotIndex) => {
      if (directCandidateReferences.has(candidateReference("totalDebt", slotIndex))) return [];
      const sourceComponents = debtComponents.filter((candidate) => candidate.periodSlotIndex === slotIndex);
      const derivation = deriveTotalDebt(sourceComponents.map((candidate) => ({
        id: candidate.reference,
        value: Number(candidate.normalizedValue),
        includedInTotalDebt: true,
        component: candidate.sourceEvidence.debtComponent as "current" | "non_current",
      })));
      if (derivation.status !== "derived") return [];
      return [{
        reference: candidateReference("totalDebt", slotIndex),
        canonicalFieldKey: "totalDebt" as const,
        periodSlotIndex: slotIndex as 0 | 1 | 2,
        candidateKind: "aggregation" as const,
        normalizedValue: String(derivation.value),
        confidence: sourceComponents.every((candidate) => candidate.confidence === "high") ? "high" as const : "medium" as const,
        sourceEvidence: {
          derivation: "current debt plus non-current debt",
          sourceComponentReferences: derivation.sourceCandidateIds,
          sourcePages: sourceComponents.map((candidate) => candidate.sourceEvidence.pageNumber),
        },
        diagnostics: { selectionStatus: "available", derivation: "total-debt-components" },
        sourceCandidateReferences: derivation.sourceCandidateIds,
        selectionStatus: "available" as const,
      }];
    });
    const candidates: AnnualReportExtractionCandidate[] = [...directCandidates, ...debtComponents, ...derivedDebtCandidates];
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
        evidence: candidate && typeof candidate.sourceEvidence.pageNumber === "number"
          ? [{ pageNumber: candidate.sourceEvidence.pageNumber }]
          : candidate && Array.isArray(candidate.sourceEvidence.sourcePages) && typeof candidate.sourceEvidence.sourcePages[0] === "number"
            ? [{ pageNumber: candidate.sourceEvidence.sourcePages[0] }]
            : [],
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
        compatibleStatementCount: compatibleStatements.length,
        periodSlots,
      },
      draftFields: builtDraft.fields.map((field) => ({
        canonicalFieldKey: field.canonicalFieldKey as CanonicalFieldKey,
        periodSlotIndex: field.slotIndex,
        candidateReference: candidateByReference.has(candidateReference(field.canonicalFieldKey, field.slotIndex))
          ? candidateReference(field.canonicalFieldKey, field.slotIndex)
          : null,
        provenanceType: field.provenanceType === "PDF_EXTRACTED" && candidateByReference.get(candidateReference(field.canonicalFieldKey, field.slotIndex))?.candidateKind !== "direct"
          ? "DERIVED"
          : field.provenanceType,
        reviewState: field.reviewState,
        formValue: field.formValue,
      })),
    };
  }
}
