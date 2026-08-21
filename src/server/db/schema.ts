import { sql } from "drizzle-orm";
import { index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import type { FinancialAnalysisInput, ScenarioAssumptions } from "@/domain";
import type { AnalysisSnapshot } from "@/server/analysis/analysis-snapshot";

export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member", "viewer"]);
export const datasetSourceTypeEnum = pgEnum("dataset_source_type", ["manual", "demo", "import", "scenario"]);
export const statementTypeEnum = pgEnum("statement_type", ["income_statement", "balance_sheet", "cash_flow", "working_capital"]);
export const valueSourceTypeEnum = pgEnum("value_source_type", ["manual", "demo", "import", "scenario"]);
export const analysisRunStatusEnum = pgEnum("analysis_run_status", ["pending", "running", "completed", "failed", "cancelled"]);
export const analysisResultTypeEnum = pgEnum("analysis_result_type", ["financial_analysis"]);
export const fileCategoryEnum = pgEnum("file_category", ["financial_input", "source_document", "import", "report"]);

const id = () => uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: id(),
  authProvider: varchar("auth_provider", { length: 64 }).notNull(),
  authProviderUserId: varchar("auth_provider_user_id", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("users_auth_identity_unique").on(table.authProvider, table.authProviderUserId),
  uniqueIndex("users_email_unique").on(table.email),
]);

export const workspaces = pgTable("workspaces", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("workspaces_owner_name_active_unique").on(table.ownerUserId, table.name).where(sql`${table.archivedAt} is null`),
  index("workspaces_owner_user_id_idx").on(table.ownerUserId),
]);

export const workspaceMembers = pgTable("workspace_members", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  role: workspaceRoleEnum("role").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("workspace_members_workspace_user_unique").on(table.workspaceId, table.userId),
  index("workspace_members_user_id_idx").on(table.userId),
]);

export const companies = pgTable("companies", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [index("companies_workspace_id_idx").on(table.workspaceId)]);

export const financialDatasets = pgTable("financial_datasets", {
  id: id(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [index("financial_datasets_company_id_idx").on(table.companyId)]);

export const financialDatasetVersions = pgTable("financial_dataset_versions", {
  id: id(),
  financialDatasetId: uuid("financial_dataset_id").notNull().references(() => financialDatasets.id, { onDelete: "restrict" }),
  versionNumber: integer("version_number").notNull(),
  sourceType: datasetSourceTypeEnum("source_type").notNull(),
  schemaVersion: integer("schema_version").notNull().default(1),
  canonicalInput: jsonb("canonical_input").$type<FinancialAnalysisInput>().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("financial_dataset_versions_dataset_version_unique").on(table.financialDatasetId, table.versionNumber),
  index("financial_dataset_versions_dataset_id_idx").on(table.financialDatasetId),
]);

export const financialStatements = pgTable("financial_statements", {
  id: id(),
  datasetVersionId: uuid("dataset_version_id").notNull().references(() => financialDatasetVersions.id, { onDelete: "cascade" }),
  statementType: statementTypeEnum("statement_type").notNull(),
  periodYear: integer("period_year").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("financial_statements_version_type_year_unique").on(table.datasetVersionId, table.statementType, table.periodYear),
  index("financial_statements_dataset_version_id_idx").on(table.datasetVersionId),
]);

export const financialStatementValues = pgTable("financial_statement_values", {
  id: id(),
  financialStatementId: uuid("financial_statement_id").notNull().references(() => financialStatements.id, { onDelete: "cascade" }),
  metricKey: varchar("metric_key", { length: 128 }).notNull(),
  value: numeric("value", { precision: 20, scale: 6 }).notNull(),
  source: valueSourceTypeEnum("source").notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("financial_statement_values_statement_metric_unique").on(table.financialStatementId, table.metricKey),
  index("financial_statement_values_statement_id_idx").on(table.financialStatementId),
]);

export const analysisRuns = pgTable("analysis_runs", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  datasetVersionId: uuid("dataset_version_id").notNull().references(() => financialDatasetVersions.id, { onDelete: "restrict" }),
  requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
  status: analysisRunStatusEnum("status").notNull().default("pending"),
  engineVersion: varchar("engine_version", { length: 128 }).notNull(),
  inputSchemaVersion: integer("input_schema_version").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failureCode: varchar("failure_code", { length: 128 }),
  idempotencyKey: varchar("idempotency_key", { length: 255 }),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("analysis_runs_workspace_idempotency_unique").on(table.workspaceId, table.idempotencyKey),
  index("analysis_runs_workspace_created_at_idx").on(table.workspaceId, table.createdAt),
  index("analysis_runs_company_created_at_idx").on(table.companyId, table.createdAt),
  index("analysis_runs_dataset_version_id_idx").on(table.datasetVersionId),
]);

export const analysisResults = pgTable("analysis_results", {
  id: id(),
  analysisRunId: uuid("analysis_run_id").notNull().references(() => analysisRuns.id, { onDelete: "cascade" }),
  resultType: analysisResultTypeEnum("result_type").notNull().default("financial_analysis"),
  schemaVersion: integer("schema_version").notNull(),
  payload: jsonb("payload").$type<AnalysisSnapshot>().notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("analysis_results_run_type_unique").on(table.analysisRunId, table.resultType),
  index("analysis_results_analysis_run_id_idx").on(table.analysisRunId),
]);

export const scenarios = pgTable("scenarios", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  baseAnalysisRunId: uuid("base_analysis_run_id").notNull().references(() => analysisRuns.id, { onDelete: "restrict" }),
  sourceDatasetVersionId: uuid("source_dataset_version_id").notNull().references(() => financialDatasetVersions.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
}, (table) => [index("scenarios_company_id_idx").on(table.companyId)]);

export const scenarioAssumptions = pgTable("scenario_assumptions", {
  id: id(),
  scenarioId: uuid("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  schemaVersion: integer("schema_version").notNull().default(1),
  assumptions: jsonb("assumptions").$type<ScenarioAssumptions>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("scenario_assumptions_scenario_unique").on(table.scenarioId)]);

export const scenarioResults = pgTable("scenario_results", {
  id: id(),
  scenarioId: uuid("scenario_id").notNull().references(() => scenarios.id, { onDelete: "cascade" }),
  sourceDatasetVersionId: uuid("source_dataset_version_id").notNull().references(() => financialDatasetVersions.id, { onDelete: "restrict" }),
  baseAnalysisRunId: uuid("base_analysis_run_id").notNull().references(() => analysisRuns.id, { onDelete: "restrict" }),
  engineVersion: varchar("engine_version", { length: 128 }).notNull(),
  schemaVersion: integer("schema_version").notNull(),
  payload: jsonb("payload").$type<AnalysisSnapshot>().notNull(),
  createdAt: createdAt(),
}, (table) => [index("scenario_results_scenario_id_idx").on(table.scenarioId)]);

export const files = pgTable("files", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  originalFilename: varchar("original_filename", { length: 512 }).notNull(),
  storageKey: varchar("storage_key", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  category: fileCategoryEnum("category").notNull(),
  checksum: varchar("checksum", { length: 128 }).notNull(),
  createdAt: createdAt(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("files_storage_key_unique").on(table.storageKey),
  index("files_workspace_created_at_idx").on(table.workspaceId, table.createdAt),
  index("files_company_id_idx").on(table.companyId),
]);

export const activityEvents = pgTable("activity_events", {
  id: id(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  createdAt: createdAt(),
}, (table) => [
  index("activity_events_workspace_created_at_idx").on(table.workspaceId, table.createdAt),
  index("activity_events_company_id_idx").on(table.companyId),
]);
