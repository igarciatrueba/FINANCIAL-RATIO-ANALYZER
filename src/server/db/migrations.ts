import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export type SqlMigrationClient = {
  exec(statement: string): Promise<unknown>;
};

export async function readSqlMigrations(migrationsDirectory = join(process.cwd(), "drizzle")) {
  const entries = await readdir(migrationsDirectory);
  const migrationFiles = entries.filter((entry) => entry.endsWith(".sql")).sort();

  return Promise.all(migrationFiles.map(async (fileName) => ({
    fileName,
    statements: (await readFile(join(migrationsDirectory, fileName), "utf8"))
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean),
  })));
}

export async function applySqlMigrations(client: SqlMigrationClient, migrationsDirectory?: string) {
  const migrations = await readSqlMigrations(migrationsDirectory);

  for (const migration of migrations) {
    for (const statement of migration.statements) {
      await client.exec(statement);
    }
  }

  return migrations.map((migration) => migration.fileName);
}
