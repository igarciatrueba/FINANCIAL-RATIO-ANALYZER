import type { NextRequest } from "next/server";

import { refreshSupabaseSession } from "@/server/auth/supabase-proxy";

export function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
