import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import { baseScenarioAssumptions } from "@/domain/scenarios";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { ActivityService } from "@/server/services/activity-service";
import { AnalysisHistoryService } from "@/server/services/analysis-history-service";
import { CompanyService } from "@/server/services/company-service";
import { DocumentExtractionService } from "@/server/services/document-extraction-service";
import { FileService } from "@/server/services/file-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { ScenarioService } from "@/server/services/scenario-service";
import { WorkspaceService } from "@/server/services/workspace-service";
import type { StorageService } from "@/server/storage/types";

class MemoryStorage implements StorageService {
  readonly objects = new Map<string, Uint8Array>();

  async upload(input: { key: string; body: Uint8Array }) { this.objects.set(input.key, input.body); }
  async download(key: string) {
    const value = this.objects.get(key);
    if (!value) throw new AppError("STORAGE_ERROR", "Missing test object.");
    return value;
  }
  async getSignedUrl(key: string) {
    if (!this.objects.has(key)) throw new AppError("STORAGE_ERROR", "Missing test object.");
    return `memory://private/${key}`;
  }
  async delete(key: string) { this.objects.delete(key); }
  async exists(key: string) { return this.objects.has(key); }
}

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function createFixture() {
  const client = new PGlite();
  databases.push(client);
  await applySqlMigrations(client);
  const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
  const storage = new MemoryStorage();
  const workspaces = new WorkspaceService(repository);
  const companies = new CompanyService(repository);
  const datasets = new FinancialDatasetService(repository);
  const analyses = new AnalysisHistoryService(repository);
  const scenarios = new ScenarioService(repository);
  const files = new FileService(repository, storage);
  const documents = new DocumentExtractionService(repository, storage);
  const activity = new ActivityService(repository);

  const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "security-owner", email: "security-owner@example.test" });
  const outsider = await repository.upsertInternalUser({ provider: "test", providerUserId: "security-outsider", email: "security-outsider@example.test" });
  const viewer = await repository.upsertInternalUser({ provider: "test", providerUserId: "security-viewer", email: "security-viewer@example.test" });
  const workspace = await workspaces.createPersonalWorkspace(owner.id, "Security owner workspace");
  await workspaces.addMember(owner.id, workspace.id, viewer.id, "viewer");
  const company = await companies.create(owner.id, workspace.id, { name: "Security Holdings", industry: "Software", currency: "EUR" });
  const dataset = await datasets.createDataset(owner.id, workspace.id, company.id, "Security dataset", cloneDemoCompany("novatech-solutions"), "demo");
  const analysis = await analyses.execute(owner.id, workspace.id, company.id, dataset.version.id, "security-regression-analysis");
  const scenario = await scenarios.create(owner.id, workspace.id, company.id, {
    baseAnalysisRunId: analysis.runId,
    sourceDatasetVersionId: dataset.version.id,
    name: "Security scenario",
    assumptions: baseScenarioAssumptions,
  });
  const file = await files.upload(owner.id, workspace.id, {
    companyId: company.id,
    originalFilename: "security-report.pdf",
    mimeType: "application/pdf",
    category: "source_document",
    body: new TextEncoder().encode("%PDF-security"),
  });
  const extraction = await repository.createDocumentExtractionRun({
    workspaceId: workspace.id,
    fileId: file.id,
    requestedBy: owner.id,
    companyId: company.id,
    engineVersion: "security-test@1",
    documentSummary: {},
  });
  await repository.startDocumentExtractionRun(workspace.id, extraction.id);
  await repository.completeDocumentExtractionRun(workspace.id, extraction.id, {});

  return { repository, owner, outsider, viewer, workspace, company, dataset, analysis, scenario, file, extraction, workspaces, companies, datasets, analyses, scenarios, files, documents, activity };
}

describe("security tenant and role regressions", () => {
  it("denies a foreign authenticated user every workspace-scoped resource even with known UUIDs", async () => {
    const current = await createFixture();

    await expect(current.companies.get(current.outsider.id, current.workspace.id, current.company.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.datasets.getVersion(current.outsider.id, current.workspace.id, current.company.id, current.dataset.version.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.analyses.get(current.outsider.id, current.workspace.id, current.analysis.runId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.scenarios.get(current.outsider.id, current.workspace.id, current.scenario.scenario.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.files.getSignedUrl(current.outsider.id, current.workspace.id, current.file.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.documents.get(current.outsider.id, current.workspace.id, current.extraction.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.activity.list(current.outsider.id, current.workspace.id, { limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 30_000);

  it("permits viewer reads but rejects viewer mutations, mass assignment and malformed identifiers", async () => {
    const current = await createFixture();

    expect((await current.companies.get(current.viewer.id, current.workspace.id, current.company.id)).id).toBe(current.company.id);
    expect(await current.files.getSignedUrl(current.viewer.id, current.workspace.id, current.file.id)).toContain("memory://private/");

    await expect(current.companies.update(current.viewer.id, current.workspace.id, current.company.id, { industry: "Forbidden" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.datasets.createVersion(current.viewer.id, current.workspace.id, current.company.id, current.dataset.dataset.id, cloneDemoCompany("novatech-solutions"))).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.analyses.execute(current.viewer.id, current.workspace.id, current.company.id, current.dataset.version.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.scenarios.update(current.viewer.id, current.workspace.id, current.scenario.scenario.id, { name: "Forbidden" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.files.delete(current.viewer.id, current.workspace.id, current.file.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.documents.resolveDraftField(current.viewer.id, current.workspace.id, current.extraction.id, {
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      action: "provide_value",
      value: "1",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(current.companies.update(current.owner.id, current.workspace.id, current.company.id, {
      name: "Security Holdings",
      workspaceId: "00000000-0000-0000-0000-000000000000",
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(current.files.getSignedUrl(current.owner.id, current.workspace.id, "not-a-uuid")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  }, 30_000);
});
