import { migrate } from "drizzle-orm/node-postgres/migrator";

import { closeDatabaseConnection, getDatabase } from "@/server/db/client";

async function main() {
  try {
    await migrate(getDatabase(), { migrationsFolder: "drizzle" });
    console.info("Database migrations completed.");
  } finally {
    await closeDatabaseConnection();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database migrations failed.");
  process.exitCode = 1;
});
