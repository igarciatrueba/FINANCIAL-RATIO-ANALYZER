import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/server/db/schema";
import { AppError } from "@/server/errors";

export type AppDatabase = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: AppDatabase | undefined;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDatabase(): AppDatabase {
  if (database) {
    return database;
  }

  if (!process.env.DATABASE_URL) {
    throw new AppError("CONFIGURATION_ERROR", "Database persistence is not configured.");
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // A managed pooler can reset an idle client; pg removes it after this event.
  pool.on("error", () => undefined);
  database = drizzle({ client: pool, schema });
  return database;
}

export async function closeDatabaseConnection() {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
