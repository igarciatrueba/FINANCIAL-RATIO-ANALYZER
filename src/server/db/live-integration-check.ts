import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

import { baseScenarioAssumptions } from "@/domain/scenarios";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { closeDatabaseConnection, getDatabase } from "@/server/db/client";
import { AppError, type AppErrorCode } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { ActivityService } from "@/server/services/activity-service";
import { AccountService } from "@/server/services/account-service";
import { AnalysisHistoryService } from "@/server/services/analysis-history-service";
import { CompanyService } from "@/server/services/company-service";
import { FileService } from "@/server/services/file-service";
import { FinancialDatasetService } from "@/server/services/financial-dataset-service";
import { ScenarioService } from "@/server/services/scenario-service";
import { WorkspaceService } from "@/server/services/workspace-service";
import { SupabaseStorageService } from "@/server/storage/supabase-storage-service";

const requiredEnvironment = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
] as const;

const applicationTables = [
  "users",
  "workspaces",
  "workspace_members",
  "companies",
  "financial_datasets",
  "financial_dataset_versions",
  "financial_statements",
  "financial_statement_values",
  "analysis_runs",
  "analysis_results",
  "scenarios",
  "scenario_assumptions",
  "scenario_results",
  "files",
  "activity_events",
] as const;

const applicationEnums = [
  "workspace_role",
  "dataset_source_type",
  "statement_type",
  "value_source_type",
  "analysis_run_status",
  "analysis_result_type",
  "file_category",
] as const;

let liveCheckStage = "initializing";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectAppError(action: () => Promise<unknown>, code: AppErrorCode, message: string) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof AppError && error.code === code, message);
    return;
  }
  throw new Error(message);
}

function requireEnvironment() {
  for (const key of requiredEnvironment) {
    assert(process.env[key], `Missing required environment variable: ${key}`);
  }
  return {
    databaseUrl: process.env.DATABASE_URL!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    bucket: process.env.SUPABASE_STORAGE_BUCKET!,
  };
}

async function validateSchema(pool: Pool) {
  const tables = await pool.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[])",
    [applicationTables],
  );
  assert(tables.rows.length === applicationTables.length, "Real database is missing an application table.");

  const enums = await pool.query<{ typname: string }>(
    "select typname from pg_type where typnamespace = 'public'::regnamespace and typname = any($1::text[])",
    [applicationEnums],
  );
  assert(enums.rows.length === applicationEnums.length, "Real database is missing an application enum.");

  const numeric = await pool.query<{ numeric_precision: number | null; numeric_scale: number | null }>(
    "select numeric_precision, numeric_scale from information_schema.columns where table_schema = 'public' and table_name = 'financial_statement_values' and column_name = 'value'",
  );
  assert(numeric.rows[0]?.numeric_precision === 20 && numeric.rows[0]?.numeric_scale === 6, "Financial values do not use numeric(20,6).");

  const indexes = await pool.query<{ indexname: string }>(
    "select indexname from pg_indexes where schemaname = 'public' and indexname = any($1::text[])",
    [[
      "users_auth_identity_unique",
      "workspace_members_workspace_user_unique",
      "workspaces_owner_name_active_unique",
      "financial_dataset_versions_dataset_version_unique",
      "analysis_runs_workspace_idempotency_unique",
      "files_storage_key_unique",
    ]],
  );
  assert(indexes.rows.length === 6, "Real database is missing an application uniqueness index.");

  const foreignKeys = await pool.query<{ count: string }>(
    "select count(*) from information_schema.table_constraints where table_schema = 'public' and constraint_type = 'FOREIGN KEY' and table_name = any($1::text[])",
    [applicationTables],
  );
  assert(Number(foreignKeys.rows[0]?.count) >= 20, "Real database foreign-key coverage is incomplete.");

  const archiveFields = await pool.query<{ table_name: string }>(
    "select table_name from information_schema.columns where table_schema = 'public' and column_name = 'archived_at' and table_name = any($1::text[])",
    [["workspaces", "companies", "financial_datasets", "scenarios"]],
  );
  assert(archiveFields.rows.length === 4, "Real database archive fields are incomplete.");

  const migrations = await pool.query<{ count: string }>("select count(*) from drizzle.__drizzle_migrations");
  assert(Number(migrations.rows[0]?.count) >= 2, "Real database does not contain all Drizzle migrations.");

  const rls = await pool.query<{ relrowsecurity: boolean }>(
    "select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = any($1::text[])",
    [applicationTables],
  );
  assert(rls.rows.length === applicationTables.length, "Unable to inspect real database RLS status.");

  return { rlsEnabled: rls.rows.some((row) => row.relrowsecurity) };
}

async function main() {
  const environment = requireEnvironment();
  const runId = randomUUID();
  const pool = new Pool({ connectionString: environment.databaseUrl });
  const repository = new BackendRepository(getDatabase());
  const accounts = new AccountService(repository);
  const workspaces = new WorkspaceService(repository);
  const companies = new CompanyService(repository);
  const datasets = new FinancialDatasetService(repository);
  const analyses = new AnalysisHistoryService(repository);
  const scenarios = new ScenarioService(repository);
  const storage = new SupabaseStorageService(environment.bucket);
  const files = new FileService(repository, storage);
  const activity = new ActivityService(repository);
  const admin = createClient(environment.supabaseUrl, environment.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const publicClient = createClient(environment.supabaseUrl, environment.publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const syntheticEmailPattern = `financial-ratio-analyzer-live-${runId}-%@example.test`;
  const authUserIds: string[] = [];
  const internalUserIds: string[] = [];
  const workspaceIds: string[] = [];
  const storageKeys: string[] = [];

  async function createAuthIdentity(label: string) {
    const email = `financial-ratio-analyzer-live-${runId}-${label}@example.test`;
    const password = `Valid-${randomUUID()}-A9`;
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert(!created.error && created.data.user, `Could not create synthetic Supabase user ${label}.`);
    authUserIds.push(created.data.user.id);
    const signedIn = await publicClient.auth.signInWithPassword({ email, password });
    assert(!signedIn.error && signedIn.data.user?.id === created.data.user.id, `Synthetic Supabase login failed for ${label}.`);
    const claims = await publicClient.auth.getClaims();
    assert(!claims.error && claims.data?.claims?.sub === created.data.user.id, `Supabase claims did not resolve for ${label}.`);
    await publicClient.auth.signOut();
    return { provider: "supabase" as const, providerUserId: created.data.user.id, email };
  }

  try {
    liveCheckStage = "schema validation";
    const schema = await validateSchema(pool);
    liveCheckStage = "Supabase Auth validation";
    const ownerIdentity = await createAuthIdentity("owner");
    const outsiderIdentity = await createAuthIdentity("outsider");
    const adminIdentity = await createAuthIdentity("admin");
    const memberIdentity = await createAuthIdentity("member");
    const viewerIdentity = await createAuthIdentity("viewer");

    liveCheckStage = "concurrent account bootstrap";
    const concurrentBootstrap = await Promise.all(Array.from({ length: 4 }, async () => {
      return accounts.resolveAccountForIdentity(ownerIdentity);
    }));
    const owner = concurrentBootstrap[0]!.user;
    const ownerWorkspace = concurrentBootstrap[0]!.workspace;
    internalUserIds.push(owner.id);
    workspaceIds.push(ownerWorkspace.id);
    assert(new Set(concurrentBootstrap.map((item) => item.user.id)).size === 1, "Internal user bootstrap was not idempotent.");
    assert(new Set(concurrentBootstrap.map((item) => item.workspace.id)).size === 1, "Personal workspace bootstrap was not idempotent.");
    const bootstrapCounts = await pool.query<{ users: string; workspaces: string; memberships: string }>(
      "select (select count(*) from users where auth_provider = 'supabase' and auth_provider_user_id = $1) as users, (select count(*) from workspaces where owner_user_id = $2 and name = 'Personal workspace' and archived_at is null) as workspaces, (select count(*) from workspace_members where workspace_id = $3 and user_id = $2 and role = 'owner') as memberships",
      [ownerIdentity.providerUserId, owner.id, ownerWorkspace.id],
    );
    assert(bootstrapCounts.rows[0]?.users === "1" && bootstrapCounts.rows[0]?.workspaces === "1" && bootstrapCounts.rows[0]?.memberships === "1", "Real bootstrap created duplicate account records.");

    liveCheckStage = "secondary internal-user mapping";
    const [outsider, administrator, member, viewer] = await Promise.all([outsiderIdentity, adminIdentity, memberIdentity, viewerIdentity].map(async (identity) => repository.upsertInternalUser(identity)));
    internalUserIds.push(outsider.id, administrator.id, member.id, viewer.id);
    liveCheckStage = "outsider personal workspace bootstrap";
    const outsiderAccount = await accounts.resolveAccountForIdentity(outsiderIdentity);
    assert(outsiderAccount.user.id === outsider.id, "Supabase identity did not map consistently to the internal user.");
    const outsiderWorkspace = outsiderAccount.workspace;
    liveCheckStage = "additional workspace creation";
    const additionalWorkspace = await workspaces.createPersonalWorkspace(owner.id, `Additional workspace ${runId}`);
    workspaceIds.push(outsiderWorkspace.id, additionalWorkspace.id);
    liveCheckStage = "workspace pagination";
    const workspacePage = await workspaces.listForUser(owner.id, { limit: 1 });
    assert(workspacePage.items.length === 1 && workspacePage.nextCursor, "Workspace pagination did not return an opaque next cursor.");
    assert((await workspaces.listForUser(owner.id, { limit: 1, cursor: workspacePage.nextCursor })).items.length === 1, "Workspace pagination did not return the next page.");

    liveCheckStage = "workspace role membership";
    await workspaces.addMember(owner.id, ownerWorkspace.id, administrator.id, "admin");
    await workspaces.addMember(administrator.id, ownerWorkspace.id, viewer.id, "viewer");
    await workspaces.addMember(owner.id, ownerWorkspace.id, member.id, "member");
    await expectAppError(() => workspaces.archive(administrator.id, ownerWorkspace.id), "FORBIDDEN", "Administrator could archive a workspace.");

    liveCheckStage = "company persistence and authorization";
    const company = await companies.create(owner.id, ownerWorkspace.id, { name: `Synthetic Holdings ${runId}`, industry: "Synthetic Services", currency: "EUR" });
    const secondaryCompany = await companies.create(owner.id, ownerWorkspace.id, { name: `Synthetic Secondary ${runId}`, industry: "Synthetic Services", currency: "EUR" });
    const companyPage = await companies.list(owner.id, ownerWorkspace.id, { limit: 1 });
    assert(companyPage.items.length === 1 && companyPage.nextCursor, "Company pagination did not return an opaque next cursor.");
    const companyContinuation = await companies.list(owner.id, ownerWorkspace.id, { limit: 1, cursor: companyPage.nextCursor });
    assert(
      companyContinuation.items.length === 1
        && companyContinuation.items[0]?.id !== companyPage.items[0]?.id
        && [company.id, secondaryCompany.id].includes(companyContinuation.items[0]?.id ?? ""),
      "Company pagination did not return the next page.",
    );
    const updatedCompany = await companies.update(owner.id, ownerWorkspace.id, company.id, { industry: "Synthetic Updated Services" });
    assert(updatedCompany.industry === "Synthetic Updated Services", "Company update did not persist.");
    assert((await companies.get(viewer.id, ownerWorkspace.id, company.id)).id === company.id, "Viewer could not read an authorized company.");
    await expectAppError(() => companies.update(viewer.id, ownerWorkspace.id, company.id, { industry: "Blocked" }), "FORBIDDEN", "Viewer could mutate a company.");
    assert((await companies.update(member.id, ownerWorkspace.id, company.id, { industry: "Synthetic Member Updated Services" })).industry === "Synthetic Member Updated Services", "Member could not perform a permitted company mutation.");
    await expectAppError(() => companies.get(outsider.id, ownerWorkspace.id, company.id), "FORBIDDEN", "Foreign workspace company access was not denied.");

    liveCheckStage = "dataset versioning";
    const inputV1 = cloneDemoCompany("novatech-solutions");
    const primaryDataset = await datasets.createDataset(owner.id, ownerWorkspace.id, company.id, `Primary dataset ${runId}`, inputV1, "demo");
    const secondaryDataset = await datasets.createDataset(owner.id, ownerWorkspace.id, company.id, `Secondary dataset ${runId}`, cloneDemoCompany("atlas-manufacturing-group"), "demo");
    const datasetPage = await datasets.list(owner.id, ownerWorkspace.id, company.id, { limit: 1 });
    assert(datasetPage.items.length === 1 && datasetPage.nextCursor, "Dataset pagination did not return an opaque next cursor.");
    assert((await datasets.list(owner.id, ownerWorkspace.id, company.id, { limit: 1, cursor: datasetPage.nextCursor })).items.length === 1, "Dataset pagination did not return the next page.");

    liveCheckStage = "analysis persistence and history";
    const completedV1 = await analyses.execute(owner.id, ownerWorkspace.id, company.id, primaryDataset.version.id, `live-v1-${runId}`);
    const inputV2 = structuredClone(inputV1);
    inputV2.periods[2].incomeStatement.revenue += 123;
    const versionV2 = await datasets.createVersion(owner.id, ownerWorkspace.id, company.id, primaryDataset.dataset.id, inputV2);
    const completedV2 = await analyses.execute(owner.id, ownerWorkspace.id, company.id, versionV2.id, `live-v2-${runId}`);
    const reloadedV1 = await datasets.getVersion(owner.id, ownerWorkspace.id, company.id, primaryDataset.version.id);
    const reloadedV2 = await datasets.getVersion(owner.id, ownerWorkspace.id, company.id, versionV2.id);
    assert(reloadedV1.canonicalInput.periods[2].incomeStatement.revenue === inputV1.periods[2].incomeStatement.revenue, "Dataset v1 was mutated.");
    assert(reloadedV2.canonicalInput.periods[2].incomeStatement.revenue === inputV2.periods[2].incomeStatement.revenue, "Dataset v2 edit was not persisted.");
    const historicalV1 = await analyses.get(owner.id, ownerWorkspace.id, completedV1.runId);
    assert(historicalV1.run.datasetVersionId === primaryDataset.version.id && historicalV1.run.status === "completed" && historicalV1.result, "Historical analysis does not retain v1 lineage and result.");

    const failingAnalyses = new AnalysisHistoryService(repository, () => {
      throw new Error("synthetic analysis failure");
    });
    await expectAppError(() => failingAnalyses.execute(owner.id, ownerWorkspace.id, company.id, versionV2.id, `live-failed-${runId}`), "ANALYSIS_FAILED", "Failed analysis did not return a safe application error.");
    const historyPage = await analyses.list(owner.id, ownerWorkspace.id, { limit: 1 }, company.id);
    assert(historyPage.items.length === 1 && historyPage.nextCursor, "Analysis history pagination did not return an opaque next cursor.");
    assert((await analyses.list(owner.id, ownerWorkspace.id, { limit: 1, cursor: historyPage.nextCursor }, company.id)).items.length === 1, "Analysis history pagination did not return the next page.");
    const failedRun = (await analyses.list(owner.id, ownerWorkspace.id, { limit: 10 }, company.id)).items.find((run) => run.status === "failed");
    assert(failedRun && (await analyses.get(owner.id, ownerWorkspace.id, failedRun.id)).result === null, "Failed analysis exposed a partial result.");
    await expectAppError(() => analyses.get(outsider.id, ownerWorkspace.id, completedV2.runId), "FORBIDDEN", "Foreign workspace analysis access was not denied.");

    liveCheckStage = "scenario persistence";
    const scenarioOne = await scenarios.create(owner.id, ownerWorkspace.id, company.id, { baseAnalysisRunId: completedV1.runId, sourceDatasetVersionId: primaryDataset.version.id, name: `Scenario one ${runId}`, assumptions: baseScenarioAssumptions });
    const scenarioTwo = await scenarios.create(owner.id, ownerWorkspace.id, company.id, { baseAnalysisRunId: completedV2.runId, sourceDatasetVersionId: versionV2.id, name: `Scenario two ${runId}`, assumptions: baseScenarioAssumptions });
    assert((await scenarios.get(owner.id, ownerWorkspace.id, scenarioOne.scenario.id)).result?.company.id === company.id, "Scenario payload did not recover from real PostgreSQL.");
    assert((await scenarios.update(owner.id, ownerWorkspace.id, scenarioOne.scenario.id, { description: "Synthetic scenario update" })).description === "Synthetic scenario update", "Scenario update did not persist.");
    const scenarioPage = await scenarios.list(owner.id, ownerWorkspace.id, { limit: 1 }, company.id);
    assert(scenarioPage.items.length === 1 && scenarioPage.nextCursor, "Scenario pagination did not return an opaque next cursor.");
    const scenarioContinuation = await scenarios.list(owner.id, ownerWorkspace.id, { limit: 1, cursor: scenarioPage.nextCursor }, company.id);
    assert(
      scenarioContinuation.items.length === 1
        && scenarioContinuation.items[0]?.id !== scenarioPage.items[0]?.id
        && [scenarioOne.scenario.id, scenarioTwo.scenario.id].includes(scenarioContinuation.items[0]?.id ?? ""),
      "Scenario pagination did not return the next page.",
    );
    await expectAppError(() => scenarios.archive(outsider.id, ownerWorkspace.id, scenarioOne.scenario.id), "FORBIDDEN", "Foreign workspace scenario access was not denied.");
    await scenarios.archive(owner.id, ownerWorkspace.id, scenarioOne.scenario.id);
    await expectAppError(() => scenarios.get(owner.id, ownerWorkspace.id, scenarioOne.scenario.id), "NOT_FOUND", "Archived scenario remained reachable.");

    liveCheckStage = "storage metadata linkage";
    const fileOne = await files.upload(owner.id, ownerWorkspace.id, { companyId: company.id, originalFilename: "synthetic-source.pdf", mimeType: "application/pdf", category: "source_document", body: new TextEncoder().encode("synthetic file one") });
    const fileTwo = await files.upload(owner.id, ownerWorkspace.id, { companyId: company.id, originalFilename: "synthetic-source-two.pdf", mimeType: "application/pdf", category: "source_document", body: new TextEncoder().encode("synthetic file two") });
    storageKeys.push(fileOne.storageKey, fileTwo.storageKey);
    assert(fileOne.storageKey.startsWith(`workspaces/${ownerWorkspace.id}/companies/${company.id}/`) && !fileOne.storageKey.includes(fileOne.originalFilename), "Private storage key is not tenant-scoped and generated.");
    const filePage = await files.list(owner.id, ownerWorkspace.id, { limit: 1 }, company.id);
    assert(filePage.items.length === 1 && filePage.nextCursor, "File pagination did not return an opaque next cursor.");
    assert((await files.list(owner.id, ownerWorkspace.id, { limit: 1, cursor: filePage.nextCursor }, company.id)).items.length === 1, "File pagination did not return the next page.");
    const signedUrl = await files.getSignedUrl(owner.id, ownerWorkspace.id, fileOne.id);
    assert((await fetch(signedUrl)).ok, "Private signed file retrieval failed.");
    const rawPublicResponse = await fetch(`${environment.supabaseUrl}/storage/v1/object/public/${environment.bucket}/${fileOne.storageKey}`);
    assert(!rawPublicResponse.ok, "Private object was publicly readable.");
    await expectAppError(() => files.getSignedUrl(outsider.id, ownerWorkspace.id, fileOne.id), "FORBIDDEN", "Foreign workspace file access was not denied.");
    await files.delete(owner.id, ownerWorkspace.id, fileOne.id);
    await files.delete(owner.id, ownerWorkspace.id, fileTwo.id);
    storageKeys.length = 0;
    assert(!(await storage.exists(fileOne.storageKey)) && !(await storage.exists(fileTwo.storageKey)), "Private objects remained after file deletion.");

    liveCheckStage = "activity and archive behavior";
    const events = await activity.list(owner.id, ownerWorkspace.id, { limit: 100 }, company.id);
    for (const eventType of ["company.created", "dataset.version_created", "analysis.completed", "scenario.created", "file.uploaded"] as const) {
      assert(events.items.some((event) => event.eventType === eventType), `Expected activity event is missing: ${eventType}`);
    }
    assert(events.items.every((event) => JSON.stringify(event.metadata).length < 1_000), "Activity metadata contains an unexpectedly large payload.");

    await datasets.archive(owner.id, ownerWorkspace.id, company.id, secondaryDataset.dataset.id);
    await expectAppError(() => datasets.getVersion(owner.id, ownerWorkspace.id, company.id, secondaryDataset.version.id), "NOT_FOUND", "Archived dataset version remained reachable.");
    await companies.archive(owner.id, ownerWorkspace.id, company.id);
    await expectAppError(() => companies.get(owner.id, ownerWorkspace.id, company.id), "NOT_FOUND", "Archived company remained reachable.");
    await workspaces.archive(owner.id, ownerWorkspace.id);
    await expectAppError(() => companies.list(owner.id, ownerWorkspace.id, { limit: 10 }), "FORBIDDEN", "Archived workspace remained operational.");

    console.info(`Live integration check passed. RLS application-table status: ${schema.rlsEnabled ? "enabled" : "server-mediated"}.`);
  } finally {
    for (const storageKey of storageKeys) {
      try {
        await storage.delete(storageKey);
      } catch {
        // A failed cleanup must not reveal provider details; database cleanup still runs below.
      }
    }
    const residualUsers = await pool.query<{ id: string }>("select id from users where email like $1", [syntheticEmailPattern]);
    const cleanupUserIds = [...new Set([...internalUserIds, ...residualUsers.rows.map((row) => row.id)])];
    const residualWorkspaces = cleanupUserIds.length > 0
      ? await pool.query<{ id: string }>("select id from workspaces where owner_user_id = any($1::uuid[])", [cleanupUserIds])
      : { rows: [] };
    const cleanupWorkspaceIds = [...new Set([...workspaceIds, ...residualWorkspaces.rows.map((row) => row.id)])];
    if (cleanupWorkspaceIds.length > 0) {
      const parameters = [cleanupWorkspaceIds];
      await pool.query("delete from activity_events where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from files where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from scenarios where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from analysis_runs where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from financial_dataset_versions where financial_dataset_id in (select fd.id from financial_datasets fd join companies c on c.id = fd.company_id where c.workspace_id = any($1::uuid[]))", parameters);
      await pool.query("delete from financial_datasets where company_id in (select id from companies where workspace_id = any($1::uuid[]))", parameters);
      await pool.query("delete from companies where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from workspace_members where workspace_id = any($1::uuid[])", parameters);
      await pool.query("delete from workspaces where id = any($1::uuid[])", parameters);
    }
    if (cleanupUserIds.length > 0) {
      await pool.query("delete from users where id = any($1::uuid[])", [cleanupUserIds]);
    }
    await Promise.all(authUserIds.map(async (id) => admin.auth.admin.deleteUser(id)));
    await pool.end();
    await closeDatabaseConnection();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof AppError ? `Live integration check failed during ${liveCheckStage}: ${error.safeMessage}` : `Live integration check failed during ${liveCheckStage}.`);
  process.exitCode = 1;
});
