import { afterEach, describe, expect, it, vi } from "vitest";

const { getUser, getClaims } = vi.hoisted(() => ({ getUser: vi.fn(), getClaims: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [] }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getUser, getClaims } }) }));
import { getSupabaseAuthenticatedIdentity } from "@/server/auth/supabase-server";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
describe("deleted account session", () => {
  it("rejects an otherwise valid JWT when its Auth user no longer exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    getClaims.mockResolvedValue({ data: { claims: { sub: "deleted", email: "qa@example.test" } }, error: null });
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("User not found") });
    expect(await getSupabaseAuthenticatedIdentity()).toBeNull();
    expect(getUser).toHaveBeenCalledOnce();
  });
  it("retains the verified identity for an existing user", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    getUser.mockResolvedValue({ data: { user: { id: "existing", email: "QA@example.test", user_metadata: {} } }, error: null });
    expect(await getSupabaseAuthenticatedIdentity()).toMatchObject({ providerUserId: "existing", email: "qa@example.test" });
  });
});
