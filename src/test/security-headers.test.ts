import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("security response headers", () => {
  it("sets browser hardening headers without permitting cross-origin framing", async () => {
    const rules = await nextConfig.headers?.();
    const headers = rules?.find((rule) => rule.source === "/:path*")?.headers ?? [];
    const values = new Map(headers.map((header) => [header.key, header.value]));

    expect(values.get("X-Content-Type-Options")).toBe("nosniff");
    expect(values.get("X-Frame-Options")).toBe("DENY");
    expect(values.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(values.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(values.get("Content-Security-Policy")).toContain("object-src 'none'");
  });

  it("marks authenticated workspace pages as private and non-cacheable", async () => {
    const rules = await nextConfig.headers?.();
    const workspaceRootHeaders = rules?.find((rule) => rule.source === "/workspace")?.headers ?? [];
    const workspaceHeaders = rules?.find((rule) => rule.source === "/workspace/:path*")?.headers ?? [];
    const rootValues = new Map(workspaceRootHeaders.map((header) => [header.key, header.value]));
    const nestedValues = new Map(workspaceHeaders.map((header) => [header.key, header.value]));

    expect(rootValues.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(nestedValues.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
