import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";

import { applySqlMigrations } from "@/server/db/migrations";

const databases: PGlite[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

async function createMigratedDatabase() {
  const database = new PGlite();
  databases.push(database);
  await applySqlMigrations(database);
  return database;
}

describe("account and workspace schema", () => {
  it("creates the full relational persistence model on a clean PostgreSQL database", async () => {
    const database = await createMigratedDatabase();
    const tables = await database.query<{ table_name: string }>(`
      select table_name from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    expect(tables.rows.map((row) => row.table_name)).toEqual(expect.arrayContaining([
      "users", "workspaces", "workspace_members", "companies", "financial_datasets", "financial_dataset_versions",
      "financial_statements", "financial_statement_values", "analysis_runs", "analysis_results", "scenarios",
      "scenario_assumptions", "scenario_results", "files", "activity_events",
    ]));
  });

  it("enforces workspace membership and dataset-version uniqueness with database constraints", async () => {
    const database = await createMigratedDatabase();
    const userId = "00000000-0000-4000-8000-000000000001";
    const workspaceId = "00000000-0000-4000-8000-000000000002";
    await database.exec(`insert into users (id, auth_provider, auth_provider_user_id, email) values ('${userId}', 'test', 'identity-a', 'a@example.test')`);
    await database.exec(`insert into workspaces (id, name, owner_user_id) values ('${workspaceId}', 'Personal', '${userId}')`);

    await database.exec(`insert into workspace_members (id, workspace_id, user_id, role) values ('00000000-0000-4000-8000-000000000003', '${workspaceId}', '${userId}', 'owner')`);
    await expect(database.exec(`insert into workspace_members (id, workspace_id, user_id, role) values ('00000000-0000-4000-8000-000000000004', '${workspaceId}', '${userId}', 'owner')`)).rejects.toThrow();

    await database.exec(`insert into companies (id, workspace_id, name, industry, currency, created_by) values ('00000000-0000-4000-8000-000000000005', '${workspaceId}', 'Demo', 'Software', 'EUR', '${userId}')`);
    await database.exec(`insert into financial_datasets (id, company_id, name, created_by) values ('00000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000005', 'FY 2022-2024', '${userId}')`);
    await database.exec(`insert into financial_dataset_versions (id, financial_dataset_id, version_number, source_type, canonical_input, created_by) values ('00000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000006', 1, 'manual', '{}', '${userId}')`);
    await expect(database.exec(`insert into financial_dataset_versions (id, financial_dataset_id, version_number, source_type, canonical_input, created_by) values ('00000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000006', 1, 'manual', '{}', '${userId}')`)).rejects.toThrow();
    await expect(database.exec(`insert into analysis_runs (id, workspace_id, company_id, dataset_version_id, engine_version) values ('00000000-0000-4000-8000-000000000009', '${workspaceId}', '00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000099', 'test')`)).rejects.toThrow();
  });
});
