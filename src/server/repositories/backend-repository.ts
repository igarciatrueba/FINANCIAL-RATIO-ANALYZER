import { and, desc, eq, isNull, lt, max, or, sql } from "drizzle-orm";

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
import { AppError } from "@/server/errors";

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
    const now = new Date();
    const [created] = await this.database.insert(users).values({
      authProvider: identity.provider,
      authProviderUserId: identity.providerUserId,
      email: identity.email.toLowerCase(),
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastLoginAt: now,
    }).onConflictDoNothing().returning();
    if (created) return created;

    const [existing] = await this.database.select().from(users).where(and(
      eq(users.authProvider, identity.provider),
      eq(users.authProviderUserId, identity.providerUserId),
    )).limit(1);
    if (!existing) {
      throw new AppError("CONFLICT", "This email is already connected to a different authenticated identity.");
    }

    const [updated] = await this.database.update(users).set({
      email: identity.email.toLowerCase(),
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastLoginAt: now,
      updatedAt: now,
    }).where(eq(users.id, existing.id)).returning();
    return updated;
  }

  async createWorkspaceWithOwner(input: { name: string; ownerUserId: string }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const [workspace] = await scoped.database.insert(workspaces).values({ name: input.name, ownerUserId: input.ownerUserId }).returning();
      await scoped.database.insert(workspaceMembers).values({ workspaceId: workspace.id, userId: input.ownerUserId, role: "owner" });
      return workspace;
    });
  }

  async ensureWorkspaceWithOwner(input: { name: string; ownerUserId: string }) {
    return this.database.transaction(async (transaction) => {
      const scoped = new BackendRepository(transaction as unknown as AppDatabase);
      const [created] = await scoped.database.insert(workspaces).values(input).onConflictDoNothing().returning();
      if (!created) {
        const existing = await scoped.findWorkspaceOwnedBy(input.ownerUserId, input.name);
        if (!existing) throw new AppError("CONFLICT", "The personal workspace could not be provisioned safely.");
        return { workspace: existing, created: false };
      }
      await scoped.database.insert(workspaceMembers).values({ workspaceId: created.id, userId: input.ownerUserId, role: "owner" });
      return { workspace: created, created: true };
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

  async archiveWorkspace(workspaceId: string) {
    const [workspace] = await this.database.update(workspaces).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(
      eq(workspaces.id, workspaceId),
      isNull(workspaces.archivedAt),
    )).returning();
    return workspace ?? null;
  }

  async findMembership(userId: string, workspaceId: string) {
    const [row] = await this.database.select({ membership: workspaceMembers }).from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
      isNull(workspaces.archivedAt),
    )).limit(1);
    return row?.membership ?? null;
  }

  async listWorkspacesForUser(userId: string, request: PageRequest) {
    const where = [eq(workspaceMembers.userId, userId), isNull(workspaces.archivedAt)];
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(workspaces.createdAt, cursor.createdAt),
        and(eq(workspaces.createdAt, cursor.createdAt), lt(workspaces.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select({ workspace: workspaces, membership: workspaceMembers }).from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(...where))
      .orderBy(desc(workspaces.createdAt), desc(workspaces.id))
      .limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.workspace.createdAt.toISOString()}|${last.workspace.id}` : null };
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

  async listCompaniesForWorkspace(workspaceId: string, request: PageRequest) {
    const where = [eq(companies.workspaceId, workspaceId), isNull(companies.archivedAt)];
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(companies.createdAt, cursor.createdAt),
        and(eq(companies.createdAt, cursor.createdAt), lt(companies.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select().from(companies).where(and(...where)).orderBy(desc(companies.createdAt), desc(companies.id)).limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.createdAt.toISOString()}|${last.id}` : null };
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

  async updateCompany(workspaceId: string, companyId: string, values: { name?: string; industry?: string; currency?: "EUR" | "USD" | "GBP" }) {
    const [company] = await this.database.update(companies).set({ ...values, updatedAt: new Date() }).where(and(
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
    }).onConflictDoNothing({
      target: [financialDatasetVersions.financialDatasetId, financialDatasetVersions.versionNumber],
    }).returning();
    if (!version) {
      throw new AppError("CONFLICT", "A dataset version was created concurrently. Reload the dataset and retry the edit.");
    }
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
        isNull(financialDatasets.archivedAt),
      )).limit(1);
    return row ?? null;
  }

  async listDatasetsForCompany(workspaceId: string, companyId: string, request: PageRequest) {
    const where = [
      eq(financialDatasets.companyId, companyId),
      eq(companies.workspaceId, workspaceId),
      isNull(financialDatasets.archivedAt),
      isNull(companies.archivedAt),
    ];
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(financialDatasets.createdAt, cursor.createdAt),
        and(eq(financialDatasets.createdAt, cursor.createdAt), lt(financialDatasets.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select({ dataset: financialDatasets }).from(financialDatasets)
      .innerJoin(companies, eq(financialDatasets.companyId, companies.id))
      .where(and(...where))
      .orderBy(desc(financialDatasets.createdAt), desc(financialDatasets.id))
      .limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.dataset.createdAt.toISOString()}|${last.dataset.id}` : null };
  }

  async archiveDataset(workspaceId: string, companyId: string, datasetId: string) {
    const [dataset] = await this.database.update(financialDatasets).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(
      eq(financialDatasets.id, datasetId),
      eq(financialDatasets.companyId, companyId),
      isNull(financialDatasets.archivedAt),
      sql`exists (select 1 from ${companies} where ${companies.id} = ${financialDatasets.companyId} and ${companies.workspaceId} = ${workspaceId})`,
    )).returning();
    return dataset ?? null;
  }

  async createAnalysisRun(input: { workspaceId: string; companyId: string; datasetVersionId: string; requestedBy: string; engineVersion: string; idempotencyKey?: string }) {
    const [run] = await this.database.insert(analysisRuns).values({ ...input, status: "pending" }).onConflictDoNothing({
      target: [analysisRuns.workspaceId, analysisRuns.idempotencyKey],
    }).returning();
    return run ?? null;
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
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? encodeAnalysisCursor(last) : null };
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

  async getScenarioForWorkspace(workspaceId: string, scenarioId: string) {
    const [row] = await this.database.select({ scenario: scenarios, assumptions: scenarioAssumptions, result: scenarioResults }).from(scenarios)
      .leftJoin(scenarioAssumptions, eq(scenarioAssumptions.scenarioId, scenarios.id))
      .leftJoin(scenarioResults, eq(scenarioResults.scenarioId, scenarios.id))
      .where(and(eq(scenarios.id, scenarioId), eq(scenarios.workspaceId, workspaceId), isNull(scenarios.archivedAt)))
      .orderBy(desc(scenarioResults.createdAt))
      .limit(1);
    return row ?? null;
  }

  async listScenariosForWorkspace(workspaceId: string, request: PageRequest, companyId?: string): Promise<PageResult<typeof scenarios.$inferSelect>> {
    const where = [eq(scenarios.workspaceId, workspaceId), isNull(scenarios.archivedAt)];
    if (companyId) where.push(eq(scenarios.companyId, companyId));
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(scenarios.createdAt, cursor.createdAt),
        and(eq(scenarios.createdAt, cursor.createdAt), lt(scenarios.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select().from(scenarios).where(and(...where)).orderBy(desc(scenarios.createdAt), desc(scenarios.id)).limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.createdAt.toISOString()}|${last.id}` : null };
  }

  async archiveScenario(workspaceId: string, scenarioId: string) {
    const [scenario] = await this.database.update(scenarios).set({ archivedAt: new Date(), updatedAt: new Date() }).where(and(
      eq(scenarios.id, scenarioId),
      eq(scenarios.workspaceId, workspaceId),
      isNull(scenarios.archivedAt),
    )).returning();
    return scenario ?? null;
  }

  async updateScenario(workspaceId: string, scenarioId: string, values: { name?: string; description?: string | null }) {
    const [scenario] = await this.database.update(scenarios).set({ ...values, updatedAt: new Date() }).where(and(
      eq(scenarios.id, scenarioId),
      eq(scenarios.workspaceId, workspaceId),
      isNull(scenarios.archivedAt),
    )).returning();
    return scenario ?? null;
  }

  async createFileMetadata(input: { workspaceId: string; companyId?: string; uploadedBy: string; originalFilename: string; storageKey: string; mimeType: string; sizeBytes: number; category: "financial_input" | "source_document" | "import" | "report"; checksum: string }) {
    const [file] = await this.database.insert(files).values(input).returning();
    return file;
  }

  async findFileForWorkspace(workspaceId: string, fileId: string) {
    const [file] = await this.database.select().from(files).where(and(eq(files.id, fileId), eq(files.workspaceId, workspaceId), isNull(files.deletedAt))).limit(1);
    return file ?? null;
  }

  async listFilesForWorkspace(workspaceId: string, request: PageRequest, companyId?: string) {
    const where = [eq(files.workspaceId, workspaceId), isNull(files.deletedAt)];
    if (companyId) where.push(eq(files.companyId, companyId));
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(files.createdAt, cursor.createdAt),
        and(eq(files.createdAt, cursor.createdAt), lt(files.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select().from(files).where(and(...where)).orderBy(desc(files.createdAt), desc(files.id)).limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.createdAt.toISOString()}|${last.id}` : null };
  }

  async markFileDeleted(workspaceId: string, fileId: string) {
    const [file] = await this.database.update(files).set({ deletedAt: new Date() }).where(and(
      eq(files.id, fileId),
      eq(files.workspaceId, workspaceId),
      isNull(files.deletedAt),
    )).returning();
    return file ?? null;
  }

  async recordActivity(input: { workspaceId: string; userId?: string; companyId?: string; eventType: string; entityType: string; entityId?: string; metadata?: Record<string, string | number | boolean | null> }) {
    const [event] = await this.database.insert(activityEvents).values({ ...input, metadata: input.metadata ?? {} }).returning();
    return event;
  }

  async listActivityForWorkspace(workspaceId: string, request: PageRequest, companyId?: string) {
    const where = [eq(activityEvents.workspaceId, workspaceId)];
    if (companyId) where.push(eq(activityEvents.companyId, companyId));
    if (request.cursor) {
      const cursor = decodeAnalysisCursor(request.cursor);
      if (!cursor) return { items: [], nextCursor: null };
      const cursorConstraint = or(
        lt(activityEvents.createdAt, cursor.createdAt),
        and(eq(activityEvents.createdAt, cursor.createdAt), lt(activityEvents.id, cursor.id)),
      );
      if (cursorConstraint) where.push(cursorConstraint);
    }
    const items = await this.database.select().from(activityEvents).where(and(...where)).orderBy(desc(activityEvents.createdAt), desc(activityEvents.id)).limit(request.limit + 1);
    const page = items.slice(0, request.limit);
    const last = items.length > request.limit ? page.at(-1) : undefined;
    return { items: page, nextCursor: last ? `${last.createdAt.toISOString()}|${last.id}` : null };
  }
}
