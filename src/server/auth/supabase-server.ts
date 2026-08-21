import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { AuthenticatedIdentity } from "@/server/auth/types";
import { AppError } from "@/server/errors";

function requireSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new AppError("CONFIGURATION_ERROR", "Supabase authentication is not configured.");
  }

  return { url, publishableKey };
}

export async function getSupabaseAuthenticatedIdentity(): Promise<AuthenticatedIdentity | null> {
  const { url, publishableKey } = requireSupabaseEnvironment();
  const cookieStore = await cookies();
  const client = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {
        // Route handlers may apply refreshed cookies; this read-only server boundary does not mutate them.
      },
    },
  });
  const { data, error } = await client.auth.getClaims();

  if (error || !data?.claims?.sub || typeof data.claims.email !== "string") {
    return null;
  }

  return {
    provider: "supabase",
    providerUserId: data.claims.sub,
    email: data.claims.email.toLowerCase(),
    displayName: typeof data.claims.user_metadata?.display_name === "string" ? data.claims.user_metadata.display_name : undefined,
    avatarUrl: typeof data.claims.user_metadata?.avatar_url === "string" ? data.claims.user_metadata.avatar_url : undefined,
  };
}
