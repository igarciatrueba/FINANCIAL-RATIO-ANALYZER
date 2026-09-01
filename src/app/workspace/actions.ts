"use server";

import { revalidatePath } from "next/cache";

import type { FinancialAnalysisInput } from "@/domain";
import { AppError } from "@/server/errors";
import { resolveAccountContext } from "@/server/accounts/account-context";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { SupabaseStorageService } from "@/server/storage/supabase-storage-service";
import { FileService } from "@/server/services/file-service";
import { DocumentExtractionService } from "@/server/services/document-extraction-service";
import { validatePdfUpload } from "@/server/document-extraction/validate-pdf-upload";
import type { AnnualReportReviewDraft, ExtractionReviewCandidate, ExtractionReviewField } from "@/features/annual-report-ingestion/review-types";

export type WorkspaceActionState = { status: "idle" | "success" | "error"; message?: string };

function actionFailure(error: unknown): WorkspaceActionState {
  if (error instanceof AppError) return { status: "error", message: error.safeMessage };
  return { status: "error", message: "That workspace action could not be completed. Please try again." };
}

function workspacePaths(companyId?: string) {
  return ["/workspace", "/workspace/companies", "/workspace/history", "/workspace/files", "/workspace/scenarios", ...(companyId ? [`/workspace/companies/${companyId}`] : [])];
}

function refreshWorkspace(companyId?: string) {
  for (const path of workspacePaths(companyId)) revalidatePath(path);
}

function privateFileService(repository: BackendRepository) {
  return new FileService(repository, new SupabaseStorageService());
}

function privateDocumentExtractionService(repository: BackendRepository) {
  return new DocumentExtractionService(repository, new SupabaseStorageService());
}

function toReviewDraft(extraction: NonNullable<Awaited<ReturnType<BackendRepository["getDocumentExtractionRunForWorkspace"]>>>, sourceFileName: string): AnnualReportReviewDraft {
  const periodSlots = extraction.run.documentSummary.periodSlots;
  if (!Array.isArray(periodSlots) || periodSlots.length !== 3) {
    throw new AppError("ANALYSIS_FAILED", "The annual report extraction did not produce a safe review draft.");
  }
  return {
    runId: extraction.run.id,
    sourceFileId: extraction.run.fileId,
    sourceFileName,
    periodSlots: periodSlots as AnnualReportReviewDraft["periodSlots"],
    documentSummary: extraction.run.documentSummary,
    candidates: extraction.candidates.map((candidate): ExtractionReviewCandidate => ({
      id: candidate.id,
      normalizedValue: candidate.normalizedValue,
      confidence: candidate.confidence,
      candidateKind: candidate.candidateKind,
      sourceEvidence: candidate.sourceEvidence,
    })),
    fields: extraction.draftFields.map((field): ExtractionReviewField => ({
      canonicalFieldKey: field.canonicalFieldKey as ExtractionReviewField["canonicalFieldKey"],
      periodSlotIndex: field.periodSlotIndex as 0 | 1 | 2,
      currentCandidateId: field.currentCandidateId,
      originalCandidateId: field.originalCandidateId,
      provenanceType: field.provenanceType,
      reviewState: field.reviewState,
      formValue: field.formValue,
    })),
  };
}

export async function createCompanyAction(_previous: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  try {
    const { user, workspace, services } = await resolveAccountContext();
    const company = await services.companies.create(user.id, workspace.id, {
      name: formData.get("name"),
      industry: formData.get("industry"),
      currency: formData.get("currency"),
    });
    refreshWorkspace(company.id);
    return { status: "success", message: `${company.name} was added to your workspace.` };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateCompanyAction(_previous: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  try {
    const companyId = String(formData.get("companyId") ?? "");
    const { user, workspace, services } = await resolveAccountContext();
    const company = await services.companies.update(user.id, workspace.id, companyId, {
      name: formData.get("name"),
      industry: formData.get("industry"),
      currency: formData.get("currency"),
    });
    refreshWorkspace(company.id);
    return { status: "success", message: "Company details were updated." };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function archiveCompanyAction(companyId: string): Promise<WorkspaceActionState> {
  try {
    const { user, workspace, services } = await resolveAccountContext();
    await services.companies.archive(user.id, workspace.id, companyId);
    refreshWorkspace(companyId);
    return { status: "success", message: "Company archived. Historical analyses remain available." };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function uploadWorkspaceFileAction(_previous: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { status: "error", message: "Choose a file before uploading." };
    const { user, workspace, repository } = await resolveAccountContext();
    await privateFileService(repository).upload(user.id, workspace.id, {
      companyId: formData.get("companyId") || undefined,
      originalFilename: file.name,
      mimeType: file.type,
      category: formData.get("category"),
      body: new Uint8Array(await file.arrayBuffer()),
    });
    refreshWorkspace();
    return { status: "success", message: "File stored privately in your workspace." };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteWorkspaceFileAction(fileId: string): Promise<WorkspaceActionState> {
  try {
    const { user, workspace, repository } = await resolveAccountContext();
    await privateFileService(repository).delete(user.id, workspace.id, fileId);
    refreshWorkspace();
    return { status: "success", message: "File deleted from your workspace." };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function getPrivateFileUrlAction(fileId: string): Promise<{ url?: string; error?: string }> {
  try {
    const { user, workspace, repository } = await resolveAccountContext();
    return { url: await privateFileService(repository).getSignedUrl(user.id, workspace.id, fileId) };
  } catch (error) {
    return { error: actionFailure(error).message };
  }
}

export async function uploadAnnualReportAction(formData: FormData): Promise<{ draft?: AnnualReportReviewDraft; error?: string }> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "Choose a PDF annual report before extraction." };
    const { user, workspace, repository } = await resolveAccountContext();
    const body = new Uint8Array(await file.arrayBuffer());
    const mimeType = file.type || "application/pdf";
    validatePdfUpload({ mimeType, bytes: body });
    const stored = await privateFileService(repository).upload(user.id, workspace.id, {
      originalFilename: file.name,
      mimeType,
      category: "source_document",
      body,
    });
    const extraction = await privateDocumentExtractionService(repository).extract(user.id, workspace.id, stored.id);
    if (!extraction) throw new AppError("ANALYSIS_FAILED", "The annual report extraction did not produce a review draft.");
    refreshWorkspace();
    return { draft: toReviewDraft(extraction, stored.originalFilename) };
  } catch (error) {
    return { error: actionFailure(error).message };
  }
}

export async function resolveAnnualReportDraftFieldAction(runId: string, input: unknown): Promise<{ field?: ExtractionReviewField; error?: string }> {
  try {
    const { user, workspace, repository } = await resolveAccountContext();
    const field = await privateDocumentExtractionService(repository).resolveDraftField(user.id, workspace.id, runId, input);
    refreshWorkspace();
    return {
      field: {
        canonicalFieldKey: field.canonicalFieldKey as ExtractionReviewField["canonicalFieldKey"],
        periodSlotIndex: field.periodSlotIndex as 0 | 1 | 2,
        currentCandidateId: field.currentCandidateId,
        originalCandidateId: field.originalCandidateId,
        provenanceType: field.provenanceType,
        reviewState: field.reviewState,
        formValue: field.formValue,
      },
    };
  } catch (error) {
    return { error: actionFailure(error).message };
  }
}

export async function persistFinancialInputAction(input: FinancialAnalysisInput, extractionRunId?: string): Promise<{ runId?: string; companyId?: string; datasetVersionId?: string; error?: string }> {
  try {
    const { user, workspace, services, repository } = await resolveAccountContext();
    const companyPage = await services.companies.list(user.id, workspace.id, { limit: 100 });
    let company = companyPage.items.find((candidate) => candidate.name === input.company.name) ?? null;
    if (!company) {
      company = await services.companies.create(user.id, workspace.id, {
        name: input.company.name,
        industry: input.company.industry,
        currency: input.company.currency,
      });
    }

    const datasets = await services.datasets.list(user.id, workspace.id, company.id, { limit: 100 });
    const existing = datasets.items.find((candidate) => candidate.dataset.name === "Financial statements") ?? null;
    const sourceType = extractionRunId ? "import" : "manual";
    const datasetVersion = existing
      ? await services.datasets.createVersion(user.id, workspace.id, company.id, existing.dataset.id, input, sourceType)
      : (await services.datasets.createDataset(user.id, workspace.id, company.id, "Financial statements", input, sourceType)).version;
    if (extractionRunId) {
      await privateDocumentExtractionService(repository).confirmDataset(user.id, workspace.id, extractionRunId, datasetVersion.id);
    }
    const completed = await services.analyses.execute(user.id, workspace.id, company.id, datasetVersion.id, crypto.randomUUID());
    refreshWorkspace(company.id);
    return { runId: completed.runId, companyId: company.id, datasetVersionId: datasetVersion.id };
  } catch (error) {
    return { error: actionFailure(error).message };
  }
}

export async function createWorkspaceScenarioAction(input: { companyId: string; baseAnalysisRunId: string; sourceDatasetVersionId: string; name: string; description?: string; assumptions: unknown }): Promise<{ scenarioId?: string; error?: string }> {
  try {
    const { user, workspace, services } = await resolveAccountContext();
    const created = await services.scenarios.create(user.id, workspace.id, input.companyId, {
      baseAnalysisRunId: input.baseAnalysisRunId,
      sourceDatasetVersionId: input.sourceDatasetVersionId,
      name: input.name,
      description: input.description,
      assumptions: input.assumptions,
    });
    refreshWorkspace(input.companyId);
    return { scenarioId: created.scenario.id };
  } catch (error) {
    return { error: actionFailure(error).message };
  }
}
