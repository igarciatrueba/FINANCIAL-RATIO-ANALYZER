import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "@/server/db/client";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { BackendRepository } from "@/server/repositories/backend-repository";
import { ActivityService } from "@/server/services/activity-service";
import { CompanyService } from "@/server/services/company-service";
import { FileService } from "@/server/services/file-service";
import { readDirectUploadTicket } from "@/server/storage/direct-upload-ticket";
import { WorkspaceService } from "@/server/services/workspace-service";
import type { StorageService } from "@/server/storage/types";

class MemoryStorage implements StorageService {
  readonly objects = new Map<string, Uint8Array>();

  async upload(input: { key: string; body: Uint8Array }) {
    this.objects.set(input.key, input.body);
  }

  async createSignedUploadUrl(key: string) {
    return `memory://private/${key}`;
  }

  async download(key: string) {
    const object = this.objects.get(key);
    if (!object) throw new AppError("STORAGE_ERROR", "Missing test object.");
    return object;
  }

  async getSignedUrl(key: string) {
    if (!this.objects.has(key)) throw new AppError("STORAGE_ERROR", "Missing test object.");
    return `memory://private/${key}`;
  }

  async delete(key: string) {
    this.objects.delete(key);
  }

  async exists(key: string) {
    return this.objects.has(key);
  }
}

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function createFixture() {
  const client = new PGlite();
  databases.push(client);
  await applySqlMigrations(client);
  const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);
  const workspaces = new WorkspaceService(repository);
  const companies = new CompanyService(repository);
  const storage = new MemoryStorage();
  const owner = await repository.upsertInternalUser({ provider: "test", providerUserId: "owner", email: "owner@example.test" });
  const outsider = await repository.upsertInternalUser({ provider: "test", providerUserId: "outsider", email: "outsider@example.test" });
  const workspace = await workspaces.createPersonalWorkspace(owner.id, "Owner workspace");
  const company = await companies.create(owner.id, workspace.id, {
    name: "NovaTech Solutions",
    industry: "Enterprise Software",
    currency: "EUR",
  });
  return { repository, owner, outsider, workspace, company, storage };
}

describe("private file persistence", () => {
  it("finalizes a server-authorized direct upload only after the server verifies the received byte size", async () => {
    vi.stubEnv("UPLOAD_TICKET_SECRET", "test-secret-with-adequate-length");
    const fixture = await createFixture();
    const service = new FileService(fixture.repository, fixture.storage);
    const body = new Uint8Array([1, 2, 3]);

    const prepared = await service.prepareDirectUpload(fixture.owner.id, fixture.workspace.id, {
      companyId: fixture.company.id,
      originalFilename: "financial-source.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      sizeBytes: body.byteLength,
    });
    const ticket = readDirectUploadTicket(prepared.ticket);
    fixture.storage.objects.set(ticket.storageKey, body);

    const stored = await service.completeDirectUpload(fixture.owner.id, fixture.workspace.id, prepared.ticket);

    expect(prepared.uploadUrl).toContain("memory://");
    expect(stored.sizeBytes).toBe(body.byteLength);
    expect(stored.checksum).toHaveLength(64);
  }, 20_000);

  it("deletes a direct-upload object when its received size differs from the signed authorization", async () => {
    vi.stubEnv("UPLOAD_TICKET_SECRET", "test-secret-with-adequate-length");
    const fixture = await createFixture();
    const service = new FileService(fixture.repository, fixture.storage);
    const prepared = await service.prepareDirectUpload(fixture.owner.id, fixture.workspace.id, {
      originalFilename: "financial-source.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      sizeBytes: 3,
    });
    const ticket = readDirectUploadTicket(prepared.ticket);
    fixture.storage.objects.set(ticket.storageKey, new Uint8Array([1, 2]));

    await expect(service.completeDirectUpload(fixture.owner.id, fixture.workspace.id, prepared.ticket)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      safeMessage: "The uploaded file size could not be verified.",
    });
    expect(await fixture.storage.exists(ticket.storageKey)).toBe(false);
  }, 20_000);

  it("uses scoped generated keys and denies a foreign workspace file lookup", async () => {
    const fixture = await createFixture();
    const service = new FileService(fixture.repository, fixture.storage);
    const file = await service.upload(fixture.owner.id, fixture.workspace.id, {
      companyId: fixture.company.id,
      originalFilename: "financial-source.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      body: new Uint8Array([1, 2, 3]),
    });

    expect(file.storageKey).toMatch(new RegExp(`^workspaces/${fixture.workspace.id}/companies/${fixture.company.id}/`));
    expect(file.storageKey).not.toContain("financial-source.pdf");
    await expect(service.getSignedUrl(fixture.outsider.id, fixture.workspace.id, file.id)).rejects.toMatchObject({ code: "FORBIDDEN" } satisfies Partial<AppError>);
  }, 20_000);

  it("rejects unsafe file names before touching private storage", async () => {
    const fixture = await createFixture();
    const service = new FileService(fixture.repository, fixture.storage);

    await expect(service.upload(fixture.owner.id, fixture.workspace.id, {
      originalFilename: "../../private.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      body: new Uint8Array([1]),
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<AppError>);
    expect(fixture.storage.objects.size).toBe(0);
  }, 20_000);

  it("soft-deletes metadata, removes private storage and records the deletion", async () => {
    const fixture = await createFixture();
    const service = new FileService(fixture.repository, fixture.storage);
    const activity = new ActivityService(fixture.repository);
    const file = await service.upload(fixture.owner.id, fixture.workspace.id, {
      companyId: fixture.company.id,
      originalFilename: "financial-source.pdf",
      mimeType: "application/pdf",
      category: "source_document",
      body: new Uint8Array([1, 2, 3]),
    });

    await service.delete(fixture.owner.id, fixture.workspace.id, file.id);

    expect(await fixture.storage.exists(file.storageKey)).toBe(false);
    await expect(service.getSignedUrl(fixture.owner.id, fixture.workspace.id, file.id)).rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<AppError>);
    expect((await service.list(fixture.owner.id, fixture.workspace.id, { limit: 10 })).items).toHaveLength(0);
    expect((await activity.list(fixture.owner.id, fixture.workspace.id, { limit: 10 })).items.map((event) => event.eventType)).toContain("file.deleted");
  }, 20_000);
});
