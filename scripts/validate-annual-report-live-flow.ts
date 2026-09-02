import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

import { cloneDemoCompany } from "../src/features/financial-input/demo-companies";
import { closeDatabaseConnection, getDatabase } from "../src/server/db/client";
import { AppError } from "../src/server/errors";
import { BackendRepository } from "../src/server/repositories/backend-repository";
import { AccountService } from "../src/server/services/account-service";
import { AnalysisHistoryService } from "../src/server/services/analysis-history-service";
import { CompanyService } from "../src/server/services/company-service";
import { DocumentExtractionService } from "../src/server/services/document-extraction-service";
import { FileService } from "../src/server/services/file-service";
import { FinancialDatasetService } from "../src/server/services/financial-dataset-service";
import { SupabaseStorageService } from "../src/server/storage/supabase-storage-service";
import { canonicalInputToStatementRows } from "../src/server/datasets/canonical-statement-mapper";

const requiredEnvironment = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
] as const;

const corpusDirectory = process.env.EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR;

function requireEnvironment() {
  if (!corpusDirectory) throw new Error("Set EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR to the approved local annual-report corpus.");
  for (const name of requiredEnvironment) {
    if (!process.env[name]) throw new Error(`${name} must be configured for the live annual-report validation.`);
  }
  return {
    corpusDirectory: corpusDirectory!,
    databaseUrl: process.env.DATABASE_URL!,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    bucket: process.env.SUPABASE_STORAGE_BUCKET!,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function canonicalReviewValues(input: ReturnType<typeof cloneDemoCompany>) {
  const values = new Map<string, string>();
  for (const statement of canonicalInputToStatementRows(input, "annual-report-e2e", "import")) {
    const periodSlotIndex = input.periods.findIndex((period) => period.year === statement.periodYear);
    for (const value of statement.values) values.set(`${value.metricKey}:${periodSlotIndex}`, value.value);
  }
  return values;
}

async function main() {
  const environment = requireEnvironment();
  const runId = randomUUID();
  const email = `equiverse-annual-report-e2e-${runId}@example.test`;
  const password = `Valid-${randomUUID()}-A9`;
  const pool = new Pool({ connectionString: environment.databaseUrl });
  const repository = new BackendRepository(getDatabase());
  const accounts = new AccountService(repository);
  const companies = new CompanyService(repository);
  const datasets = new FinancialDatasetService(repository);
  const analyses = new AnalysisHistoryService(repository);
  const storage = new SupabaseStorageService(environment.bucket);
  const files = new FileService(repository, storage);
  const documents = new DocumentExtractionService(repository, storage);
  const admin = createClient(environment.supabaseUrl, environment.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let authUserId: string | null = null;
  let workspaceId: string | null = null;
  const storageKeys: string[] = [];

  try {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert(!created.error && created.data.user, "Could not create an isolated Supabase identity for the annual-report E2E validation.");
    authUserId = created.data.user.id;
    const account = await accounts.resolveAccountForIdentity({ provider: "supabase", providerUserId: authUserId, email });
    workspaceId = account.workspace.id;

    const company = await companies.create(account.user.id, workspaceId, {
      name: `Annual report E2E ${runId}`,
      industry: "Validation",
      currency: "USD",
    });
    const microsoftBytes = new Uint8Array(await readFile(join(environment.corpusDirectory, "microsoft-2024.pdf")));
    const microsoftFile = await files.upload(account.user.id, workspaceId, {
      companyId: company.id,
      originalFilename: "microsoft-2024.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      body: microsoftBytes,
    });
    storageKeys.push(microsoftFile.storageKey);
    const microsoftExtraction = await documents.extract(account.user.id, workspaceId, microsoftFile.id);
    assert(microsoftExtraction?.run.status === "ready_for_review", "The real Microsoft report did not reach ready-for-review status.");
    assert(microsoftExtraction.draftFields.length === 54, "The real Microsoft report did not create the complete review draft.");
    const revenue = microsoftExtraction.draftFields.find((field) => field.canonicalFieldKey === "revenue" && field.periodSlotIndex === 2);
    const revenueCandidate = revenue?.currentCandidateId ? microsoftExtraction.candidates.find((candidate) => candidate.id === revenue.currentCandidateId) : null;
    assert(revenueCandidate?.sourceEvidence.sourceLabel === "Total revenue" && revenueCandidate.sourceEvidence.pageNumber === 48, "The source evidence for extracted Microsoft revenue is incomplete.");

    const canonicalInput = cloneDemoCompany("novatech-solutions");
    canonicalInput.company = { ...canonicalInput.company, id: `annual-report-e2e-${runId}`, name: company.name, industry: company.industry, currency: "USD" };
    canonicalInput.periods[2].incomeStatement.revenue = 245122000001;
    canonicalInput.periods[2].incomeStatement.interestExpense = 1000000000;
    const reviewValues = canonicalReviewValues(canonicalInput);

    const manualField = await documents.resolveDraftField(account.user.id, workspaceId, microsoftExtraction.run.id, {
      canonicalFieldKey: "interestExpense",
      periodSlotIndex: 2,
      action: "provide_value",
      value: reviewValues.get("interestExpense:2"),
    });
    assert(manualField.provenanceType === "USER_PROVIDED" && manualField.reviewState === "USER_CONFIRMED", "A missing annual-report value was not retained as user-provided input.");

    const overriddenField = await documents.resolveDraftField(account.user.id, workspaceId, microsoftExtraction.run.id, {
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      action: "provide_value",
      value: "245122000001",
    });
    assert(overriddenField.provenanceType === "USER_OVERRIDE" && overriddenField.originalCandidateId === revenue?.originalCandidateId, "A user override did not preserve the original PDF evidence.");

    for (const field of microsoftExtraction.draftFields) {
      if ((field.canonicalFieldKey === "interestExpense" || field.canonicalFieldKey === "revenue") && field.periodSlotIndex === 2) continue;
      const value = reviewValues.get(`${field.canonicalFieldKey}:${field.periodSlotIndex}`);
      assert(value !== undefined, `The canonical E2E dataset does not provide ${field.canonicalFieldKey}:${field.periodSlotIndex}.`);
      await documents.resolveDraftField(account.user.id, workspaceId, microsoftExtraction.run.id, {
        canonicalFieldKey: field.canonicalFieldKey,
        periodSlotIndex: field.periodSlotIndex,
        action: "provide_value",
        value,
      });
    }

    const signedUrl = await files.getSignedUrl(account.user.id, workspaceId, microsoftFile.id);
    assert((await fetch(signedUrl)).ok, "The uploaded annual report could not be inspected through a private signed URL.");
    const rawPublicResponse = await fetch(`${environment.supabaseUrl}/storage/v1/object/public/${environment.bucket}/${microsoftFile.storageKey}`);
    assert(!rawPublicResponse.ok, "The uploaded annual report was publicly reachable.");

    const dataset = await datasets.createDataset(account.user.id, workspaceId, company.id, "Financial statements", canonicalInput, "import");
    const confirmedRun = await documents.confirmDataset(account.user.id, workspaceId, microsoftExtraction.run.id, dataset.version.id);
    assert(confirmedRun.confirmedDatasetVersionId === dataset.version.id, "The reviewed extraction did not retain immutable dataset-version lineage.");
    const analysis = await analyses.execute(account.user.id, workspaceId, company.id, dataset.version.id, `annual-report-e2e-${runId}`);
    const persistedAnalysis = await analyses.get(account.user.id, workspaceId, analysis.runId);
    assert(persistedAnalysis.run.status === "completed" && persistedAnalysis.result !== null, "The confirmed annual-report dataset did not produce a persisted analysis.");

    const siemensBytes = new Uint8Array(await readFile(join(environment.corpusDirectory, "siemens-2024.pdf")));
    const siemensFile = await files.upload(account.user.id, workspaceId, {
      companyId: company.id,
      originalFilename: "siemens-2024.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      body: siemensBytes,
    });
    storageKeys.push(siemensFile.storageKey);
    const siemensExtraction = await documents.extract(account.user.id, workspaceId, siemensFile.id);
    const slots = siemensExtraction?.run.documentSummary.periodSlots;
    assert(Array.isArray(slots) && slots[0]?.fiscalPeriod === null && slots[0]?.resolution === "manual_input_required", "A two-year annual report did not preserve an unresolved third canonical slot.");

    console.info("Live annual-report E2E validation passed: private upload, extraction, evidence inspection, user-provided value, user override, immutable dataset confirmation, analysis persistence and two-year manual slot.");
  } finally {
    for (const storageKey of storageKeys) {
      await storage.delete(storageKey);
      assert(!(await storage.exists(storageKey)), "A temporary annual-report object remained in private storage after cleanup.");
    }
    if (workspaceId) {
      await pool.query("delete from document_extraction_runs where workspace_id = $1", [workspaceId]);
      await pool.query("delete from activity_events where workspace_id = $1", [workspaceId]);
      await pool.query("delete from files where workspace_id = $1", [workspaceId]);
      await pool.query("delete from analysis_runs where workspace_id = $1", [workspaceId]);
      await pool.query("delete from financial_dataset_versions where financial_dataset_id in (select fd.id from financial_datasets fd join companies c on c.id = fd.company_id where c.workspace_id = $1)", [workspaceId]);
      await pool.query("delete from financial_datasets where company_id in (select id from companies where workspace_id = $1)", [workspaceId]);
      await pool.query("delete from companies where workspace_id = $1", [workspaceId]);
      await pool.query("delete from workspace_members where workspace_id = $1", [workspaceId]);
      await pool.query("delete from workspaces where id = $1", [workspaceId]);
    }
    if (authUserId) {
      await pool.query("delete from users where auth_provider = 'supabase' and auth_provider_user_id = $1", [authUserId]);
      await admin.auth.admin.deleteUser(authUserId);
    }
    if (workspaceId || authUserId) {
      const remaining = await pool.query<{ workspaceCount: string; userCount: string }>(
        "select (select count(*) from workspaces where id = $1)::text as \"workspaceCount\", (select count(*) from users where auth_provider = 'supabase' and auth_provider_user_id = $2)::text as \"userCount\"",
        [workspaceId, authUserId],
      );
      assert(remaining.rows[0]?.workspaceCount === "0" && remaining.rows[0]?.userCount === "0", "Temporary annual-report QA records remained after cleanup.");
    }
    await pool.end();
    await closeDatabaseConnection();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof AppError ? error.safeMessage : "Live annual-report E2E validation failed.");
  process.exitCode = 1;
});
