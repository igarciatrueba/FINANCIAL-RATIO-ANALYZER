import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { AppError } from "@/server/errors";
import type { AnnualReportExtractionPipeline } from "@/server/document-extraction/annual-report-extraction-pipeline";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { DocumentExtractionService } from "@/server/services/document-extraction-service";
import { WorkspaceService } from "@/server/services/workspace-service";
import { CompanyService } from "@/server/services/company-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import type { StorageService } from "@/server/storage/types";

class MemoryStorage implements StorageService {
  readonly objects = new Map<string, Uint8Array>();

  async upload(input: { key: string; body: Uint8Array }) { this.objects.set(input.key, input.body); }
  async download(key: string) {
    const object = this.objects.get(key);
    if (!object) throw new AppError("STORAGE_ERROR", "Missing test object.");
    return object;
  }
  async getSignedUrl(key: string) { return `memory:///${key}`; }
  async delete(key: string) { this.objects.delete(key); }
  async exists(key: string) { return this.objects.has(key); }
}

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function fixture() {
  const client = new PGlite();
  databases.push(client);
  await applySqlMigrations(client);
  const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
  const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
  const outsider = await repository.upsertInternalUser({ provider: "test", providerUserId: "outsider", email: "outsider@example.test" });
  const workspace = await new WorkspaceService(repository).createPersonalWorkspace(owner.id, "Owner workspace");
  const file = await repository.createFileMetadata({
    workspaceId: workspace.id,
    uploadedBy: owner.id,
    originalFilename: "annual-report.pdf",
    storageKey: `workspaces/${workspace.id}/workspace-files/annual-report.pdf`,
    mimeType: "application/pdf",
    sizeBytes: 12,
    category: "source_document",
    checksum: "a".repeat(64),
  });
  const storage = new MemoryStorage();
  storage.objects.set(file.storageKey, new TextEncoder().encode("%PDF-test"));
  return { repository, owner, outsider, workspace, file, storage };
}

const pipeline: AnnualReportExtractionPipeline = {
  async extract() {
    return {
      engineVersion: "test@1",
      periodSlots: [
        { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
        { slotIndex: 1, fiscalPeriod: { label: "FY2024", year: 2024 }, resolution: "resolved" },
        { slotIndex: 2, fiscalPeriod: { label: "FY2025", year: 2025 }, resolution: "resolved" },
      ],
      documentSummary: { pageCount: 2 },
      candidates: [{
        reference: "revenue:2",
        canonicalFieldKey: "revenue",
        periodSlotIndex: 2,
        candidateKind: "direct",
        normalizedValue: "1000",
        confidence: "high",
        sourceEvidence: { pageNumber: 5, sourceLabel: "Revenue" },
        diagnostics: {},
        sourceCandidateReferences: [],
        selectionStatus: "available",
      }, {
        reference: "ebit:2",
        canonicalFieldKey: "ebit",
        periodSlotIndex: 2,
        candidateKind: "direct",
        normalizedValue: "240",
        confidence: "medium",
        sourceEvidence: { pageNumber: 5, sourceLabel: "Operating profit" },
        diagnostics: {},
        sourceCandidateReferences: [],
        selectionStatus: "available",
      }],
      draftFields: [{
        canonicalFieldKey: "revenue",
        periodSlotIndex: 2,
        candidateReference: "revenue:2",
        provenanceType: "PDF_EXTRACTED",
        reviewState: "UNREVIEWED",
        formValue: "1000",
      }, {
        canonicalFieldKey: "ebit",
        periodSlotIndex: 2,
        candidateReference: "ebit:2",
        provenanceType: "PDF_EXTRACTED",
        reviewState: "NEEDS_REVIEW",
        formValue: null,
      }],
    };
  },
};

describe("document extraction service", () => {
  it("persists only an authorized workspace's extraction draft with its PDF evidence", async () => {
    const current = await fixture();
    const service = new DocumentExtractionService(current.repository, current.storage, pipeline);

    const extracted = await service.extract(current.owner.id, current.workspace.id, current.file.id);

    expect(extracted?.run.status).toBe("ready_for_review");
    expect(extracted?.candidates).toEqual(expect.arrayContaining([expect.objectContaining({ canonicalFieldKey: "revenue", sourceEvidence: { pageNumber: 5, sourceLabel: "Revenue" } })]));
    expect(extracted?.draftFields).toEqual(expect.arrayContaining([expect.objectContaining({ formValue: "1000", provenanceType: "PDF_EXTRACTED", reviewState: "UNREVIEWED" })]));
    await expect(service.get(current.outsider.id, current.workspace.id, extracted!.run.id)).rejects.toMatchObject({ code: "FORBIDDEN" } satisfies Partial<AppError>);
  }, 20_000);

  it("requires explicit review for a medium-confidence suggestion and retains the original evidence after an override", async () => {
    const current = await fixture();
    const service = new DocumentExtractionService(current.repository, current.storage, pipeline);
    const extracted = await service.extract(current.owner.id, current.workspace.id, current.file.id);

    const accepted = await service.resolveDraftField(current.owner.id, current.workspace.id, extracted!.run.id, {
      canonicalFieldKey: "ebit",
      periodSlotIndex: 2,
      action: "accept_candidate",
    });
    expect(accepted).toMatchObject({ formValue: "240", provenanceType: "PDF_EXTRACTED", reviewState: "USER_CONFIRMED" });

    const overridden = await service.resolveDraftField(current.owner.id, current.workspace.id, extracted!.run.id, {
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      action: "provide_value",
      value: "950",
    });
    const refreshed = await service.get(current.owner.id, current.workspace.id, extracted!.run.id);
    expect(overridden).toMatchObject({ formValue: "950", provenanceType: "USER_OVERRIDE", reviewState: "USER_CONFIRMED" });
    expect(refreshed.candidates.find((candidate) => candidate.id === overridden.originalCandidateId)).toEqual(expect.objectContaining({
      sourceEvidence: { pageNumber: 5, sourceLabel: "Revenue" },
      normalizedValue: "1000.000000",
    }));
  }, 20_000);

  it("links a reviewed PDF extraction to exactly one immutable imported dataset version", async () => {
    const current = await fixture();
    const service = new DocumentExtractionService(current.repository, current.storage, pipeline);
    const extracted = await service.extract(current.owner.id, current.workspace.id, current.file.id);
    const company = await new CompanyService(current.repository).create(current.owner.id, current.workspace.id, {
      name: "Extracted company",
      industry: "Software",
      currency: "EUR",
    });
    const dataset = await new FinancialDatasetService(current.repository).createDataset(
      current.owner.id,
      current.workspace.id,
      company.id,
      "Financial statements",
      cloneDemoCompany("novatech-solutions"),
      "import",
    );

    const confirmed = await service.confirmDataset(current.owner.id, current.workspace.id, extracted!.run.id, dataset.version.id);
    expect(confirmed.confirmedDatasetVersionId).toBe(dataset.version.id);
    await expect(service.confirmDataset(current.owner.id, current.workspace.id, extracted!.run.id, dataset.version.id)).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<AppError>);
  }, 20_000);
});
