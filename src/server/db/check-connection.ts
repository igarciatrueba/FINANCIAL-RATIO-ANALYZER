import { sql } from "drizzle-orm";

import { getDatabase } from "@/server/db/client";

async function main() {
  await getDatabase().execute(sql`select 1 as database_connection`);
  console.info("Database connectivity check passed.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database connectivity check failed.");
  process.exitCode = 1;
});
