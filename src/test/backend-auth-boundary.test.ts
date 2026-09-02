// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const { getSupabaseAuthenticatedIdentity } = vi.hoisted(() => ({
  getSupabaseAuthenticatedIdentity: vi.fn(),
}));

vi.mock("@/server/auth/supabase-server", () => ({ getSupabaseAuthenticatedIdentity }));

import { requireAuthenticatedIdentity } from "@/server/auth/require-authenticated-user";

describe("server authentication boundary", () => {
  it("rejects an anonymous request before any workspace operation can resolve an identity", async () => {
    getSupabaseAuthenticatedIdentity.mockResolvedValueOnce(null);

    await expect(requireAuthenticatedIdentity()).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      safeMessage: "Sign in is required for this workspace operation.",
    });
  });
});
