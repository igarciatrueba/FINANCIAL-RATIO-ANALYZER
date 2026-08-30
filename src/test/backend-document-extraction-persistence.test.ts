import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { WorkspaceService } from "@/server/services/workspace-service";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe("document extraction draft persistence", () => {
  it("retains original PDF evidence when a user overrides a draft field", async () => {
    const client = new PGlite();
    databases.push(client);
    await applySqlMigrations(client);
    const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
    const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
    const workspace = await new WorkspaceService(repository).createPersonalWorkspace(owner.id, "Owner workspace");
    const file = await repository.createFileMetadata({
      workspaceId: workspace.id,
      uploadedBy: owner.id,
      originalFilename: "annual-report.pdf",
      storageKey: `workspaces/${workspace.id}/workspace-files/report.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 100,
      category: "source_document",
      checksum: "a".repeat(64),
    });

    const run = await repository.createDocumentExtractionRun({
      workspaceId: workspace.id,
      fileId: file.id,
      requestedBy: owner.id,
      engineVersion: "annual-report-extractor@1",
      documentSummary: { periodSlots: [{ fiscalPeriod: null }] },
    });
    const candidate = await repository.createDocumentExtractionCandidate({
      runId: run.id,
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      candidateKind: "direct",
      normalizedValue: "4725000000",
      confidence: "high",
      sourceEvidence: { pageNumber: 84, sourceLabel: "Revenue", rawValue: "4,725" },
    });
    await repository.upsertDocumentExtractionDraftField({
      runId: run.id,
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      currentCandidateId: candidate.id,
      originalCandidateId: candidate.id,
      provenanceType: "PDF_EXTRACTED",
      reviewState: "UNREVIEWED",
      formValue: "4725000000",
    });
    await repository.upsertDocumentExtractionDraftField({
      runId: run.id,
      canonicalFieldKey: "revenue",
      periodSlotIndex: 2,
      currentCandidateId: undefined,
      originalCandidateId: candidate.id,
      provenanceType: "USER_OVERRIDE",
      reviewState: "USER_CONFIRMED",
      formValue: "4700000000",
    });

    const recovered = await repository.getDocumentExtractionRunForWorkspace(workspace.id, run.id);

    expect(recovered?.draftFields).toEqual([
      expect.objectContaining({
        formValue: "4700000000",
        provenanceType: "USER_OVERRIDE",
        originalCandidateId: candidate.id,
      }),
    ]);
    expect(Number(recovered?.candidates[0]?.normalizedValue)).toBe(4_725_000_000);
  }, 20_000);
});
