import { AuthorizationService } from "@/server/services/authorization-service";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AppError } from "@/server/errors";
import {
  NativeAnnualReportExtractionPipeline,
  type AnnualReportExtractionPipeline,
} from "@/server/document-extraction/annual-report-extraction-pipeline";
import type { StorageService } from "@/server/storage/types";
import { z } from "zod";

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
      await this.repository.failDocumentExtractionRun(workspaceId, run.id, safeError.code, safeError.safeMessage);
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
}
