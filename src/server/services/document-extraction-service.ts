import { AuthorizationService } from "@/server/services/authorization-service";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AppError } from "@/server/errors";
import { parseFinancialAnalysisInput, type FinancialAnalysisInput } from "@/domain";
import { canonicalFinancialFieldKeys, type CanonicalFieldKey } from "@/features/annual-report-ingestion/types";
import {
  NativeAnnualReportExtractionPipeline,
  type AnnualReportExtractionPipeline,
} from "@/server/document-extraction/annual-report-extraction-pipeline";
import type { StorageService } from "@/server/storage/types";
import { logSafeServerFailure } from "@/server/observability/safe-server-log";
import { z } from "zod";

const canonicalFieldKeySchema = z.enum([
  "revenue", "costOfGoodsSold", "ebit", "interestExpense", "netIncome",
  "cash", "accountsReceivable", "inventory", "currentAssets", "totalAssets",
  "currentLiabilities", "totalDebt", "equity", "operatingCashFlow", "capitalExpenditure",
  "averageInventory", "averageReceivables", "averagePayables",
]);

const draftResolutionSchema = z.object({
  canonicalFieldKey: canonicalFieldKeySchema,
  periodSlotIndex: z.number().int().min(0).max(2),
  action: z.enum(["accept_candidate", "provide_value"]),
  value: z.string().optional(),
}).strict().superRefine((value, context) => {
  if (value.action === "provide_value" && (value.value === undefined || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value.value.trim()))) {
    context.addIssue({ code: "custom", message: "Enter a plain finite number without a currency symbol or thousands separator." });
  }
  if (value.action === "accept_candidate" && value.value !== undefined) {
    context.addIssue({ code: "custom", message: "A suggested PDF value cannot include a separate manual value." });
  }
});

function formNumber(value: string) {
  return value.includes(".") ? value.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1") : value;
}

function canonicalFieldValue(input: FinancialAnalysisInput, field: CanonicalFieldKey, periodSlotIndex: 0 | 1 | 2) {
  const period = input.periods[periodSlotIndex];
  switch (field) {
    case "revenue": return period.incomeStatement.revenue;
    case "costOfGoodsSold": return period.incomeStatement.costOfGoodsSold;
    case "ebit": return period.incomeStatement.ebit;
    case "interestExpense": return period.incomeStatement.interestExpense;
    case "netIncome": return period.incomeStatement.netIncome;
    case "cash": return period.balanceSheet.cash;
    case "accountsReceivable": return period.balanceSheet.accountsReceivable;
    case "inventory": return period.balanceSheet.inventory;
    case "currentAssets": return period.balanceSheet.currentAssets;
    case "totalAssets": return period.balanceSheet.totalAssets;
    case "currentLiabilities": return period.balanceSheet.currentLiabilities;
    case "totalDebt": return period.balanceSheet.totalDebt;
    case "equity": return period.balanceSheet.equity;
    case "operatingCashFlow": return period.cashFlow.operatingCashFlow;
    case "capitalExpenditure": return period.cashFlow.capitalExpenditure;
    case "averageInventory": return period.workingCapital.averageInventory;
    case "averageReceivables": return period.workingCapital.averageReceivables;
    case "averagePayables": return period.workingCapital.averagePayables;
  }
}

function requireCompleteDraftForDataset(
  fields: readonly { canonicalFieldKey: string; periodSlotIndex: number; reviewState: string; formValue: string | null }[],
  input: FinancialAnalysisInput,
) {
  for (const canonicalFieldKey of canonicalFinancialFieldKeys) {
    for (const periodSlotIndex of [0, 1, 2] as const) {
      const field = fields.find((candidate) => candidate.canonicalFieldKey === canonicalFieldKey && candidate.periodSlotIndex === periodSlotIndex);
      const formValue = field?.formValue?.trim();
      if (!field || field.reviewState === "NEEDS_REVIEW" || !formValue || Number(formValue) !== canonicalFieldValue(input, canonicalFieldKey, periodSlotIndex)) {
        throw new AppError("VALIDATION_ERROR", "Complete the extraction review before confirming this financial dataset.");
      }
    }
  }
}

export class DocumentExtractionService {
  private readonly authorization: AuthorizationService;

  constructor(
    private readonly repository: BackendRepository,
    private readonly storage: StorageService,
    private readonly pipeline: AnnualReportExtractionPipeline = new NativeAnnualReportExtractionPipeline(),
  ) {
    this.authorization = new AuthorizationService(repository);
  }

  async extract(actorUserId: string, workspaceId: string, fileId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-files");
    if (!z.string().uuid().safeParse(fileId).success) throw new AppError("VALIDATION_ERROR", "A valid file identifier is required.");
    const file = await this.repository.findFileForWorkspace(workspaceId, fileId);
    if (!file) throw new AppError("NOT_FOUND", "The requested file is not available in this workspace.");
    if (file.mimeType !== "application/pdf") throw new AppError("VALIDATION_ERROR", "Select a PDF annual report to extract.");

    const run = await this.repository.createDocumentExtractionRun({
      workspaceId,
      fileId: file.id,
      requestedBy: actorUserId,
      companyId: file.companyId ?? undefined,
      engineVersion: "annual-report-native@1",
      documentSummary: {},
    });
    await this.repository.startDocumentExtractionRun(workspaceId, run.id);

    try {
      const bytes = await this.storage.download(file.storageKey);
      const output = await this.pipeline.extract({ bytes, mimeType: file.mimeType });
      const persistedCandidates = new Map<string, string>();
      for (const candidate of output.candidates) {
        const sourceCandidateIds = candidate.sourceCandidateReferences.map((reference) => persistedCandidates.get(reference)).filter((id): id is string => Boolean(id));
        const persisted = await this.repository.createDocumentExtractionCandidate({
          runId: run.id,
          canonicalFieldKey: candidate.canonicalFieldKey,
          periodSlotIndex: candidate.periodSlotIndex,
          candidateKind: candidate.candidateKind,
          normalizedValue: candidate.normalizedValue ?? undefined,
          confidence: candidate.confidence,
          sourceEvidence: candidate.sourceEvidence,
          diagnostics: candidate.diagnostics,
          sourceCandidateIds,
        });
        persistedCandidates.set(candidate.reference, persisted.id);
      }
      for (const field of output.draftFields) {
        const candidateId = field.candidateReference ? persistedCandidates.get(field.candidateReference) : undefined;
        await this.repository.upsertDocumentExtractionDraftField({
          runId: run.id,
          canonicalFieldKey: field.canonicalFieldKey,
          periodSlotIndex: field.periodSlotIndex,
          currentCandidateId: candidateId,
          originalCandidateId: candidateId,
          provenanceType: field.provenanceType,
          reviewState: field.reviewState,
          formValue: field.formValue ?? undefined,
        });
      }
      await this.repository.completeDocumentExtractionRun(workspaceId, run.id, output.documentSummary);
      await this.repository.recordActivity({
        workspaceId,
        userId: actorUserId,
        companyId: file.companyId ?? undefined,
        eventType: "document_extraction.completed",
        entityType: "document_extraction_run",
        entityId: run.id,
      });
      return this.repository.getDocumentExtractionRunForWorkspace(workspaceId, run.id);
    } catch (error) {
      const safeError = error instanceof AppError ? error : new AppError("ANALYSIS_FAILED", "The annual report could not be extracted safely.");
      logSafeServerFailure("annual_report_extraction_failed", safeError);
      await this.repository.failDocumentExtractionRun(workspaceId, run.id, safeError.code, safeError.safeMessage);
      // A rejected source cannot be used as evidence. Remove its private object and
      // revoke application access even when object-storage cleanup is unavailable.
      await this.repository.markFileDeleted(workspaceId, file.id);
      try {
        await this.storage.delete(file.storageKey);
      } catch {
        // The soft deletion above prevents further access while storage retries are handled operationally.
      }
      await this.repository.recordActivity({
        workspaceId,
        userId: actorUserId,
        companyId: file.companyId ?? undefined,
        eventType: "document_extraction.failed",
        entityType: "document_extraction_run",
        entityId: run.id,
      });
      throw safeError;
    }
  }

  async get(actorUserId: string, workspaceId: string, runId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "read");
    if (!z.string().uuid().safeParse(runId).success) throw new AppError("VALIDATION_ERROR", "A valid extraction identifier is required.");
    const extraction = await this.repository.getDocumentExtractionRunForWorkspace(workspaceId, runId);
    if (!extraction) throw new AppError("NOT_FOUND", "The requested extraction is not available in this workspace.");
    return extraction;
  }

  async resolveDraftField(actorUserId: string, workspaceId: string, runId: string, input: unknown) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-dataset");
    if (!z.string().uuid().safeParse(runId).success) throw new AppError("VALIDATION_ERROR", "A valid extraction identifier is required.");
    const parsed = draftResolutionSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "The reviewed financial value is not valid.");
    const extraction = await this.repository.getDocumentExtractionRunForWorkspace(workspaceId, runId);
    if (!extraction || extraction.run.status !== "ready_for_review") {
      throw new AppError("NOT_FOUND", "The requested extraction is not available for review.");
    }
    const resolution = parsed.data;
    const field = extraction.draftFields.find((candidate) =>
      candidate.canonicalFieldKey === resolution.canonicalFieldKey && candidate.periodSlotIndex === resolution.periodSlotIndex
    );
    if (!field) throw new AppError("NOT_FOUND", "The requested extracted field is not available.");

    if (resolution.action === "accept_candidate") {
      const candidateId = field.currentCandidateId ?? field.originalCandidateId;
      const candidate = candidateId ? extraction.candidates.find((item) => item.id === candidateId) : null;
      if (!candidate || candidate.normalizedValue === null || candidate.confidence === "low") {
        throw new AppError("VALIDATION_ERROR", "Only an evidenced high- or medium-confidence PDF suggestion can be accepted.");
      }
      const updated = await this.repository.upsertDocumentExtractionDraftField({
        runId,
        canonicalFieldKey: resolution.canonicalFieldKey,
        periodSlotIndex: resolution.periodSlotIndex,
        currentCandidateId: candidate.id,
        originalCandidateId: field.originalCandidateId ?? candidate.id,
        provenanceType: candidate.candidateKind === "direct" ? "PDF_EXTRACTED" : "DERIVED",
        reviewState: "USER_CONFIRMED",
        formValue: formNumber(candidate.normalizedValue),
      });
      await this.repository.recordActivity({ workspaceId, userId: actorUserId, eventType: "document_extraction.field_confirmed", entityType: "document_extraction_run", entityId: runId });
      return updated;
    }

    const originalCandidateId = field.originalCandidateId ?? field.currentCandidateId ?? undefined;
    const updated = await this.repository.upsertDocumentExtractionDraftField({
      runId,
      canonicalFieldKey: resolution.canonicalFieldKey,
      periodSlotIndex: resolution.periodSlotIndex,
      originalCandidateId,
      provenanceType: originalCandidateId ? "USER_OVERRIDE" : "USER_PROVIDED",
      reviewState: "USER_CONFIRMED",
      formValue: resolution.value!.trim(),
    });
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, eventType: "document_extraction.field_overridden", entityType: "document_extraction_run", entityId: runId });
    return updated;
  }

  async confirmDataset(actorUserId: string, workspaceId: string, runId: string, datasetVersionId: string) {
    await this.authorization.requireWorkspaceAction(actorUserId, workspaceId, "manage-dataset");
    if (!z.string().uuid().safeParse(runId).success || !z.string().uuid().safeParse(datasetVersionId).success) {
      throw new AppError("VALIDATION_ERROR", "Valid extraction and dataset identifiers are required.");
    }
    const extraction = await this.repository.getDocumentExtractionRunForWorkspace(workspaceId, runId);
    if (!extraction || extraction.run.status !== "ready_for_review" || extraction.run.confirmedDatasetVersionId) {
      throw new AppError("CONFLICT", "This annual report extraction cannot be confirmed again.");
    }
    const dataset = await this.repository.findDatasetVersionInWorkspace(workspaceId, datasetVersionId);
    if (!dataset) {
      throw new AppError("NOT_FOUND", "The confirmed dataset is not available in this workspace.");
    }
    const canonical = parseFinancialAnalysisInput(dataset.version.canonicalInput);
    if (!canonical.success) throw new AppError("VALIDATION_ERROR", "The confirmed dataset failed canonical validation.");
    requireCompleteDraftForDataset(extraction.draftFields, canonical.data);
    const confirmed = await this.repository.confirmDocumentExtractionRun(workspaceId, runId, datasetVersionId);
    if (!confirmed) throw new AppError("CONFLICT", "This annual report extraction could not be confirmed safely.");
    await this.repository.recordActivity({ workspaceId, userId: actorUserId, eventType: "document_extraction.dataset_confirmed", entityType: "document_extraction_run", entityId: runId });
    return confirmed;
  }
}
