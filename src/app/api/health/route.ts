import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase, isDatabaseConfigured } from "@/server/db/client";
import { logSafeServerFailure } from "@/server/observability/safe-server-log";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ status: "not-configured" }, { status: 503 });
  }

  try {
    await getDatabase().execute(sql`select 1 as database_connection`);
    return NextResponse.json({ status: "ready" });
  } catch (error) {
    logSafeServerFailure("health_check_database_unavailable", error);
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
