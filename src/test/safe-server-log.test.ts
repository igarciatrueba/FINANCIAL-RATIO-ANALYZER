import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import { logSafeServerFailure } from "@/server/observability/safe-server-log";

afterEach(() => vi.restoreAllMocks());

describe("safe production failure logging", () => {
  it("logs only an event and safe code for unexpected server failures", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logSafeServerFailure("annual_report_extraction_failed", new Error("postgres://secret-user:secret-password@example.test"));

    expect(error).toHaveBeenCalledWith(JSON.stringify({ event: "annual_report_extraction_failed", code: "UNEXPECTED" }));
    expect(JSON.stringify(error.mock.calls)).not.toContain("secret-password");
  });

  it("does not log expected client-facing validation failures", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logSafeServerFailure("workspace_action_failed", new AppError("VALIDATION_ERROR", "Upload a valid PDF document."));

    expect(error).not.toHaveBeenCalled();
  });
});
