import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, describe, expect, it } from "vitest";

import type { AppDatabase } from "@/server/db/client";
import { seedDevelopmentWorkspace } from "@/server/db/seed-development-data";
import { applySqlMigrations } from "@/server/db/migrations";
import * as schema from "@/server/db/schema";
import { BackendRepository } from "@/server/repositories/backend-repository";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe("development database seed", () => {
  it("creates an idempotent personal workspace with both fictional demo datasets on a clean database", async () => {
    const client = new PGlite();
    databases.push(client);
    await applySqlMigrations(client);
    const repository = new BackendRepository(drizzle(client, { schema }) as unknown as AppDatabase);

    const first = await seedDevelopmentWorkspace(repository);
    const second = await seedDevelopmentWorkspace(repository);
    const persistedCompanies = await repository.listCompaniesForWorkspace(first.workspace.id);
    const persistedDatasets = await Promise.all(persistedCompanies.map((company) => repository.listDatasetsForCompany(first.workspace.id, company.id)));

    expect(second.workspace.id).toBe(first.workspace.id);
    expect(persistedCompanies.map((company) => company.name).sort()).toEqual(["Atlas Manufacturing Group", "NovaTech Solutions"]);
    expect(persistedDatasets.flat()).toHaveLength(2);
  }, 20_000);
});
