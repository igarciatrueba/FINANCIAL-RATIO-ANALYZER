import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { AccountDeletionService } from "@/server/services/account-deletion-service";
import { CompanyService } from "@/server/services/company-service";
import { WorkspaceService } from "@/server/services/workspace-service";
import type { StorageService } from "@/server/storage/types";

class MemoryStorage implements StorageService {
  readonly keys = new Set<string>();
  async upload() {}
  async createSignedUploadUrl() { return "memory://upload"; }
  async download() { return new Uint8Array(); }
  async getSignedUrl() { return "memory://file"; }
  async delete(key: string) { this.keys.delete(key); }
  async exists(key: string) { return this.keys.has(key); }
}

const databases: PGlite[] = [];
afterEach(async () => Promise.all(databases.splice(0).map((database) => database.close())));

async function fixture() {
  const client = new PGlite(); databases.push(client); await applySqlMigrations(client);
  const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
  const workspaces = new WorkspaceService(repository); const companies = new CompanyService(repository);
  const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
  const other = await repository.upsertInternalUser({ provider: "test", providerUserId: "other", email: "other@example.test" });
  const workspace = await workspaces.createPersonalWorkspace(owner.id, "Personal workspace");
  await companies.create(owner.id, workspace.id, { name: "Delete test", industry: "Test", currency: "EUR" });
  const storage = new MemoryStorage(); const key = `workspaces/${workspace.id}/workspace-files/test.pdf`; storage.keys.add(key);
  await repository.createFileMetadata({ workspaceId: workspace.id, uploadedBy: owner.id, originalFilename: "test.pdf", storageKey: key, mimeType: "application/pdf", sizeBytes: 1, category: "source_document", checksum: "a".repeat(64) });
  const auth = { deleteUser: vi.fn(async () => undefined) };
  return { repository, workspaces, owner, other, workspace, storage, auth };
}

describe("account deletion", () => {
  it("removes an eligible personal account and its private files without touching another user", async () => {
    const value = await fixture();
    const service = new AccountDeletionService(value.repository, value.storage, value.auth);
    await service.deleteAccount({ userId: value.owner.id, providerUserId: value.owner.authProviderUserId });
    expect(value.storage.keys.size).toBe(0);
    expect(await value.repository.listAccountDeletionWorkspaces(value.owner.id)).toEqual([]);
    expect(await value.repository.listAccountDeletionWorkspaces(value.other.id)).toEqual([]);
    expect(value.auth.deleteUser).toHaveBeenCalledWith("owner");
  }, 20_000);

  it("blocks deletion when the account belongs to a shared workspace", async () => {
    const value = await fixture();
    await value.workspaces.addMember(value.owner.id, value.workspace.id, value.other.id, "member");
    const service = new AccountDeletionService(value.repository, value.storage, value.auth);
    await expect(service.deleteAccount({ userId: value.owner.id, providerUserId: "owner" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(value.storage.keys.size).toBe(1);
    expect(value.auth.deleteUser).not.toHaveBeenCalled();
  }, 20_000);

  it("blocks an archived shared workspace before deleting personal files", async () => {
    const value = await fixture();
    const shared = await value.workspaces.createPersonalWorkspace(value.other.id, "Shared workspace");
    await value.workspaces.addMember(value.other.id, shared.id, value.owner.id, "member");
    await value.repository.archiveWorkspace(shared.id);
    const service = new AccountDeletionService(value.repository, value.storage, value.auth);
    await expect(service.deleteAccount({ userId: value.owner.id, providerUserId: "owner" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(value.storage.keys.size).toBe(1);
    expect(value.auth.deleteUser).not.toHaveBeenCalled();
  }, 20_000);
});
