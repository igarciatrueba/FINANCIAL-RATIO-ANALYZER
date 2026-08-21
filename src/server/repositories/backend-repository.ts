import { and, desc, eq, isNull, lt, max, or } from "drizzle-orm";

import type { FinancialAnalysisInput, ScenarioAssumptions } from "@/domain";
import { canonicalInputToStatementRows } from "@/server/datasets/canonical-statement-mapper";
import type { AuthenticatedIdentity } from "@/server/auth/types";
import type { AppDatabase } from "@/server/db/client";
import {
  activityEvents,
  analysisResults,
  analysisRuns,
  companies,
  files,
  financialDatasets,
  financialDatasetVersions,
  financialStatements,
  financialStatementValues,
  scenarioAssumptions,
  scenarioResults,
  scenarios,
  users,
  workspaceMembers,
  workspaces,
} from "@/server/db/schema";
import type { AnalysisSnapshot } from "@/server/analysis/analysis-snapshot";
import type { WorkspaceRole } from "@/server/authorization";

export type PageRequest = { cursor?: string; limit: number };
export type PageResult<T> = { items: T[]; nextCursor: string | null };

type AnalysisCursor = { createdAt: Date; id: string };

function encodeAnalysisCursor(run: typeof analysisRuns.$inferSelect) {
  return `${run.createdAt.toISOString()}|${run.id}`;
}

function decodeAnalysisCursor(cursor: string): AnalysisCursor | null {
  const separator = cursor.lastIndexOf("|");
  if (separator <= 0) return null;
  const createdAt = new Date(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  return Number.isNaN(createdAt.valueOf()) || !id ? null : { createdAt, id };
}

export class BackendRepository {
  constructor(private readonly database: AppDatabase) {}

  async upsertInternalUser(identity: AuthenticatedIdentity) {
    const [existing] = await this.database.select().from(users).where(and(
      eq(users.authProvider, identity.provider),
      eq(users.authProviderUserId, identity.providerUserId),
    )).limit(1);

    if (existing) {
      const [updated] = await this.database.update(users).set({
        email: identity.email.toLowerCase(),
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, existing.id)).returning();
      return updated;
    }

    const [created] = await this.database.insert(users).values({
      authProvider: identity.provider,
      authProviderUserId: identity.providerUserId,
      email: identity.email.toLowerCase(),
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastLoginAt: new Date(),
    }).returning();
    return created;
  }

  async createWorkspaceWithOwner(input: { name: string; ownerUserId: string }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const [workspace] = await scoped.database.insert(workspaces).values({ name: input.name, ownerUserId: input.ownerUserId }).returning();
      await scoped.database.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: input.ownerUserId, role: "owner" });
      return workspace;
    });
  }

  async findWorkspaceOwnedBy(userId: string, name: string) {
    const [workspace] = await this.database.select().from(workspaces).where(and(
      eq(workspaces.ownerUserId, userId),
      eq(workspaces.name, name),
      isNull(workspaces.archivedAt),
    )).limit(1);
    return workspace ?? null;
  }

  async findMembership(userId: string, workspaceId: string) {
    const [membership] = await this.database.select().from(workspaceMembers).where(and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
    )).limit(1);
    return membership ?? null;
  }

  async addWorkspaceMember(input: { workspaceId: string; userId: string; role: WorkspaceRole }) {
    const [membership] = await this.database.insert(workspaceMembers).values(input).returning();
    return membership;
  }

  async createCompany(input: { workspaceId: string; name: string; industry: string; currency: "EUR" | "USD" | "GBP"; createdBy: string }) {
    const [company] = await this.database.insert(companies).values(input).returning();
    return company;
  }

  async findCompanyForWorkspace(workspaceId: string, companyId: string) {
    const [company] = await this.database.select().from(companies).where(and(
      eq(companies.id, companyId),
      eq(companies.workspaceId, workspaceId),
      isNull(companies.archivedAt),
    )).limit(1);
    return company ?? null;
  }

  async listCompaniesForWorkspace(workspaceId: string) {
    return this.database.select().from(companies).where(and(
      eq(companies.workspaceId, workspaceId),
      isNull(companies.archivedAt),
    )).orderBy(companies.name);
  }

  async findCompanyByNameForWorkspace(workspaceId: string, name: string) {
    const [company] = await this.database.select().from(companies).where(and(
      eq(companies.workspaceId, workspaceId),
      eq(companies.name, name),
      isNull(companies.archivedAt),
    )).limit(1);
    return company ?? null;
  }

  async archiveCompany(workspaceId: string, companyId: string) {
    const [company] = await this.database.update(companies).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(
      eq(companies.id, companyId),
      eq(companies.workspaceId, workspaceId),
      isNull(companies.archivedAt),
    )).returning();
    return company ?? null;
  }

  async createDatasetWithInitialVersion(input: {
    workspaceId: string;
    companyId: string;
    name: string;
    createdBy: string;
    sourceType: "manual" | "demo" | "import" | "scenario";
    canonicalInput: FinancialAnalysisInput;
  }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const company = await scoped.findCompanyForWorkspace(input.workspaceId, input.companyId);
      if (!company) return null;
      const [dataset] = await scoped.database.insert(financialDatasets).values({ companyId: company.id, name: input.name, createdBy: input.createdBy }).returning();
      const version = await scoped.insertDatasetVersion({ ...input, financialDatasetId: dataset.id, versionNumber: 1 });
      return { dataset, version };
    });
  }

  async createNextDatasetVersion(input: {
    workspaceId: string;
    companyId: string;
    financialDatasetId: string;
    createdBy: string;
    sourceType: "manual" | "demo" | "import" | "scenario";
    canonicalInput: FinancialAnalysisInput;
  }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const [dataset] = await scoped.database.select().from(financialDatasets).innerJoin(companies, eq(financialDatasets.companyId, companies.id)).where(and(
        eq(financialDatasets.id, input.financialDatasetId),
        eq(financialDatasets.companyId, input.companyId),
        eq(companies.workspaceId, input.workspaceId),
        isNull(financialDatasets.archivedAt),
      )).limit(1);
      if (!dataset) return null;
      const [latest] = await scoped.database.select({ versionNumber: max(financialDatasetVersions.versionNumber) }).from(financialDatasetVersions).where(eq(financialDatasetVersions.financialDatasetId, input.financialDatasetId));
      return scoped.insertDatasetVersion({ ...input, versionNumber: (latest?.versionNumber ?? 0) + 1 });
    });
  }

  private async insertDatasetVersion(input: {
    financialDatasetId: string;
    companyId: string;
    createdBy: string;
    sourceType: "manual" | "demo" | "import" | "scenario";
    canonicalInput: FinancialAnalysisInput;
    versionNumber: number;
  }) {
    const [version] = await this.database.insert(financialDatasetVersions).values({
      financialDatasetId: input.financialDatasetId,
      versionNumber: input.versionNumber,
      sourceType: input.sourceType,
      canonicalInput: input.canonicalInput,
      createdBy: input.createdBy,
    }).returning();
    const statementRows = canonicalInputToStatementRows(input.canonicalInput, version.id, input.sourceType);
    for (const statement of statementRows) {
      const [createdStatement] = await this.database.insert(financialStatements).values({
        datasetVersionId: statement.datasetVersionId,
        statementType: statement.statementType,
        periodYear: statement.periodYear,
        currency: statement.currency,
      }).returning();
      await this.database.insert(financialStatementValues).values(statement.values.map((value) => ({
        financialStatementId: createdStatement.id,
        metricKey: value.metricKey,
        value: value.value,
        source: value.source,
      })));
    }
    return version;
  }

  async findDatasetVersionForWorkspace(workspaceId: string, companyId: string, datasetVersionId: string) {
    const [row] = await this.database.select({ version: financialDatasetVersions, dataset: financialDatasets, company: companies }).from(financialDatasetVersions)
      .innerJoin(financialDatasets, eq(financialDatasetVersions.financialDatasetId, financialDatasets.id))
      .innerJoin(companies, eq(financialDatasets.companyId, companies.id))
      .where(and(
        eq(financialDatasetVersions.id, datasetVersionId),
        eq(financialDatasets.companyId, companyId),
        eq(companies.workspaceId, workspaceId),
        isNull(companies.archivedAt),
      )).limit(1);
    return row ?? null;
  }

  async listDatasetsForCompany(workspaceId: string, companyId: string) {
    return this.database.select({ dataset: financialDatasets }).from(financialDatasets)
      .innerJoin(companies, eq(financialDatasets.companyId, companies.id))
      .where(and(
        eq(financialDatasets.companyId, companyId),
        eq(companies.workspaceId, workspaceId),
        isNull(financialDatasets.archivedAt),
      ))
      .orderBy(financialDatasets.createdAt);
  }

  async createAnalysisRun(input: { workspaceId: string; companyId: string; datasetVersionId: string; requestedBy: string; engineVersion: string; idempotencyKey?: string }) {
    const [run] = await this.database.insert(analysisRuns).values({ ...input, status: "pending" }).returning();
    return run;
  }

  async findAnalysisRunByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    const [run] = await this.database.select().from(analysisRuns).where(and(
      eq(analysisRuns.workspaceId, workspaceId),
      eq(analysisRuns.idempotencyKey, idempotencyKey),
    )).limit(1);
    return run ?? null;
  }

  async markAnalysisRunning(runId: string) {
    const [run] = await this.database.update(analysisRuns).set({ status: "running", startedAt: new Date(), failureCode: null }).where(eq(analysisRuns.id, runId)).returning();
    return run;
  }

  async completeAnalysisRun(runId: string, snapshot: AnalysisSnapshot) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      await scoped.database.insert(analysisResults).values({ analysisRunId: runId, schemaVersion: snapshot.schemaVersion, payload: snapshot });
      const [run] = await scoped.database.update(analysisRuns).set({ status: "completed", completedAt: new Date(), failureCode: null }).where(eq(analysisRuns.id, runId)).returning();
      return run;
    });
  }

  async failAnalysisRun(runId: string, failureCode: string) {
    const [run] = await this.database.update(analysisRuns).set({ status: "failed", completedAt: new Date(), failureCode }).where(eq(analysisRuns.id, runId)).returning();
    return run;
  }

  async getAnalysisRunForWorkspace(workspaceId: string, runId: string) {
    const [row] = await this.database.select({ run: analysisRuns, result: analysisResults }).from(analysisRuns)
      .leftJoin(analysisResults, eq(analysisResults.analysisRunId, analysisRuns.id))
      .where(and(eq(analysisRuns.id, runId), eq(analysisRuns.workspaceId, workspaceId))).limit(1);
    return row ?? null;
  }

  async listAnalysisRuns(workspaceId: string, request: PageRequest, companyId?: string): Promise<PageResult<typeof analysisRuns.$inferSelect>> {
    const where = [eq(analysisRuns.workspaceId, workspaceId)];
    if (companyId) where.push(eq(analysisRuns.companyId, companyId));
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(analysisRuns.createdAt, cursor.createdAt),
        and(eq(analysisRuns.createdAt, cursor.createdAt), lt(analysisRuns.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select().from(analysisRuns).where(and(...where)).orderBy(desc(analysisRuns.createdAt), desc(analysisRuns.id)).limit(request.limit + 1);
    const next = items.length > request.limit ? items.pop() : undefined;
    return { items, nextCursor: next ? encodeAnalysisCursor(next) : null };
  }

  async createScenario(input: { workspaceId: string; companyId: string; baseAnalysisRunId: string; sourceDatasetVersionId: string; name: string; description?: string; createdBy: string; assumptions: ScenarioAssumptions }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const [scenario] = await scoped.database.insert(scenarios).values({
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        baseAnalysisRunId: input.baseAnalysisRunId,
        sourceDatasetVersionId: input.sourceDatasetVersionId,
        name: input.name,
        description: input.description,
        createdBy: input.createdBy,
      }).returning();
      await scoped.database.insert(scenarioAssumptions).values({ scenarioId: scenario.id, assumptions: input.assumptions });
      return scenario;
    });
  }

  async createScenarioResult(input: { scenarioId: string; sourceDatasetVersionId: string; baseAnalysisRunId: string; engineVersion: string; snapshot: AnalysisSnapshot }) {
    const [result] = await this.database.insert(scenarioResults).values({
      scenarioId: input.scenarioId,
      sourceDatasetVersionId: input.sourceDatasetVersionId,
      baseAnalysisRunId: input.baseAnalysisRunId,
      engineVersion: input.engineVersion,
      schemaVersion: input.snapshot.schemaVersion,
      payload: input.snapshot,
    }).returning();
    return result;
  }

  async createFileMetadata(input: { workspaceId: string; companyId?: string; uploadedBy: string; originalFilename: string; storageKey: string; mimeType: string; sizeBytes: number; category: "financial_input" | "source_document" | "import" | "report"; checksum: string }) {
    const [file] = await this.database.insert(files).values(input).returning();
    return file;
  }

  async findFileForWorkspace(workspaceId: string, fileId: string) {
    const [file] = await this.database.select().from(files).where(and(eq(files.id, fileId), eq(files.workspaceId, workspaceId), isNull(files.deletedAt))).limit(1);
    return file ?? null;
  }

  async recordActivity(input: { workspaceId: string; userId?: string; companyId?: string; eventType: string; entityType: string; entityId?: string; metadata?: Record<string, string | number | boolean | null> }) {
    const [event] = await this.database.insert(activityEvents).values({ ...input, metadata: input.metadata ?? {} }).returning();
    return event;
  }

  async listActivityForWorkspace(workspaceId: string, request: PageRequest, companyId?: string) {
    const where = [eq(activityEvents.workspaceId, workspaceId)];
    if (companyId) where.push(eq(activityEvents.companyId, companyId));
    const items = await this.database.select().from(activityEvents).where(and(...where)).orderBy(desc(activityEvents.createdAt), desc(activityEvents.id)).limit(request.limit);
    return items;
  }
}
