import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import { baseScenarioAssumptions } from "@/domain/scenarios";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AnalysisHistoryService } from "@/server/services/analysis-history-service";
import { CompanyService } from "@/server/services/company-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { ScenarioService } from "@/server/services/scenario-service";
import { WorkspaceService } from "@/server/services/workspace-service";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe("future account frontend service contract", () => {
  it("provides tenant-scoped workspace, company, dataset, analysis and scenario reads", async () => {
    const client = new PGlite();
    databases.push(client);
    await applySqlMigrations(client);
    const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
    const workspaces = new WorkspaceService(repository);
    const companies = new CompanyService(repository);
    const datasets = new FinancialDatasetService(repository);
    const analyses = new AnalysisHistoryService(repository);
    const scenarios = new ScenarioService(repository);
    const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await workspaces.ensurePersonalWorkspace(owner.id, "Personal workspace");
    const company = await companies.create(owner.id, workspace.id, { name: "NovaTech Solutions", industry: "Enterprise Software", currency: "EUR" });
    const revised = await companies.update(owner.id, workspace.id, company.id, { industry: "Enterprise Software & Services" });
    const dataset = await datasets.createDataset(owner.id, workspace.id, company.id, "FY 2022-2024", cloneDemoCompany("novatech-solutions"), "demo");
    const analysis = await analyses.execute(owner.id, workspace.id, company.id, dataset.version.id);
    const scenario = await scenarios.create(owner.id, workspace.id, company.id, {
      baseAnalysisRunId: analysis.runId,
      sourceDatasetVersionId: dataset.version.id,
      name: "Base case copy",
      assumptions: baseScenarioAssumptions,
    });
    const renamedScenario = await scenarios.update(owner.id, workspace.id, scenario.scenario.id, { name: "Base case review" });

    expect((await workspaces.listForUser(owner.id, { limit: 10 })).items.map((item) => item.workspace.id)).toContain(workspace.id);
    expect(revised.industry).toBe("Enterprise Software & Services");
    expect((await datasets.list(owner.id, workspace.id, company.id, { limit: 10 })).items.map((item) => item.dataset.id)).toContain(dataset.dataset.id);
    expect((await datasets.getVersion(owner.id, workspace.id, company.id, dataset.version.id)).id).toBe(dataset.version.id);
    expect((await analyses.list(owner.id, workspace.id, { limit: 10 }, company.id)).items[0]?.id).toBe(analysis.runId);
    expect(renamedScenario.name).toBe("Base case review");
    expect((await scenarios.get(owner.id, workspace.id, scenario.scenario.id)).scenario.id).toBe(scenario.scenario.id);
    expect((await scenarios.list(owner.id, workspace.id, { limit: 10 }, company.id)).items).toHaveLength(1);

    await datasets.archive(owner.id, workspace.id, company.id, dataset.dataset.id);
    expect((await datasets.list(owner.id, workspace.id, company.id, { limit: 10 })).items).toHaveLength(0);
    await expect(datasets.getVersion(owner.id, workspace.id, company.id, dataset.version.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 30_000);
});
