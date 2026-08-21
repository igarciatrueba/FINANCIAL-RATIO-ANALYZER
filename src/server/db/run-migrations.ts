import { migrate } from "drizzle-orm/node-postgres/migrator";

import { getDatabase } from "@/server/db/client";

async function main() {
  await migrate(getDatabase(), { migrationsFolder: "drizzle" });
  console.info("Database migrations completed.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database migrations failed.");
  process.exitCode = 1;
});
