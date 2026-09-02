import { describe, expect, it } from "vitest";

import { getSafeAuthReturnPath } from "@/features/accounts/lib/auth-return-path";

describe("authentication return paths", () => {
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\\\evil.example",
    "/%5C%5Cevil.example",
    "/%252F%252Fevil.example",
    "javascript:alert(1)",
  ])("rejects an external or encoded external return path: %s", (candidate) => {
    expect(getSafeAuthReturnPath(candidate)).toBe("/workspace");
  });

  it("preserves a relative in-product return path", () => {
    expect(getSafeAuthReturnPath("/workspace/files?cursor=next#private-files")).toBe("/workspace/files?cursor=next#private-files");
  });
});
