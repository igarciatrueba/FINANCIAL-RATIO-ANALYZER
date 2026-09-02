import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { AnnualReportUpload } from "@/features/annual-report-ingestion/components/annual-report-upload";

const { abortDirectUploadAction, completeAnnualReportUploadAction, prepareAnnualReportUploadAction } = vi.hoisted(() => ({
  abortDirectUploadAction: vi.fn(),
  completeAnnualReportUploadAction: vi.fn(),
  prepareAnnualReportUploadAction: vi.fn(),
}));

vi.mock("@/app/workspace/actions", () => ({ abortDirectUploadAction, completeAnnualReportUploadAction, prepareAnnualReportUploadAction }));

describe("annual-report authenticated upload", () => {
  it("sends a selected PDF to the authenticated private extraction flow and returns its review draft", async () => {
    const user = userEvent.setup();
    const onDraftReady = vi.fn();
    const draft = {
      runId: "run-1",
      sourceFileId: "file-1",
      sourceFileName: "annual-report.pdf",
      documentSummary: {},
      periodSlots: [
        { slotIndex: 0 as const, fiscalPeriod: null, resolution: "manual_input_required" as const },
        { slotIndex: 1 as const, fiscalPeriod: { label: "2023", year: 2023 }, resolution: "resolved" as const },
        { slotIndex: 2 as const, fiscalPeriod: { label: "2024", year: 2024 }, resolution: "resolved" as const },
      ],
      candidates: [],
      fields: [],
    };
    prepareAnnualReportUploadAction.mockResolvedValue({ uploadUrl: "https://storage.example.test/upload", ticket: "opaque-upload-ticket" });
    completeAnnualReportUploadAction.mockResolvedValue({ draft });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<AnnualReportUpload onDraftReady={onDraftReady} session={{ status: "authenticated", user: {} as User }} />);

    const file = new File(["%PDF-test"], "annual-report.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/select annual-report pdf/i), file);
    await user.click(screen.getByRole("button", { name: /extract pdf values/i }));

    await waitFor(() => expect(prepareAnnualReportUploadAction).toHaveBeenCalledWith({
      originalFilename: "annual-report.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    }));
    expect(fetch).toHaveBeenCalledWith("https://storage.example.test/upload", expect.objectContaining({
      body: file,
      method: "PUT",
    }));
    expect(completeAnnualReportUploadAction).toHaveBeenCalledWith("opaque-upload-ticket");
    expect(onDraftReady).toHaveBeenCalledWith(draft);
    expect(screen.getByRole("status")).toHaveTextContent(/pdf evidence prepared for review/i);
  });
});
