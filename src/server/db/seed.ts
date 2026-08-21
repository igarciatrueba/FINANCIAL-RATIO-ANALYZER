import { getDatabase } from "@/server/db/client";
import { seedDevelopmentWorkspace } from "@/server/db/seed-development-data";
import { BackendRepository } from "@/server/repositories/backend-repository";

async function main() {
  const seeded = await seedDevelopmentWorkspace(new BackendRepository(getDatabase()));
  console.info(`Development seed completed for workspace ${seeded.workspace.id}.`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Development seed failed.");
  process.exitCode = 1;
});
