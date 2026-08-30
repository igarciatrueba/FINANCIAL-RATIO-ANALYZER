import { resolveAccountContext } from "@/server/accounts/account-context";
import { parseFinancialAnalysisInput } from "@/domain";
import { AppError } from "@/server/errors";

const workspacePageSize = 100;

export async function loadWorkspaceOverview() {
  const context = await resolveAccountContext();
  const { user, workspace, services } = context;
  const [companies, analyses, scenarios, files, activity] = await Promise.all([
    services.companies.list(user.id, workspace.id, { limit: workspacePageSize }),
    services.analyses.list(user.id, workspace.id, { limit: workspacePageSize }),
    services.scenarios.list(user.id, workspace.id, { limit: workspacePageSize }),
    services.files.list(user.id, workspace.id, { limit: workspacePageSize }),
    services.activity.list(user.id, workspace.id, { limit: workspacePageSize }),
  ]);

  return { account: { user, workspace }, companies, analyses, scenarios, files, activity };
}

export async function loadCompanyWorkspace(companyId: string) {
  const context = await resolveAccountContext();
  const { user, workspace, services } = context;
  const [company, datasets, analyses, scenarios, files] = await Promise.all([
    services.companies.get(user.id, workspace.id, companyId),
    services.datasets.list(user.id, workspace.id, companyId, { limit: workspacePageSize }),
    services.analyses.list(user.id, workspace.id, { limit: workspacePageSize }, companyId),
    services.scenarios.list(user.id, workspace.id, { limit: workspacePageSize }, companyId),
    services.files.list(user.id, workspace.id, { limit: workspacePageSize }, companyId),
  ]);

  return { account: { user, workspace }, company, datasets, analyses, scenarios, files };
}

export async function loadAnalysisHistory(cursor?: string, companyId?: string) {
  const context = await resolveAccountContext();
  const { user, workspace, services } = context;
  const [analyses, companies] = await Promise.all([
    services.analyses.list(user.id, workspace.id, { cursor, limit: workspacePageSize }, companyId),
    services.companies.list(user.id, workspace.id, { limit: 100 }),
  ]);

  return { account: { user, workspace }, analyses, companies };
}

export async function loadPersistedAnalysis(runId: string) {
  const context = await resolveAccountContext();
  const analysis = await context.services.analyses.get(context.user.id, context.workspace.id, runId);
  const input = await context.services.datasets.getVersion(
    context.user.id,
    context.workspace.id,
    analysis.run.companyId,
    analysis.run.datasetVersionId,
  );
  const canonical = parseFinancialAnalysisInput(input.canonicalInput);
  if (!canonical.success) throw new AppError("VALIDATION_ERROR", "The historical dataset could not be recovered safely.");
  return { account: { user: context.user, workspace: context.workspace }, ...analysis, input: canonical.data };
}

export async function loadWorkspaceFiles(cursor?: string) {
  const context = await resolveAccountContext();
  const [files, companies] = await Promise.all([
    context.services.files.list(context.user.id, context.workspace.id, { cursor, limit: workspacePageSize }),
    context.services.companies.list(context.user.id, context.workspace.id, { limit: 100 }),
  ]);
  return { account: { user: context.user, workspace: context.workspace }, files, companies };
}

export async function loadWorkspaceScenarios(cursor?: string) {
  const context = await resolveAccountContext();
  const [scenarios, companies] = await Promise.all([
    context.services.scenarios.list(context.user.id, context.workspace.id, { cursor, limit: workspacePageSize }),
    context.services.companies.list(context.user.id, context.workspace.id, { limit: 100 }),
  ]);
  return { account: { user: context.user, workspace: context.workspace }, scenarios, companies };
}

export async function loadPersistedScenario(scenarioId: string) {
  const context = await resolveAccountContext();
  const scenario = await context.services.scenarios.get(context.user.id, context.workspace.id, scenarioId);
  const version = await context.services.datasets.getVersion(
    context.user.id,
    context.workspace.id,
    scenario.scenario.companyId,
    scenario.scenario.sourceDatasetVersionId,
  );
  const canonical = parseFinancialAnalysisInput(version.canonicalInput);
  if (!canonical.success) throw new AppError("VALIDATION_ERROR", "The scenario dataset could not be recovered safely.");
  return { account: { user: context.user, workspace: context.workspace }, ...scenario, input: canonical.data };
}
