import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AnalysisHistoryService } from "@/server/services/analysis-history-service";
import { AccountService } from "@/server/services/account-service";
import { CompanyService } from "@/server/services/company-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { WorkspaceService } from "@/server/services/workspace-service";
import { ScenarioService } from "@/server/services/scenario-service";
import { baseScenarioAssumptions } from "@/domain/scenarios";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function createServices() {
  const client = new PGlite();
  databases.push(client);
  await applySqlMigrations(client);
  const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
  return {
    repository,
    workspaces: new WorkspaceService(repository),
    companies: new CompanyService(repository),
    datasets: new FinancialDatasetService(repository),
    analyses: new AnalysisHistoryService(repository),
  };
}

describe("persistent workspace services", () => {
  it("creates immutable dataset versions and reproducible analysis history", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "NovaTech Solutions", industry: "Enterprise Software", currency: "EUR" });
    const baseInput = cloneDemoCompany("novatech-solutions");
    const dataset = await services.datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022–2024", baseInput, "demo");
    const editedInput = structuredClone(baseInput);
    editedInput.periods[2].incomeStatement.revenue += 100;
    const secondVersion = await services.datasets.createVersion(owner.id, workspace.id, company.id, dataset.dataset.id, editedInput);

    expect(dataset.version.versionNumber).toBe(1);
    expect(secondVersion.versionNumber).toBe(2);
    expect(dataset.version.canonicalInput.periods[2].incomeStatement.revenue).toBe(baseInput.periods[2].incomeStatement.revenue);
    expect(secondVersion.canonicalInput.periods[2].incomeStatement.revenue).toBe(editedInput.periods[2].incomeStatement.revenue);

    const execution = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id);
    const history = await services.analyses.get(owner.id, workspace.id, execution.runId);

    expect(history.run.datasetVersionId).toBe(dataset.version.id);
    expect(history.run.status).toBe("completed");
    expect(history.result?.company.id).toBe(company.id);
    expect(history.result?.score.total).toBeCloseTo(93.65057929351761, 12);
  }, 20_000);

  it("denies an authenticated user from another workspace even when they know a company ID", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const outsider = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "outsider", email: "outsider@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "Atlas Manufacturing Group", industry: "Industrial Manufacturing", currency: "EUR" });

    await expect(services.companies.archive(outsider.id, workspace.id, company.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await services.repository.findCompanyForWorkspace(workspace.id, company.id)).not.toBeNull();
  }, 20_000);

  it("records a failed analysis without persisting a partial result", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "NovaTech Solutions", industry: "Enterprise Software", currency: "EUR" });
    const dataset = await services.datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022-2024", cloneDemoCompany("novatech-solutions"), "demo");
    const analyses = new AnalysisHistoryService(services.repository, () => {
      throw new Error("test analysis failure");
    });

    await expect(analyses.execute(owner.id, workspace.id, company.id, dataset.version.id)).rejects.toMatchObject({ code: "ANALYSIS_FAILED" });
    const history = await analyses.list(owner.id, workspace.id, { limit: 10 }, company.id);

    expect(history.items).toHaveLength(1);
    expect(history.items[0]?.status).toBe("failed");
    expect((await analyses.get(owner.id, workspace.id, history.items[0]!.id)).result).toBeNull();
  }, 20_000);

  it("persists a scenario only against its completed analysis and immutable dataset version", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "Atlas Manufacturing Group", industry: "Industrial Manufacturing", currency: "EUR" });
    const dataset = await services.datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022-2024", cloneDemoCompany("atlas-manufacturing-group"), "demo");
    const execution = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id);
    const scenarios = new ScenarioService(services.repository);

    const persisted = await scenarios.create(owner.id, workspace.id, company.id, {
      baseAnalysisRunId: execution.runId,
      sourceDatasetVersionId: dataset.version.id,
      name: "Base case copy",
      assumptions: baseScenarioAssumptions,
    });

    expect(persisted.scenario.sourceDatasetVersionId).toBe(dataset.version.id);
    expect(persisted.result.company.id).toBe(company.id);
  }, 20_000);

  it("returns the same completed analysis for a repeated idempotency key", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "NovaTech Solutions", industry: "Enterprise Software", currency: "EUR" });
    const dataset = await services.datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022-2024", cloneDemoCompany("novatech-solutions"), "demo");

    const first = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id, "retry-safe-request");
    const repeated = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id, "retry-safe-request");

    expect(repeated.runId).toBe(first.runId);
    expect((await services.analyses.list(owner.id, workspace.id, { limit: 10 }, company.id)).items).toHaveLength(1);
  }, 20_000);

  it("uses the last returned item as the cursor without skipping analysis history", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "pagination-owner", email: "pagination-owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Pagination workspace");
    const company = await services.companies.create(owner.id, workspace.id, { name: "NovaTech Solutions", industry: "Enterprise Software", currency: "EUR" });
    const dataset = await services.datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022-2024", cloneDemoCompany("novatech-solutions"), "demo");
    const first = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id, "pagination-first");
    const second = await services.analyses.execute(owner.id, workspace.id, company.id, dataset.version.id, "pagination-second");

    const firstPage = await services.analyses.list(owner.id, workspace.id, { limit: 1 }, company.id);
    const secondPage = await services.analyses.list(owner.id, workspace.id, { limit: 1, cursor: firstPage.nextCursor! }, company.id);

    expect(firstPage.nextCursor).not.toBeNull();
    expect(new Set([firstPage.items[0]?.id, secondPage.items[0]?.id])).toEqual(new Set([first.runId, second.runId]));
  }, 20_000);

  it("creates a personal workspace once for a returning internal user", async () => {
    const services = await createServices();
    const user = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });

    const first = await services.workspaces.ensurePersonalWorkspace(user.id, "Personal workspace");
    const second = await services.workspaces.ensurePersonalWorkspace(user.id, "Personal workspace");

    expect(second.id).toBe(first.id);
  }, 20_000);

  it("provisions one active personal workspace and owner membership across concurrent retries", async () => {
    const services = await createServices();
    const user = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "concurrent-owner", email: "concurrent-owner@example.test" });

    const provisioned = await Promise.all(Array.from({ length: 4 }, () => services.workspaces.ensurePersonalWorkspace(user.id, "Personal workspace")));
    const workspaceIds = new Set(provisioned.map((workspace) => workspace.id));
    const memberships = await services.workspaces.listForUser(user.id, { limit: 10 });

    expect(workspaceIds.size).toBe(1);
    expect(memberships.items).toHaveLength(1);
    expect(memberships.items[0]?.membership.role).toBe("owner");
  }, 20_000);

  it("upserts one internal user across concurrent authenticated identity retries", async () => {
    const services = await createServices();
    const identity = { provider: "test", providerUserId: "concurrent-identity", email: "concurrent-identity@example.test" };

    const users = await Promise.all(Array.from({ length: 4 }, () => services.repository.upsertInternalUser(identity)));

    expect(new Set(users.map((user) => user.id)).size).toBe(1);
  }, 20_000);

  it("maps one authenticated identity to one internal user and personal workspace", async () => {
    const services = await createServices();
    const accounts = new AccountService(services.repository);
    const identity = { provider: "test", providerUserId: "account-owner", email: "account-owner@example.test" };

    const accountsForIdentity = await Promise.all(Array.from({ length: 3 }, () => accounts.resolveAccountForIdentity(identity)));

    expect(new Set(accountsForIdentity.map((account) => account.user.id)).size).toBe(1);
    expect(new Set(accountsForIdentity.map((account) => account.workspace.id)).size).toBe(1);
  }, 20_000);

  it("prevents an administrator from granting workspace ownership", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const administrator = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "administrator", email: "administrator@example.test" });
    const candidate = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "candidate", email: "candidate@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
    await services.workspaces.addMember(owner.id, workspace.id, administrator.id, "admin");

    await expect(services.workspaces.addMember(administrator.id, workspace.id, candidate.id, "owner")).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 20_000);

  it("makes an archived workspace unavailable to subsequent member operations", async () => {
    const services = await createServices();
    const owner = await services.repository.upsertInternalUser({ provider: "test", providerUserId: "archiving-owner", email: "archiving-owner@example.test" });
    const workspace = await services.workspaces.createPersonalWorkspace(owner.id, "Archivable workspace");

    await services.workspaces.archive(owner.id, workspace.id);

    await expect(services.companies.list(owner.id, workspace.id, { limit: 10 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await services.workspaces.listForUser(owner.id, { limit: 10 })).items).toHaveLength(0);
  }, 20_000);
});
