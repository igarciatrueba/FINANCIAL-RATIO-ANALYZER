import { describe, expect, it } from "vitest";

import { AppError } from "@/server/errors";
import { canPerformWorkspaceAction, requireWorkspaceAction, type WorkspaceAction } from "@/server/authorization";

describe("workspace authorization", () => {
  it.each<["owner" | "admin" | "member" | "viewer", WorkspaceAction, boolean]>([
    ["owner", "read", true],
    ["owner", "manage-members", true],
    ["owner", "archive-workspace", true],
    ["admin", "manage-company", true],
    ["admin", "manage-members", true],
    ["admin", "archive-workspace", false],
    ["member", "run-analysis", true],
    ["member", "manage-company", true],
    ["member", "manage-members", false],
    ["viewer", "read", true],
    ["viewer", "run-analysis", false],
    ["viewer", "manage-company", false],
  ])("allows %s to %s only when the role matrix permits it", (role, action, expected) => {
    expect(canPerformWorkspaceAction(role, action)).toBe(expected);
  });

  it("returns a stable forbidden error instead of permitting an IDOR-style access", () => {
    expect(() => requireWorkspaceAction("viewer", "manage-company")).toThrowError(AppError);

    try {
      requireWorkspaceAction("viewer", "manage-company");
    } catch (error) {
      expect(error).toMatchObject({ code: "FORBIDDEN" });
    }
  });
});
